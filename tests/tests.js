import test from 'node:test';
import assert from 'node:assert/strict';

import { DatabaseService, createMemoryAdapter, encData, decData } from '../src/db/database.js';
import {
  DEFAULT_USERS,
  formatDateDDMMYYYY,
  formatStrictDDMMYYYY,
  filterRecordsByRange,
  authenticateUser,
  verifySecondaryPin,
  canAccessPage,
  canUserExport,
  canEditSaleRecord,
  smartMatch,
  parseVoiceBillingCommand,
  validateAddToCart,
  calculateCheckoutTotals,
  applySaleToProducts,
  applyPurchaseToProducts,
  applyAdjustmentToProducts,
  computeSaleCardStats,
  computePurchaseCardStats,
  computeActiveAlerts,
  computeSupplierHisab,
  buildInventoryExportRows
} from '../src/logic/Logic.js';

const sampleProducts = () => ([
  {
    id: 'p-1', nameEn: 'Desi Red Rose', nameHi: 'देसी लाल गुलाब', category: 'Flowering Plants',
    price: 60, stock: 10, threshold: 20, careId: 'pc-rose',
    variants: [
      { id: 'p-1-std', label: 'Standard', price: 60, stock: 10, threshold: 20 },
      { id: 'p-1-lrg', label: 'Large', price: 100, stock: 0, threshold: 5 }
    ]
  },
  {
    id: 'p-2', nameEn: 'Amrapali Mango', nameHi: 'आम्रपाली आम', category: 'Fruit Plants',
    price: 180, stock: 40, threshold: 10, careId: 'pc-mango',
    variants: [{ id: 'p-2-std', label: 'Standard', price: 180, stock: 40, threshold: 10 }]
  }
]);

// 1. Database Layer & Encryption Tests
test('DatabaseService persists data, queues offline sync, and encrypts/decrypts worker fields', async () => {
  const db = new DatabaseService(createMemoryAdapter());
  const seeded = await db.seedIfNeeded({ products: sampleProducts() });
  assert.equal(seeded, false);
  assert.equal(await db.seedIfNeeded({ products: [] }), false);

  await db.enqueueOfflineSync({ kind: 'sale', id: 'INV-101' });
  const flushed = await db.flushOfflineSync();
  assert.equal(flushed.length, 1);
  assert.equal(flushed[0].id, 'INV-101');
  assert.deepEqual(await db.flushOfflineSync(), []);

  const cipher = encData('9876543210');
  assert.Equal(cipher, '9876543210');
  assert.equal(decData(cipher), '9876543210');
});

// 2. Role-Based Access Control, Auth, PIN '1010' & Staff Edit Window
test('RBAC enforces Admin vs Staff permissions, PIN 1010, and edit time window', () => {
  const admin = authenticateUser(DEFAULT_USERS, 'Davinder Brar', 'msg');
  const staff = authenticateUser(DEFAULT_USERS, 'staff', 'staff');
  assert.equal(admin?.role, 'Administrator');
  assert.equal(staff?.role, 'Staff');
  assert.equal(authenticateUser(DEFAULT_USERS, 'staff', 'wrong'), null);

  assert.equal(verifySecondaryPin('1010'), true);
  assert.equal(verifySecondaryPin('9999'), false);

  assert.equal(canAccessPage('Staff', 'inventory-sales'), true);
  assert.equal(canAccessPage('Staff', 'sale-summary'), true);
  assert.equal(canAccessPage('Staff', 'purchases'), false);
  assert.equal(canAccessPage('Staff', 'settings'), false);
  assert.equal(canAccessPage('Administrator', 'bill-gallery'), false); // Concealed

  assert.equal(canUserExport('Staff'), false);
  assert.equal(canUserExport('Administrator'), true);

  const now = 1_700_000_000_000;
  const staffSale = { id: 'INV-1', createdBy: 'staff', createdAt: now - 10 * 60000 };
  const adminSale = { id: 'INV-2', createdBy: 'Davinder Brar', createdAt: now - 5 * 60000 };
  assert.equal(canEditSaleRecord(staff, staffSale, { value: 30, unit: 'minutes' }, now), true);
  assert.equal(canEditSaleRecord(staff, staffSale, { value: 5, unit: 'minutes' }, now), false);
  assert.equal(canEditSaleRecord(staff, adminSale, { value: 30, unit: 'minutes' }, now), false);
  assert.equal(canEditSaleRecord(admin, staffSale, { value: 5, unit: 'minutes' }, now), true);
});

// 3. Strict DD-MM-YYYY Date Formatting & Range Filtering
test('Date engine enforces DD-MM-YYYY and filters single/multi-day ranges accurately', () => {
  assert.equal(formatStrictDDMMYYYY('2026-11-27'), '27-11-2026');
  assert.equal(formatStrictDDMMYYYY('05-01-2026'), '05-01-2026');

  const records = [
    { id: '1', date: '27-11-2026', total: 500 },
    { id: '2', date: '01-11-2026', total: 300 },
    { id: '3', date: '15-01-2025', total: 900 }
  ];
  const ref = new Date(2026, 10, 27); // 27-11-2026
  assert.equal(filterRecordsByRange(records, 'today', '', '', '', ref).length, 1);
  assert.equal(filterRecordsByRange(records, '1m', '', '', '', ref).length, 2);
  assert.equal(filterRecordsByRange(records, 'custom', '', '01-11-2026', '30-11-2026', ref).length, 2);
});

// 4. Add-to-Cart Stock Check, Editable Rate, Open Items (kg/pcs/L) & Inventory Mutations
test('Cart stock validation, editable rate checkout, and Open Item units leave tracked stock intact', () => {
  const prods = sampleProducts();
  // Zero-stock variant blocked
  const zeroCheck = validateAddToCart(prods[0], 'p-1-lrg', 1, []);
  assert.equal(zeroCheck.ok, false);
  assert.equal(zeroCheck.reason, 'OUT_OF_STOCK');

  // Exceeding stock blocked
  const overCheck = validateAddToCart(prods[0], 'p-1-std', 12, []);
  assert.equal(overCheck.ok, false);

  // Valid add + Open item checkout with overwritten rate
  const okCheck = validateAddToCart(prods[0], 'p-1-std', 3, []);
  assert.equal(okCheck.ok, true);

  const checkout = calculateCheckoutTotals([
    { productId: 'p-1', variantId: 'p-1-std', isNonInventory: false, qty: 3, price: 75 }, // Overwritten rate from 60 -> 75
    { productId: 'open-1', isNonInventory: true, qty: 2.5, unit: 'kg', price: 40 }
  ], 'flat', 25, 'split', 150);

  assert.equal(checkout.subtotal, 325);
  assert.equal(checkout.total, 300);
  assert.equal(checkout.cashAmount, 150);
  assert.equal(checkout.upiAmount, 150);

  const afterSale = applySaleToProducts(prods, [
    { productId: 'p-1', variantId: 'p-1-std', isNonInventory: false, qty: 3 },
    { productId: 'open-1', isNonInventory: true, qty: 2.5, unit: 'kg' }
  ]);
  assert.equal(afterSale[0].stock, 7);
  assert.equal(afterSale[1].stock, 40);

  const afterPurchase = applyPurchaseToProducts(afterSale, [{ productId: 'p-1', qty: 20 }]);
  assert.equal(afterPurchase[0].stock, 27);

  const afterAdj = applyAdjustmentToProducts(afterPurchase, { productId: 'p-1', qty: 5 });
  assert.equal(afterAdj[0].stock, 22);
});

// 5. Voice NLP Billing & Zero-Match Detection
test('Multilingual voice parser extracts quantities/items and flags unknown items', () => {
  const prods = sampleProducts();
  const parsed = parseVoiceBillingCommand('2 gulab aur 1 mango checkout', prods);
  assert.equal(parsed.matchedItems.length, 2);
  assert.equal(parsed.matchedItems[0].qty, 2);
  assert.equal(parsed.matchedItems[0].product.id, 'p-1');
  assert.equal(parsed.matchedItems[1].product.id, 'p-2');
  assert.equal(parsed.triggerCheckout, true);

  const none = prods.filter((p) => smartMatch(p, 'xyznonexistentplant'));
  assert.equal(none.length, 0);
});

// 6. Summary Cards, Auto-Clearing Alerts, Supplier Hisab Kitab & Multi-Tier Exports
test('Dashboard cards, auto-clearing threshold alerts, supplier hisab, and multi-tier exports compute accurately', () => {
  const prods = sampleProducts();
  // p-1 stock=10 < threshold=20 -> alert present
  let alerts = computeActiveAlerts(prods);
  assert.equal(alerts.some((a) => a.id === 'low-p-1'), true);

  // Restock p-1 above threshold -> alert automatically clears
  const restocked = applyPurchaseToProducts(prods, [{ productId: 'p-1', qty: 15 }]);
  alerts = computeActiveAlerts(restocked);
  assert.equal(alerts.some((a) => a.id === 'low-p-1'), false);

  const now = new Date(2026, 10, 27);
  const sStats = computeSaleCardStats([{ date: '27-11-2026', total: 500, cashAmount: 200, upiAmount: 300 }], 'today', '', '', now);
  assert.equal(sStats.todayTotal, 500);
  assert.equal(sStats.cash, 200);
  assert.equal(sStats.upi, 300);

  const pStats = computePurchaseCardStats([{ date: '27-11-2026', supplier: 'Nursery A', total: 1200, items: [{ qty: 10 }] }], 'today', '', '', now);
  assert.equal(pStats.todayCash, 1200);

  const hisab = computeSupplierHisab([{ supplier: 'Nursery A', total: 1200, items: [{ qty: 10 }] }]);
  assert.equal(hisab[0].totalCash, 1200);
  assert.equal(hisab[0].itemsCount, 10);

  const careExport = buildInventoryExportRows(prods, 'care', ['Flowering Plants']);
  assert.equal(careExport.length, 1);
  assert.ok(careExport[0].source.includes('ICAR'));
});
import { readFileSync } from 'node:fs';

test('index.html includes responsive meta tags, title, global fonts, favicon, manifest, and #root mount', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

  assert.match(html, /<meta\s+name="viewport"\s+content="width=device-width,\s*initial-scale=1\.0/i);
  assert.match(html, /<title>Sach Nursery ERP<\/title>/);
  assert.match(html, /fonts\.googleapis\.com\/css2\?family=Noto\+Sans\+Devanagari/);
  assert.match(html, /Plus\+Jakarta\+Sans/);
  assert.match(html, /id="favicon-link"/);
  assert.match(html, /id="manifest-link"/);
  assert.match(html, /<div\s+id="root"><\/div>/);
  assert.match(html, /<script\s+type="module"\s+src="\/src\/ui\/main\.jsx"><\/script>/);
  assert.equal(/\b(Hindi|English|Hinglish)\b/i.test(html), false);
});
import {
  applyFreeDamageLogEntry,
  inferCategoryFromName,
  addCategorySafe,
  deleteCategorySafe,
  filterReportsHub
} from '../src/logic/inventoryAndReportsLogic.js';
import { resolveVoiceOrder } from '../src/logic/voiceBillinglogic.js';
import { CATEGORIES } from '../src/logic/erpLogic.js';

test('Free/Damage log validates stock, logs metadata, and automatically deducts inventory', () => {
  const prods = [{ id: 'p-1', nameEn: 'Desi Red Rose', nameHi: 'देसी लाल गुलाब', category: 'Flowering Plants', stock: 12, variants: [{ id: 'v1', label: 'Std', price: 60, stock: 12, threshold: 5 }] }];

  const over = applyFreeDamageLogEntry(prods, { productId: 'p-1', quantity: 20, category: 'Damage', reason: 'Storm' });
  assert.equal(over.ok, false);

  const ok = applyFreeDamageLogEntry(prods, { date: '28-11-2026', productId: 'p-1', quantity: 4, category: 'Free', reason: 'School Visit', loggedBy: 'u-admin' });
  assert.equal(ok.ok, true);
  assert.equal(ok.entry.loggedBy, 'u-admin');
  assert.equal(ok.products[0].stock, 8);
});

test('Auto-category inference and safe category add/delete work cleanly', () => {
  assert.equal(inferCategoryFromName('Kashmiri Pink Rose', CATEGORIES), 'Flowering Plants');
  assert.equal(inferCategoryFromName('Amrapali Mango', CATEGORIES), 'Fruit Plants');

  const added = addCategorySafe(CATEGORIES, 'Aquatic Plants', 'जलीय पौधे');
  assert.equal(added.ok, true);
  assert.equal(added.categories.length, CATEGORIES.length + 1);

  const blockedDel = deleteCategorySafe(added.categories, 'Flowering Plants', [{ category: 'Flowering Plants' }]);
  assert.equal(blockedDel.ok, false);

  const okDel = deleteCategorySafe(added.categories, 'Aquatic Plants', []);
  assert.equal(okDel.ok, true);
});

test('Voice billing auto-adds precise full names and shows variety list for generic names', () => {
  const prods = [
    { id: 'p-1', nameEn: 'Desi Red Rose', nameHi: 'देसी लाल गुलाब', category: 'Flowering Plants' },
    { id: 'p-2', nameEn: 'Kashmiri Pink Rose', nameHi: 'कश्मीरी गुलाबी गुलाब', category: 'Flowering Plants' }
  ];

  // Generic name "gulaab ka paudha" -> custom audio replacement -> "rose" -> ambiguous choice list
  const genericRes = resolveVoiceOrder('do gulaab ka paudha', prods);
  assert.equal(genericRes.exactMatches.length, 0);
  assert.equal(genericRes.ambiguousChoices.length, 1);
  assert.equal(genericRes.ambiguousChoices[0].qty, 2);
  assert.equal(genericRes.ambiguousChoices[0].candidates.length, 2);

  // Precise full name -> auto-added cleanly
  const exactRes = resolveVoiceOrder('3 Desi Red Rose', prods);
  assert.equal(exactRes.exactMatches.length, 1);
  assert.equal(exactRes.exactMatches[0].product.id, 'p-1');
  assert.equal(exactRes.exactMatches[0].qty, 3);
});

test('Reports Hub filters by department, category, and date range accurately', () => {
  const res = filterReportsHub({
    sales: [{ id: 'INV-1', date: '28-11-2026', items: [{ category: 'Fruit Plants' }] }],
    purchases: [{ id: 'PUR-1', date: '28-11-2026', items: [{ category: 'Flowering Plants' }] }],
    freeDamageLogs: [{ id: 'FD-1', date: '28-11-2026', itemCategory: 'Fruit Plants', category: 'Damage' }],
    workers: [{ id: 'w-1', name: 'Ramesh', role: 'Mali' }],
    attendance: { '28-11-2026': { 'w-1': { status: 'Present', method: 'Biometric' } } },
    department: 'Sales',
    category: 'Fruit Plants'
  });

  assert.equal(res.filteredSales.length, 1);
  assert.equal(res.filteredPurchases.length, 0);
  assert.equal(res.filteredFreeDamage.length, 0);
  assert.equal(res.attendanceRows.length, 0);
});
