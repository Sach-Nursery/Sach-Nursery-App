import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useEscapeKey.js';

export default function VariantEditModal({ isOpen, item, onClose, onSave }) {
  useEscapeKey(isOpen, onClose);
  const [variants, setVariants] = useState(() => (
    item?.variants?.length ? item.variants : [{ id: `${item?.id || 'v'}-std`, label: 'Standard', price: item?.price || 0, stock: item?.stock || 0, threshold: item?.threshold || 5 }]
  ));

  if (!isOpen || !item) return null;

  const updateField = (idx, field, val) => {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, [field]: val } : v)));
  };

  const deleteVariant = (idx) => {
    if (variants.length <= 1) return;
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleaned = variants.map((v) => ({
      ...v,
      price: Number(v.price) || 0,
      stock: Number(v.stock) || 0,
      threshold: Number(v.threshold) || 0
    }));
    const totalStock = cleaned.reduce((s, v) => s + v.stock, 0);
    onSave({ ...item, variants: cleaned, price: cleaned[0].price, stock: totalStock, threshold: cleaned[0].threshold });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4" onClick={onClose}>
      <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div style={{ backgroundColor: 'var(--accent-primary)' }} className="px-6 py-4 text-white flex items-center justify-between">
          <h3 className="text-lg font-extrabold">Edit Variants — {item.nameHi || item.nameEn}</h3>
          <button type="button" title="Press Esc to cancel" onClick={onClose} className="p-1.5 rounded-xl hover:bg-black/15"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-3">
          <div className="flex justify-end">
            <button type="button" onClick={() => setVariants((p) => [...p, { id: `${item.id}-${Date.now()}`, label: '', price: 0, stock: 0, threshold: 5 }])} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <Plus className="w-3.5 h-3.5" /> Add Variant Row
            </button>
          </div>

          <div className="space-y-3">
            {variants.map((v, idx) => (
              <div key={v.id} className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                {/* Persistent Column Headers directly above input fields for every variant row */}
                <div className="grid grid-cols-12 gap-2.5 items-end">
                  <div className="col-span-4 flex flex-col">
                    <label className="text-[11px] font-extrabold uppercase text-slate-600 dark:text-slate-300 mb-1">Variant Tier</label>
                    <input required type="text" value={v.label} onChange={(e) => updateField(idx, 'label', e.target.value)} className="w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-900 text-xs font-bold" />
                  </div>
                  <div className="col-span-2 flex flex-col">
                    <label className="text-[11px] font-extrabold uppercase text-slate-600 dark:text-slate-300 mb-1">Price</label>
                    <input required type="number" min="0" value={v.price} onChange={(e) => updateField(idx, 'price', e.target.value)} className="w-full px-2.5 py-2 rounded-xl border bg-white dark:bg-slate-900 text-xs font-bold" />
                  </div>
                  <div className="col-span-2 flex flex-col">
                    <label className="text-[11px] font-extrabold uppercase text-slate-600 dark:text-slate-300 mb-1">Stock Quantity</label>
                    <input required type="number" min="0" value={v.stock} onChange={(e) => updateField(idx, 'stock', e.target.value)} className="w-full px-2.5 py-2 rounded-xl border bg-white dark:bg-slate-900 text-xs font-bold" />
                  </div>
                  <div className="col-span-2 flex flex-col">
                    <label className="text-[11px] font-extrabold uppercase text-slate-600 dark:text-slate-300 mb-1">Alert Threshold</label>
                    <input required type="number" min="0" value={v.threshold} onChange={(e) => updateField(idx, 'threshold', e.target.value)} className="w-full px-2.5 py-2 rounded-xl border bg-white dark:bg-slate-900 text-xs font-bold" />
                  </div>
                  <div className="col-span-2 flex flex-col">
                    <label className="text-[11px] font-extrabold uppercase text-slate-600 dark:text-slate-300 mb-1">Action</label>
                    <button
                      type="button"
                      disabled={variants.length <= 1}
                      onClick={() => deleteVariant(idx)}
                      className="w-full py-2 px-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-200 dark:border-rose-900 text-xs font-extrabold flex items-center justify-center gap-1 disabled:opacity-40"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t flex justify-end gap-2">
          <button type="button" title="Press Esc to cancel" onClick={onClose} className="px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5">
            <span>Cancel</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px]">Esc</kbd>
          </button>
          <button type="submit" style={{ backgroundColor: 'var(--accent-primary)' }} className="px-5 py-2 rounded-xl text-white text-xs font-extrabold">Save Variants</button>
        </div>
      </form>
    </div>
  );
}
