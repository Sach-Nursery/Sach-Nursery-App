import { filterRecordsByRange, formatStrictDDMMYYYY } from './erpLogic.js';

export const NON_REVENUE_CATEGORIES = [
  { id: 'Free', label: 'Free (मुफ्त वितरण)' },
  { id: 'Damage', label: 'Damage (खराब सामान)' }
];

const AUTO_CATEGORY_RULES = [
  { category: 'Flowering Plants', keywords: ['rose', 'gulab', 'marigold', 'genda', 'hibiscus', 'gudhal', 'jasmine', 'mogra', 'champa', 'lotus', 'kamal', 'dahlia', 'petunia', 'गुलाब', 'गेंदा', 'गुड़हल', 'मोगरा', 'कमल'] },
  { category: 'Fruit Plants', keywords: ['mango', 'aam', 'guava', 'amrud', 'lemon', 'nimbu', 'orange', 'santra', 'pomegranate', 'anar', 'papaya', 'banana', 'kela', 'fig', 'anjeer', 'आम', 'अमरूद', 'नींबू', 'अनार', 'केला'] },
  { category: 'Medicinal & Herbs', keywords: ['tulsi', 'basil', 'aloe', 'mint', 'pudina', 'curry', 'kadi', 'ashwagandha', 'giloy', 'brahmi', 'mint', 'तुलसी', 'एलोवेरा', 'पुदीना', 'कड़ी पत्ता', 'गिलोय'] },
  { category: 'Indoor & Ornamental', keywords: ['money plant', 'pothos', 'palm', 'areca', 'snake', 'monstera', 'fern', 'lily', 'bamboo', 'मनी प्लांट', 'पाम', 'लिली'] },
  { category: 'Trees & Avenue', keywords: ['neem', 'ashoka', 'peepal', 'banyan', 'bargad', 'gulmohar', 'teak', 'chandan', 'नीम', 'अशोक', 'पीपल', 'बरगद'] },
  { category: 'Succulents & Cacti', keywords: ['cactus', 'jade', 'succulent', 'echeveria', 'haworthia', 'adenium', 'कैक्टस', 'जेड'] },
  { category: 'Climbers & Creepers', keywords: ['bougainvillea', 'creeper', 'vine', 'ivy', 'madhumalti', 'aparajita', 'बोगनवेलिया', 'बेल', 'मधुमालती'] },
  { category: 'Seeds & Fertilizers', keywords: ['compost', 'vermicompost', 'soil', 'cocopeat', 'fertilizer', 'khad', 'seed', 'pot', 'gamla', 'neem oil', 'खाद', 'बीज', 'गमला', 'मिट्टी'] }
];

const QUICK_TRANSLATION_MAP = {
  rose: 'गुलाब', 'गुलाब': 'Rose',
  mango: 'आम', 'आम': 'Mango',
  tulsi: 'तुलसी', 'तुलसी': 'Holy Basil (Tulsi)',
  marigold: 'गेंदा', 'गेंदा': 'Marigold',
  hibiscus: 'गुड़हल', 'गुड़हल': 'Hibiscus',
  guava: 'अमरूद', 'अमरूद': 'Guava',
  lemon: 'नींबू', 'नींबू': 'Lemon',
  neem: 'नीम', 'नीम': 'Neem',
  jasmine: 'मोगरा चमेली', 'मोगरा': 'Jasmine',
  aloe: 'एलोवेरा', 'एलोवेरा': 'Aloe Vera',
  mint: 'पुदीना', 'पुदीना': 'Mint',
  pomegranate: 'अनार', 'अनार': 'Pomegranate',
  vermicompost: 'वर्मीकम्पोस्ट खाद', 'खाद': 'Organic Compost'
};

export function inferCategoryFromName(name = '', availableCategories = []) {
  const q = String(name || '').toLowerCase();
  if (!q) return availableCategories[0]?.en || 'Flowering Plants';
  for (const rule of AUTO_CATEGORY_RULES) {
    if (rule.keywords.some((kw) => q.includes(kw))) {
      const exists = availableCategories.some((c) => c.en === rule.category);
      if (!availableCategories.length || exists) return rule.category;
    }
  }
  return availableCategories[0]?.en || 'Flowering Plants';
}

export function quickTranslateItemName(text = '') {
  const clean = String(text || '').trim();
  if (!clean) return '';
  const lower = clean.toLowerCase();
  if (QUICK_TRANSLATION_MAP[lower]) return QUICK_TRANSLATION_MAP[lower];
  if (QUICK_TRANSLATION_MAP[clean]) return QUICK_TRANSLATION_MAP[clean];
  for (const [k, v] of Object.entries(QUICK_TRANSLATION_MAP)) {
    if (lower.includes(k)) return v;
  }
  return clean;
}

export function addCategorySafe(categories, newEn, newHi = '') {
  const en = String(newEn || '').trim();
  if (!en) return { ok: false, error: 'Category name is required.', categories };
  if (categories.some((c) => c.en.toLowerCase() === en.toLowerCase())) {
    return { ok: false, error: 'Category already exists.', categories };
  }
  return { ok: true, categories: [...categories, { en, hi: String(newHi || en).trim() }] };
}

export function deleteCategorySafe(categories, categoryEn, products = []) {
  if (categories.length <= 1) return { ok: false, error: 'At least one category must remain.', categories };
  const inUse = products.some((p) => p.category === categoryEn);
  if (inUse) return { ok: false, error: `Cannot delete "${categoryEn}" while items are assigned to it.`, categories };
  return { ok: true, categories: categories.filter((c) => c.en !== categoryEn) };
}

// Deducts Free/Damage non-revenue outflow cleanly from live stock
export function applyFreeDamageLogEntry(products, entry) {
  const qty = Math.max(1, Number(entry.quantity) || 0);
  const target = products.find((p) => p.id === entry.productId || p.nameEn.toLowerCase() === String(entry.itemName || '').toLowerCase());
  if (!target) return { ok: false, error: 'Selected item not found in inventory.', products };
  if (Number(target.stock) < qty) {
    return { ok: false, error: `Insufficient stock for "${target.nameEn}". Available: ${target.stock}`, products };
  }

  const nextProducts = products.map((p) => {
    if (p.id !== target.id) return p;
    const nextVariants = (p.variants || []).map((v, idx) => (idx === 0 ? { ...v, stock: Math.max(0, v.stock - qty) } : v));
    const nextStock = nextVariants.length ? nextVariants.reduce((s, v) => s + Number(v.stock || 0), 0) : Math.max(0, p.stock - qty);
    return { ...p, variants: nextVariants, stock: nextStock };
  });

  const savedEntry = {
    id: entry.id || 'FD-' + Date.now().toString().slice(-6),
    date: formatStrictDDMMYYYY(entry.date),
    productId: target.id,
    itemName: target.nameHi ? `${target.nameHi} (${target.nameEn})` : target.nameEn,
    itemCategory: target.category,
    quantity: qty,
    category: entry.category === 'Damage' ? 'Damage' : 'Free',
    reason: String(entry.reason || '').trim(),
    loggedBy: String(entry.loggedBy || '').trim() || 'SYSTEM'
  };

  return { ok: true, entry: savedEntry, products: nextProducts };
}

// Consolidated Reports Hub Filtering (Date Range + Category + Department)
export function filterReportsHub({
  sales = [],
  purchases = [],
  attendance = {},
  workers = [],
  freeDamageLogs = [],
  range = 'all',
  singleDate = '',
  customStart = '',
  customEnd = '',
  category = 'ALL',
  department = 'ALL',
  nowDate = new Date()
}) {
  const filteredSales = (department === 'ALL' || department === 'Sales')
    ? filterRecordsByRange(sales, range, singleDate, customStart, customEnd, nowDate)
        .filter((s) => category === 'ALL' || (s.items || []).some((i) => i.category === category))
    : [];

  const filteredPurchases = (department === 'ALL' || department === 'Procurement')
    ? filterRecordsByRange(purchases, range, singleDate, customStart, customEnd, nowDate)
        .filter((p) => category === 'ALL' || (p.items || []).some((i) => i.category === category))
    : [];

  const filteredFreeDamage = (department === 'ALL' || department === 'Non-Revenue Inventory')
    ? filterRecordsByRange(freeDamageLogs, range, singleDate, customStart, customEnd, nowDate)
        .filter((l) => category === 'ALL' || l.itemCategory === category || l.category === category)
    : [];

  const attendanceRows = [];
  if (department === 'ALL' || department === 'HR & Attendance') {
    const dateEntries = Object.entries(attendance).map(([d, map]) => ({ date: d, map }));
    const rangedDates = filterRecordsByRange(dateEntries, range, singleDate, customStart, customEnd, nowDate);
    rangedDates.forEach(({ date, map }) => {
      workers.forEach((w) => {
        const rec = map[w.id];
        if (rec) {
          attendanceRows.push({
            date,
            workerId: w.id,
            workerName: w.name,
            role: w.role,
            status: typeof rec === 'string' ? rec : rec.status,
            method: typeof rec === 'object' ? (rec.method || 'Manual') : 'Manual'
          });
        }
      });
    });
  }

  return { filteredSales, filteredPurchases, filteredFreeDamage, attendanceRows };
}
