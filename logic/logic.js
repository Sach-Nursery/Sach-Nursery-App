// Pure Business Logic Layer (Zero React, Zero DOM, Zero Storage Dependencies)

export const SECONDARY_PIN = '1010';

export const DEFAULT_USERS = [
  { id: 'u-admin', username: 'Davinder Brar', password: 'msg', role: 'Administrator', active: true, isPrimary: true },
  { id: 'u-staff', username: 'staff', password: 'staff', role: 'Staff', active: true, isPrimary: false }
];

export const CATEGORIES = [
  { en: 'Flowering Plants', hi: 'फूल वाले पौधे' },
  { en: 'Fruit Plants', hi: 'फलदार पौधे' },
  { en: 'Medicinal & Herbs', hi: 'औषधीय व जड़ी-बूटी' },
  { en: 'Indoor & Ornamental', hi: 'इनडोर व सजावटी पौधे' },
  { en: 'Trees & Avenue', hi: 'वृक्ष व छायादार पौधे' },
  { en: 'Succulents & Cacti', hi: 'रसदार व कैक्टस' },
  { en: 'Climbers & Creepers', hi: 'बेल व लताएं' },
  { en: 'Seeds & Fertilizers', hi: 'बीज व जैविक खाद' },
];

export const PLANT_CARE_PROFILES = {
  'pc-rose': { botanical: 'Rosa indica', season: 'अक्टूबर – फरवरी (सर्दियाँ व वसंत)', soil: 'अच्छी जल निकासी वाली दोमट मिट्टी (pH 6.0–6.5)।', water: 'सप्ताह में 3–4 बार जड़ों के पास गहरा पानी दें।', sunlight: 'प्रतिदिन 6+ घंटे सीधी धूप।', fertilizer: 'मासिक वर्मीकम्पोस्ट और बोन मील दें।', care: 'सर्दियों के बाद सूखी टहनियों की छंटाई करें।', source: 'ICAR – Indian Institute of Horticultural Research (IIHR), Bengaluru' },
  'pc-tulsi': { botanical: 'Ocimum tenuiflorum', season: 'फरवरी – अप्रैल एवं जुलाई – अगस्त', soil: 'जैविक खाद युक्त हल्की बलुई दोमट मिट्टी।', water: 'गर्मियों में हल्का दैनिक पानी; जलभराव न होने दें।', sunlight: 'प्रतिदिन 4–6 घंटे सुबह की सीधी धूप।', fertilizer: 'हर 45 दिन में सड़ी गोबर खाद डालें।', care: 'पौधे को घना रखने के लिए मंजरी तोड़ते रहें।', source: 'Punjab Agricultural University (PAU), Ludhiana & NMPB' },
  'pc-mango': { botanical: 'Mangifera indica', season: 'जुलाई – अगस्त (मानसून रोपण)', soil: 'गहरी दोमट या जलोढ़ मिट्टी बिना जलभराव के।', water: 'छोटे पौधों को सप्ताह में दो बार; बौर के समय कम।', sunlight: 'प्रतिदिन 8+ घंटे पूर्ण धूप।', fertilizer: 'सड़ी गोबर खाद एवं बोरॉन-जिंक स्प्रे।', care: 'कलमी जोड़ मिट्टी से ऊपर रखें।', source: 'ICAR – Central Institute for Subtropical Horticulture (CISH), Lucknow' },
  'pc-hibiscus': { botanical: 'Hibiscus rosa-sinensis', season: 'फरवरी – सितंबर', soil: 'हल्की अम्लीय व जैविक पदार्थ से भरपूर मिट्टी।', water: 'गर्मियों में प्रतिदिन व सर्दियों में हर 2–3 दिन में।', sunlight: 'प्रतिदिन 5–6 घंटे तेज धूप।', fertilizer: 'मासिक पोटाश युक्त जैविक खाद दें।', care: 'मासिक नीम तेल का छिड़काव करें।', source: 'Royal Botanic Gardens, Kew (United Kingdom)' }
};

export function getPlantCare(prod) {
  const p = prod || {};
  const base = PLANT_CARE_PROFILES[p.careId] || PLANT_CARE_PROFILES['pc-rose'];
  if (p.customCare && (p.customCare.care || p.customCare.season || p.customCare.water)) {
    return {
      botanical: p.botanicalName || base.botanical,
      season: p.customCare.season || base.season,
      soil: p.customCare.soil || base.soil,
      water: p.customCare.water || base.water,
      sunlight: p.customCare.sunlight || base.sunlight,
      fertilizer: p.customCare.fertilizer || base.fertilizer,
      care: p.customCare.care || base.care,
      source: p.customCare.source || base.source
    };
  }
  return base;
}

// ---------------------------------------------------------------------------
// Strict DD-MM-YYYY Date Engine
// ---------------------------------------------------------------------------
export function formatDateDDMMYYYY(d = new Date()) {
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

export function parseDDMMYYYY(str) {
  if (!str) return null;
  const m = String(str).trim().match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  const iso = String(str).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  return iso ? new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])) : null;
}

export function formatStrictDDMMYYYY(val) {
  if (!val) return formatDateDDMMYYYY(new Date());
  if (/^\d{2}-\d{2}-\d{4}$/.test(val)) return val;
  const d = parseDDMMYYYY(val) || new Date(val);
  return (!d || isNaN(d.getTime())) ? formatDateDDMMYYYY(new Date()) : formatDateDDMMYYYY(d);
}

export function toComparableTime(str) {
  const d = parseDDMMYYYY(str);
  return d ? d.getTime() : 0;
}

export function filterRecordsByRange(records, range, singleDate, customStart, customEnd, nowDate = new Date()) {
  if (range === 'single' || range === 'today') {
    const target = range === 'today' ? formatDateDDMMYYYY(nowDate) : formatStrictDDMMYYYY(singleDate);
    return records.filter((r) => formatStrictDDMMYYYY(r.date) === target);
  }
  if (range === 'all') return records;
  let minT = 0;
  let maxT = Infinity;
  if (range === '1m') { const d = new Date(nowDate); d.setMonth(d.getMonth() - 1); minT = d.getTime(); }
  else if (range === '3m') { const d = new Date(nowDate); d.setMonth(d.getMonth() - 3); minT = d.getTime(); }
  else if (range === '6m') { const d = new Date(nowDate); d.setMonth(d.getMonth() - 6); minT = d.getTime(); }
  else if (range === '1y') { const d = new Date(nowDate); d.setFullYear(d.getFullYear() - 1); minT = d.getTime(); }
  else if (range === 'custom') {
    minT = toComparableTime(customStart) || 0;
    maxT = (toComparableTime(customEnd) || Infinity) + 86399999;
  }
  return records.filter((r) => {
    const t = toComparableTime(r.date);
    return t >= minT && t <= maxT;
  });
}

// ---------------------------------------------------------------------------
// RBAC, Authentication & PIN ('1010')
// ---------------------------------------------------------------------------
export function authenticateUser(users, username, password) {
  return (users || []).find((u) => u.active && u.username.trim() === String(username || '').trim() && u.password === password) || null;
}

export function verifySecondaryPin(pin) {
  return String(pin || '').trim() === SECONDARY_PIN;
}

export function canAccessPage(role, pageId) {
  if (pageId === 'bill-gallery') return false; // Concealed from navigation
  if (role === 'Staff') return pageId === 'inventory-sales' || pageId === 'sale-summary';
  return role === 'Administrator';
}

export function canUserExport(role) {
  return role === 'Administrator';
}

export function getEditWindowMs(cfg) {
  const v = Math.max(0, Number(cfg?.value) || 0);
  return cfg?.unit === 'days' ? v * 86400000 : cfg?.unit === 'hours' ? v * 3600000 : v * 60000;
}

export function canEditSaleRecord(user, record, editWindowCfg, nowMs = Date.now()) {
  if (!user || !record) return false;
  if (user.role === 'Administrator') return true;
  if (user.role !== 'Staff') return false;
  if (record.createdBy !== user.username || !record.createdAt) return false;
  return (nowMs - record.createdAt) <= getEditWindowMs(editWindowCfg);
}

// ---------------------------------------------------------------------------
// Phonetic Smart Search & Multilingual Voice Billing NLP
// ---------------------------------------------------------------------------
const PHONETIC_SYNONYMS = {
  gulab: ['rose', 'गुलाब'], gulaab: ['rose', 'गुलाब'],
  tulsi: ['holy basil', 'tulsi', 'तुलसी'], genda: ['marigold', 'गेंदा'],
  aam: ['mango', 'आम'], neem: ['neem', 'azadirachta', 'नीम'],
  amrud: ['guava', 'अमरूद'], nimbu: ['lemon', 'citrus', 'नींबू']
};
const DEV_MAP = { 'अ':'a','आ':'aa','इ':'i','ई':'ee','उ':'u','ऊ':'oo','ए':'e','ऐ':'ai','ओ':'o','औ':'au','क':'k','ख':'kh','ग':'g','घ':'gh','च':'ch','छ':'chh','ज':'j','झ':'jh','ट':'t','ठ':'th','ड':'d','ढ':'dh','ण':'n','त':'t','थ':'th','द':'d','ध':'dh','न':'n','प':'p','फ':'ph','ब':'b','भ':'bh','म':'m','य':'y','र':'r','ल':'l','व':'v','श':'sh','ष':'sh','स':'s','ह':'h','ा':'a','ि':'i','ी':'ee','ु':'u','ू':'oo','े':'e','ै':'ai','ो':'o','ौ':'au','ं':'n','ँ':'n','्':'' };
const toLatin = (t = '') => [...t].map((c) => DEV_MAP[c] !== undefined ? DEV_MAP[c] : c).join('').toLowerCase();
const normPh = (s = '') => s.toLowerCase().replace(/aa/g, 'a').replace(/ee/g, 'i').replace(/oo/g, 'u').replace(/ph/g, 'f').replace(/w/g, 'v').replace(/\s+/g, ' ').trim();

export function smartMatch(item, rawQ) {
  const q = (rawQ || '').trim().toLowerCase();
  if (!q) return true;
  const hay = [item.nameEn || '', item.nameHi || '', item.botanicalName || '', item.category || '', item.categoryHi || '', toLatin(item.nameHi || '')].join(' ').toLowerCase();
  if (hay.includes(q)) return true;
  const nq = normPh(q), nh = normPh(hay);
  if (nh.includes(nq)) return true;
  return q.split(/\s+/).every((t) => {
    if (hay.includes(t) || nh.includes(normPh(t))) return true;
    const syns = PHONETIC_SYNONYMS[t] || PHONETIC_SYNONYMS[normPh(t)];
    return syns ? syns.some((s) => hay.includes(s.toLowerCase()) || nh.includes(normPh(s))) : false;
  });
}

const WORD_NUMS = { ek: 1, one: 1, एक: 1, दो: 2, do: 2, two: 2, तीन: 3, teen: 3, three: 3, चार: 4, char: 4, four: 4, पांच: 5, paanch: 5, panch: 5, five: 5 };
const VOICE_STOP = new Set(['add', 'bill', 'karo', 'jodo', 'aur', 'and', 'plus', 'pcs', 'plant', 'plants', 'जोड़ो', 'और', 'दे', 'दो', 'बिल', 'बनाओ']);

export function parseVoiceBillingCommand(transcript, products) {
  const lower = (transcript || '').trim().toLowerCase();
  const triggerCheckout = /\b(checkout|invoice|generate bill|bill banao|बिल बनाओ|payment)\b/i.test(lower);
  const clauses = lower.split(/\s*(?:,|and|aur|और|\+)\s*/i).filter(Boolean);
  const matchedItems = [];
  const unmatched = [];

  clauses.forEach((cl) => {
    const tokens = cl.replace(/[।.!?]/g, ' ').split(/\s+/).filter(Boolean);
    let qty = 1;
    const qTokens = [];
    tokens.forEach((tk) => {
      if (/^\d+$/.test(tk)) qty = Math.max(1, parseInt(tk, 10));
      else if (WORD_NUMS[tk] !== undefined) qty = WORD_NUMS[tk];
      else if (!VOICE_STOP.has(tk)) qTokens.push(tk);
    });
    const cq = qTokens.join(' ').trim();
    if (!cq) return;
    const best = products.find((p) => (p.nameHi && p.nameHi.toLowerCase() === cq) || p.nameEn.toLowerCase() === cq) || products.find((p) => smartMatch(p, cq));
    if (best) matchedItems.push({ product: best, qty });
    else unmatched.push(cl);
  });

  return { matchedItems, unmatched, triggerCheckout };
}

// ---------------------------------------------------------------------------
// Inventory, Variants, Cart Validation, Checkout & Stock Mutations
// ---------------------------------------------------------------------------
export function validateAddToCart(product, variantId, requestedQty, currentCart) {
  const variants = product.variants?.length ? product.variants : [{ id: product.id, label: 'Standard', price: product.price, stock: product.stock }];
  const v = variants.find((x) => x.id === variantId) || variants[0];
  const key = `${product.id}::${v.id}`;
  const alreadyInCart = (currentCart || []).find((c) => c.cartKey === key)?.qty || 0;
  const available = Number(v.stock) || 0;

  if (available <= 0) return { ok: false, reason: 'OUT_OF_STOCK', message: `"${product.nameHi || product.nameEn}" (${v.label}) is out of stock.` };
  if (alreadyInCart + requestedQty > available) return { ok: false, reason: 'EXCEEDS_STOCK', message: `Only ${available} units available (${alreadyInCart} already in cart).` };

  return { ok: true, cartKey: key, variant: v };
}

export function calculateCheckoutTotals(cartDetailed, discountType, discountValue, payMode, cashInput) {
  const subtotal = Math.round(cartDetailed.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 0), 0));
  const rawDisc = Math.max(0, Number(discountValue) || 0);
  const discountAmount = discountType === 'percent'
    ? Math.min(subtotal, Math.round((subtotal * Math.min(100, rawDisc)) / 100))
    : Math.min(subtotal, rawDisc);
  const total = Math.max(0, subtotal - discountAmount);

  let cashAmount = 0;
  let upiAmount = 0;
  if (payMode === 'cash') cashAmount = total;
  else if (payMode === 'upi') upiAmount = total;
  else {
    cashAmount = Math.min(total, Math.max(0, Number(cashInput) || 0));
    upiAmount = total - cashAmount;
  }
  return { subtotal, discountAmount, total, cashAmount, upiAmount };
}

export function applySaleToProducts(products, saleItems) {
  return products.map((p) => {
    const sold = saleItems.filter((i) => !i.isNonInventory && i.productId === p.id);
    if (!sold.length) return p;
    const nextVars = (p.variants || []).map((v) => {
      const sv = sold.find((s) => s.variantId === v.id);
      return sv ? { ...v, stock: Math.max(0, v.stock - sv.qty) } : v;
    });
    const totStk = nextVars.length ? nextVars.reduce((a, v) => a + v.stock, 0) : Math.max(0, p.stock - sold.reduce((a, s) => a + s.qty, 0));
    return { ...p, variants: nextVars, stock: totStk };
  });
}

export function applyPurchaseToProducts(products, purchaseItems) {
  return products.map((p) => {
    const b = purchaseItems.find((i) => i.productId === p.id);
    if (!b) return p;
    const nextVars = (p.variants || []).map((v, idx) => (idx === 0 ? { ...v, stock: v.stock + b.qty } : v));
    return { ...p, variants: nextVars, stock: p.stock + b.qty };
  });
}

export function applyAdjustmentToProducts(products, adjustment) {
  return products.map((p) => {
    if (p.id !== adjustment.productId) return p;
    const nextVars = (p.variants || []).map((v, idx) => (idx === 0 ? { ...v, stock: Math.max(0, v.stock - adjustment.qty) } : v));
    return { ...p, variants: nextVars, stock: Math.max(0, p.stock - adjustment.qty) };
  });
}

// ---------------------------------------------------------------------------
// Reports, Alerts, Supplier Hisab Kitab & Multi-Tier Exports
// ---------------------------------------------------------------------------
export function computeSaleCardStats(sales, range, cStart, cEnd, nowDate = new Date()) {
  const list = filterRecordsByRange(sales, range, formatDateDDMMYYYY(nowDate), cStart, cEnd, nowDate);
  const todayStr = formatDateDDMMYYYY(nowDate);
  const todayList = sales.filter((s) => formatStrictDDMMYYYY(s.date) === todayStr);
  return {
    todayTotal: todayList.reduce((a, s) => a + s.total, 0),
    rangeTotal: list.reduce((a, s) => a + s.total, 0),
    cash: list.reduce((a, s) => a + (s.cashAmount || 0), 0),
    upi: list.reduce((a, s) => a + (s.upiAmount || 0), 0),
    count: list.length
  };
}

export function computePurchaseCardStats(purchases, range, cStart, cEnd, nowDate = new Date()) {
  const list = filterRecordsByRange(purchases, range, formatDateDDMMYYYY(nowDate), cStart, cEnd, nowDate);
  const todayStr = formatDateDDMMYYYY(nowDate);
  const todayList = purchases.filter((p) => formatStrictDDMMYYYY(p.date) === todayStr);
  return {
    todayCash: todayList.reduce((a, p) => a + p.total, 0),
    rangeCash: list.reduce((a, p) => a + p.total, 0),
    count: list.length
  };
}

export function computeActiveAlerts(products, systemMessages = []) {
  const stockWarnings = products
    .filter((p) => Number(p.stock) < Number(p.threshold))
    .map((p) => ({
      id: 'low-' + p.id,
      type: 'Low Stock Warning',
      severity: p.stock === 0 ? 'Critical' : 'Warning',
      message: `${p.nameHi} (${p.nameEn}) — Stock: ${p.stock} / Threshold: ${p.threshold}`
    }));
  const agroAlerts = products
    .filter((p) => ['Fruit Plants', 'Flowering Plants'].includes(p.category) && Number(p.stock) > 0)
    .slice(0, 6)
    .map((p) => {
      const c = getPlantCare(p);
      return { id: 'agro-' + p.id, type: 'Crop Scheduler Alert', severity: 'Advisory', message: `${p.nameHi}: ${c.season} — ${c.water}` };
    });
  const sys = systemMessages.map((m, i) => ({ id: 'sys-' + i, type: 'System', severity: 'Info', message: m }));
  return [...stockWarnings, ...agroAlerts, ...sys];
}

export function computeSupplierHisab(purchases) {
  const map = {};
  purchases.forEach((p) => {
    const s = p.supplier || 'Unknown Supplier';
    if (!map[s]) map[s] = { supplier: s, bills: 0, totalCash: 0, itemsCount: 0 };
    map[s].bills += 1;
    map[s].totalCash += Number(p.total || 0);
    map[s].itemsCount += (p.items || []).reduce((a, i) => a + Number(i.qty || 0), 0);
  });
  return Object.values(map);
}

export function buildInventoryExportRows(products, tier, selectedCategories) {
  const subset = products.filter((p) => selectedCategories.includes(p.category));
  if (tier === 'basic') return subset.map((p) => ({ nameHi: p.nameHi || p.nameEn, nameEn: p.nameEn, category: p.category }));
  if (tier === 'stock') return subset.map((p) => ({ nameHi: p.nameHi || p.nameEn, category: p.category, stock: p.stock, threshold: p.threshold }));
  if (tier === 'care') {
    return subset.map((p) => {
      const c = getPlantCare(p);
      return { name: `${p.nameHi || p.nameEn} (${p.nameEn})`, care: `${c.season} | ${c.water} | ${c.sunlight} | ${c.fertilizer} | ${c.care}`, source: c.source };
    });
  }
  return subset.map((p) => ({ nameHi: `${p.nameHi || p.nameEn} (${p.nameEn})`, stock: p.stock, price: p.price, valuation: p.stock * p.price }));
}
