import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import translate from 'translate';

// Real-time translation helper (e.g., translating stock adjustment notes or plant names)
export async function translateTextRealTime(text, targetLang = 'hi', sourceLang = 'en') {
  const input = String(text || '').trim();
  if (!input) return '';
  try {
    return await translate(input, { from: sourceLang, to: targetLang });
  } catch {
    return input; // Graceful fallback if offline
  }
}

// Excel workbook generator using ExcelJS
export async function buildExcelBuffer({ sheetName = 'Report', columns = [], rows = [] }) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  sheet.columns = columns.map((c) => ({
    header: c.label,
    key: c.key,
    width: c.width || 22
  }));

  sheet.getRow(1).font = { bold: true };
  rows.forEach((row) => sheet.addRow(row));

  return workbook.xlsx.writeBuffer();
}

// Formatted PDF generator using jsPDF v4 + jspdf-autotable v5
export function buildPdfDocument({ title, subtitle, columns = [], rows = [] }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  doc.setFontSize(16);
  doc.text(String(title || 'Sach Nursery Report'), 40, 42);
  if (subtitle) {
    doc.setFontSize(10);
    doc.text(String(subtitle), 40, 60);
  }

  autoTable(doc, {
    startY: subtitle ? 76 : 60,
    head: [columns.map((c) => c.label)],
    body: rows.map((r) => columns.map((c) => String(r[c.key] ?? ''))),
    styles: { fontSize: 9 }
  });

  return doc;
}
