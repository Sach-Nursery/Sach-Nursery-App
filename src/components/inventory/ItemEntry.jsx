import React, { useState } from 'react';
import { Image as ImageIcon, Languages, Plus, Trash2, Upload, X } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useEscapeKey.js';
import { compressImageFile } from '../../db/database.js';
import { translateTextRealTime } from '../../logic/exportAndTranslate.js';
import { addCategorySafe, deleteCategorySafe, inferCategoryFromName, quickTranslateItemName } from '../../logic/inventoryAndReportsLogic.js';

export default function ItemEntryModal({ isOpen, onClose, categories, products, onUpdateCategories, onSaveItem }) {
  useEscapeKey(isOpen, onClose);

  const [nameEn, setNameEn] = useState('');
  const [nameHi, setNameHi] = useState('');
  const [category, setCategory] = useState(categories[0]?.en || '');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [threshold, setThreshold] = useState('');
  const [image, setImage] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [catError, setCatError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  if (!isOpen) return null;

  const handlePrimaryNameChange = (val) => {
    setNameEn(val);
    setCategory(inferCategoryFromName(val, categories));
  };

  const handleSwitchTranslate = async () => {
    if (nameEn && !nameHi) {
      const localGuess = quickTranslateItemName(nameEn);
      setNameHi(localGuess !== nameEn ? localGuess : await translateTextRealTime(nameEn, 'hi', 'en'));
    } else if (nameHi && !nameEn) {
      const localGuess = quickTranslateItemName(nameHi);
      setNameEn(localGuess !== nameHi ? localGuess : await translateTextRealTime(nameHi, 'en', 'hi'));
    }
  };

  const handleAddCategory = () => {
    setCatError('');
    const res = addCategorySafe(categories, newCatName);
    if (!res.ok) { setCatError(res.error); return; }
    onUpdateCategories(res.categories);
    setCategory(newCatName.trim());
    setNewCatName('');
  };

  const handleDeleteCategory = (catEn) => {
    setCatError('');
    const res = deleteCategorySafe(categories, catEn, products);
    if (!res.ok) { setCatError(res.error); return; }
    onUpdateCategories(res.categories);
    if (category === catEn) setCategory(res.categories[0]?.en || '');
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImage(await compressImageFile(file));
    } else {
      const url = e.dataTransfer?.getData('text/uri-list') || e.dataTransfer?.getData('text/plain');
      if (url) setImage(url);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nameEn.trim()) return;
    const catObj = categories.find((c) => c.en === category);
    const p = Number(price) || 0, s = Number(stock) || 0, th = Number(threshold) || 5;
    const id = 'p-' + Date.now();
    onSaveItem({
      id,
      nameEn: nameEn.trim(),
      nameHi: nameHi.trim(),
      category,
      categoryHi: catObj?.hi || category,
      price: p,
      stock: s,
      threshold: th,
      image: image.trim(),
      variants: [{ id: `${id}-std`, label: 'Standard', price: p, stock: s, threshold: th }]
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4" onClick={onClose}>
      <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div style={{ backgroundColor: 'var(--accent-primary)' }} className="px-6 py-4 text-white flex items-center justify-between">
          <h3 className="text-lg font-extrabold">Add Item</h3>
          <button type="button" title="Press Esc to cancel" onClick={onClose} className="p-1.5 rounded-xl hover:bg-black/15">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-xs font-bold mb-1">Standard Name *</label>
              <input required type="text" value={nameEn} onChange={(e) => handlePrimaryNameChange(e.target.value)} className="w-full px-3.5 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Alternate Script Name</label>
              <div className="flex gap-1.5">
                <input type="text" value={nameHi} onChange={(e) => setNameHi(e.target.value)} className="flex-1 px-3.5 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm" />
                <button type="button" onClick={handleSwitchTranslate} title="Auto-translate name" className="px-3 rounded-xl bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 font-bold text-xs flex items-center gap-1">
                  <Languages className="w-4 h-4" /> Translate
                </button>
              </div>
            </div>
          </div>

          {/* Category Selector + '+ Add Category' & Category Deletion */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border space-y-2.5">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <label className="text-xs font-bold">Category (Auto-Selected)</label>
              <div className="flex gap-1.5">
                <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="New category" className="px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-900 text-xs" />
                <button type="button" onClick={handleAddCategory} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> + Add Category
                </button>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="flex-1 px-3 py-2 rounded-xl border bg-white dark:bg-slate-900 text-sm font-semibold">
                {categories.map((c) => <option key={c.en} value={c.en}>{c.en}</option>)}
              </select>
              <button type="button" onClick={() => handleDeleteCategory(category)} title="Delete selected category" className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            {catError && <p className="text-xs text-rose-600 font-bold">{catError}</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-xs font-bold mb-1">Price (₹) *</label><input required type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm font-bold" /></div>
            <div><label className="block text-xs font-bold mb-1">Stock *</label><input required type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm font-bold" /></div>
            <div><label className="block text-xs font-bold mb-1">Threshold *</label><input required type="number" min="0" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm font-bold" /></div>
          </div>

          {/* Drag-and-Drop Upload + 'View Photo' Google Images Query */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold">Product Photo (Drag & Drop or URL)</label>
              <button
                type="button"
                onClick={() => window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent((nameEn || nameHi || 'nursery item').trim())}`, '_blank', 'noopener,noreferrer')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-extrabold"
              >
                <ImageIcon className="w-3.5 h-3.5" /> View Photo
              </button>
            </div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`p-5 rounded-2xl border-2 border-dashed text-center ${dragActive ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'border-slate-300 dark:border-slate-700'}`}
            >
              {image ? <img src={image} alt="Item preview" className="h-28 mx-auto object-contain mb-2" /> : <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1" />}
              <p className="text-xs text-slate-500">Drop image file or URL here</p>
              <input type="text" value={image} onChange={(e) => setImage(e.target.value)} placeholder="Image URL" className="mt-2 w-full px-3 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs font-mono" />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t flex justify-end gap-2">
          <button type="button" title="Press Esc to cancel" onClick={onClose} className="px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5">
            <span>Cancel</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px]">Esc</kbd>
          </button>
          <button type="submit" style={{ backgroundColor: 'var(--accent-primary)' }} className="px-5 py-2 rounded-xl text-white text-xs font-extrabold">Save Add Item</button>
        </div>
      </form>
    </div>
  );
}
