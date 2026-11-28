import React, { useMemo, useState } from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { CATEGORIES } from '../../logic/erpLogic.js';
import { filterReportsHub } from '../../logic/inventoryAndReportsLogic.js';
import { buildExcelBuffer, buildPdfDocument } from '../../logic/exportAndTranslate.js';

export default function ReportsHubPage({ sales = [], purchases = [], attendance = {}, workers = [], freeDamageLogs = [] }) {
  const { permissions } = useAuth();
  const [range, setRange] = useState('all');
  const [singleDate, setSingleDate] = useState('');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [category, setCategory] = useState('ALL');
  const [department, setDepartment] = useState('ALL');

  const { filteredSales, filteredPurchases, filteredFreeDamage, attendanceRows } = useMemo(
    () => filterReportsHub({ sales, purchases, attendance, workers, freeDamageLogs, range, singleDate, customStart, customEnd, category, department }),
    [sales, purchases, attendance, workers, freeDamageLogs, range, singleDate, customStart, customEnd, category, department]
  );

  const exportSectionExcel = async (title, columns, rows) => {
    if (!permissions.canExport) return;
    const buf = await buildExcelBuffer({ sheetName: title.slice(0, 28), columns, rows });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    link.download = `${title.replace(/\s+/g, '-')}.xlsx`;
    link.click();
  };

  const exportSectionPdf = (title, columns, rows) => {
    if (!permissions.canExport) return;
    const doc = buildPdfDocument({ title, subtitle: `Department: ${department} • Category: ${category}`, columns, rows });
    doc.save(`${title.replace(/\s+/g, '-')}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-2xl font-extrabold">Centralized Reports Hub</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <select value={range} onChange={(e) => setRange(e.target.value)} className="px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs font-bold">
            <option value="today">Today</option><option value="single">Single Day</option><option value="1m">1 Month</option>
            <option value="3m">3 Months</option><option value="1y">1 Year</option><option value="all">All Time</option><option value="custom">Custom Range</option>
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs font-bold">
            <option value="ALL">All Categories</option>
            {CATEGORIES.map((c) => <option key={c.en} value={c.en}>{c.en}</option>)}
          </select>
          <select value={department} onChange={(e) => setDepartment(e.target.value)} className="px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs font-bold">
            <option value="ALL">All Departments</option>
            <option value="Sales">Sales</option>
            <option value="Procurement">Procurement</option>
            <option value="HR & Attendance">HR & Attendance</option>
            <option value="Non-Revenue Inventory">Non-Revenue Inventory</option>
          </select>
          {range === 'single' && <input type="text" placeholder="DD-MM-YYYY" value={singleDate} onChange={(e) => setSingleDate(e.target.value)} className="px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs font-bold" />}
          {range === 'custom' && (
            <>
              <input type="text" placeholder="Start DD-MM-YYYY" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs font-bold" />
              <input type="text" placeholder="End DD-MM-YYYY" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs font-bold" />
            </>
          )}
        </div>
      </div>

      {/* Section 1: Sales Summaries */}
      <ReportSectionCard
        title={`Sales Summaries (${filteredSales.length})`}
        canExport={permissions.canExport}
        onExcel={() => exportSectionExcel('Sales-Summary', [{ key:'id', label:'Invoice' }, { key:'date', label:'Date' }, { key:'customer', label:'Customer' }, { key:'total', label:'Total' }], filteredSales)}
        onPdf={() => exportSectionPdf('Sales-Summary', [{ key:'id', label:'Invoice' }, { key:'date', label:'Date' }, { key:'customer', label:'Customer' }, { key:'total', label:'Total' }], filteredSales)}
        headers={['Invoice', 'Date', 'Customer', 'Cash / UPI', 'Total']}
        rows={filteredSales.map((s) => [s.id, s.date, s.customer, `₹${s.cashAmount} / ₹${s.upiAmount}`, `₹${s.total}`])}
      />

      {/* Section 2: Purchase Records */}
      <ReportSectionCard
        title={`Purchase Records (${filteredPurchases.length})`}
        canExport={permissions.canExport}
        onExcel={() => exportSectionExcel('Purchase-Records', [{ key:'id', label:'Bill ID' }, { key:'date', label:'Date' }, { key:'supplier', label:'Supplier' }, { key:'total', label:'Cash Paid' }], filteredPurchases)}
        onPdf={() => exportSectionPdf('Purchase-Records', [{ key:'id', label:'Bill ID' }, { key:'date', label:'Date' }, { key:'supplier', label:'Supplier' }, { key:'total', label:'Cash Paid' }], filteredPurchases)}
        headers={['Bill ID', 'Date', 'Supplier', 'Cash Paid']}
        rows={filteredPurchases.map((p) => [p.id, p.date, p.supplier, `₹${p.total}`])}
      />

      {/* Section 3: Staff Attendance */}
      <ReportSectionCard
        title={`Staff Attendance (${attendanceRows.length})`}
        canExport={permissions.canExport}
        onExcel={() => exportSectionExcel('Staff-Attendance', [{ key:'date', label:'Date' }, { key:'workerName', label:'Worker' }, { key:'role', label:'Role' }, { key:'status', label:'Status' }, { key:'method', label:'Method' }], attendanceRows)}
        onPdf={() => exportSectionPdf('Staff-Attendance', [{ key:'date', label:'Date' }, { key:'workerName', label:'Worker' }, { key:'role', label:'Role' }, { key:'status', label:'Status' }, { key:'method', label:'Method' }], attendanceRows)}
        headers={['Date', 'Worker', 'Role', 'Status', 'Method']}
        rows={attendanceRows.map((a) => [a.date, a.workerName, a.role, a.status, a.method])}
      />

      {/* Section 4: Free / Damage Log */}
      <ReportSectionCard
        title={`Free / Damage Log (${filteredFreeDamage.length})`}
        canExport={permissions.canExport}
        onExcel={() => exportSectionExcel('Free-Damage-Log', [{ key:'date', label:'Date' }, { key:'itemName', label:'Item' }, { key:'category', label:'Category' }, { key:'quantity', label:'Qty' }, { key:'reason', label:'Reason' }, { key:'loggedBy', label:'Logged By' }], filteredFreeDamage)}
        onPdf={() => exportSectionPdf('Free-Damage-Log', [{ key:'date', label:'Date' }, { key:'itemName', label:'Item' }, { key:'category', label:'Category' }, { key:'quantity', label:'Qty' }, { key:'reason', label:'Reason' }, { key:'loggedBy', label:'Logged By' }], filteredFreeDamage)}
        headers={['Date', 'Item', 'Category', 'Qty', 'Reason', 'Logged By']}
        rows={filteredFreeDamage.map((l) => [l.date, l.itemName, l.category, `-${l.quantity}`, l.reason, l.loggedBy])}
      />
    </div>
  );
}

function ReportSectionCard({ title, canExport, onExcel, onPdf, headers, rows }) {
  return (
    <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-4 border-b flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-extrabold">{title}</h3>
        {canExport && (
          <div className="flex gap-2">
            <button onClick={onExcel} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold">
              <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
            </button>
            <button onClick={onPdf} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-extrabold">
              <FileText className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        )}
      </div>
      <div className="max-h-72 overflow-y-auto">
        <table className="w-full text-sm">
          <thead><tr>{headers.map((h) => <th key={h} className="text-left px-4 py-2.5 text-xs uppercase">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.length === 0 ? (
              <tr><td colSpan={headers.length} className="p-6 text-center text-xs text-slate-400">No matching records.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={i}>{r.map((cell, ci) => <td key={ci} className="px-4 py-2.5 text-xs font-medium">{cell}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
