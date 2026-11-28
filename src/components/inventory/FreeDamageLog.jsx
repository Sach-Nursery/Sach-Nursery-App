import React, { useMemo, useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { applyFreeDamageLogEntry, NON_REVENUE_CATEGORIES } from '../../logic/inventoryAndReportsLogic.js';
import { formatDateDDMMYYYY, smartMatch } from '../../logic/erpLogic.js';

export default function FreeDamageLog({ products, logs, onRecordEntry }) {
  const { user } = useAuth();
  const [date, setDate] = useState(formatDateDDMMYYYY(new Date()));
  const [itemSearch, setItemSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState('Free');
  const [reason, setReason] = useState('');
  const [loggedBy, setLoggedBy] = useState(user?.id || '');
  const [error, setError] = useState('');

  const matchingProducts = useMemo(
    () => products.filter((p) => smartMatch(p, itemSearch)),
    [products, itemSearch]
  );

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const result = applyFreeDamageLogEntry(products, {
      date,
      productId: selectedProductId,
      itemName: selectedProduct?.nameEn || itemSearch,
      quantity,
      category,
      reason,
      loggedBy: loggedBy || user?.id || user?.username
    });

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onRecordEntry(result.entry, result.products);
    setQuantity('');
    setReason('');
    setItemSearch('');
    setSelectedProductId('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <form onSubmit={handleSubmit} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 h-fit">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-extrabold">Free / Damage Inventory Log</h3>
        </div>

        <div>
          <label className="block text-xs font-bold mb-1">Date (DD-MM-YYYY) *</label>
          <input required type="text" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold" />
        </div>

        <div>
          <label className="block text-xs font-bold mb-1">Item Name *</label>
          <input
            type="text"
            value={itemSearch}
            onChange={(e) => { setItemSearch(e.target.value); setSelectedProductId(''); }}
            placeholder="Type to filter items..."
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm mb-1.5"
          />
          <select
            required
            value={selectedProductId}
            onChange={(e) => {
              const p = products.find((x) => x.id === e.target.value);
              setSelectedProductId(e.target.value);
              if (p) setItemSearch(`${p.nameHi || p.nameEn} (${p.nameEn})`);
            }}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
          >
            <option value="">-- Select Item --</option>
            {matchingProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nameHi || p.nameEn} ({p.nameEn}) — Stock: {p.stock}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold mb-1">Quantity *</label>
            <input required type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold" />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Category *</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold">
              {NON_REVENUE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold mb-1">Reason / Recipient Details *</label>
          <textarea required rows="2" value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm" />
        </div>

        <div>
          <label className="block text-xs font-bold mb-1">Logged-by ID *</label>
          <input required type="text" value={loggedBy} onChange={(e) => setLoggedBy(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono" />
        </div>

        {error && <p className="text-xs font-bold text-rose-600">{error}</p>}

        <button type="submit" style={{ backgroundColor: 'var(--accent-primary)' }} className="w-full py-2.5 rounded-xl text-white font-extrabold text-sm shadow">
          Deduct Stock & Save Log
        </button>
      </form>

      <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden max-h-[560px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase">
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Item</th>
              <th className="text-center px-3 py-3">Category</th>
              <th className="text-center px-3 py-3">Qty</th>
              <th className="text-left px-4 py-3">Reason / Recipient</th>
              <th className="text-left px-4 py-3">Logged By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3 text-xs font-semibold">{l.date}</td>
                <td className="px-4 py-3 font-bold">{l.itemName}</td>
                <td className="px-3 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${l.category === 'Damage' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'}`}>
                    {l.category}
                  </span>
                </td>
                <td className="px-3 py-3 text-center font-extrabold">-{l.quantity}</td>
                <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">{l.reason}</td>
                <td className="px-4 py-3 text-xs font-mono text-slate-500">{l.loggedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
