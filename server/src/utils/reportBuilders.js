const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Shared Excel generator - every report just supplies its own column
// definitions and row data; the actual workbook-building logic lives
// in exactly one place instead of being repeated for each report type.
const generateExcelReport = async (res, { filename, sheetName, columns, rows }) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  // columns.map(...) turns our simple {key, label} definitions into
  // the shape ExcelJS expects: {header, key, width}. "key" is what
  // links each row's actual property to the right column.
  sheet.columns = columns.map((col) => ({
    header: col.label,
    key: col.key,
    width: col.width || 20,
  }));

  sheet.getRow(1).font = { bold: true };

  rows.forEach((row) => sheet.addRow(row));

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);

  // Writes the workbook DIRECTLY to the HTTP response stream, rather
  // than building the file in memory/on disk first - more efficient,
  // especially for larger reports.
  await workbook.xlsx.write(res);
  res.end();
};

// Shared PDF generator - draws a simple table: a bold header row,
// a divider line, then each data row, with automatic page breaks
// when content runs past the bottom of the page.
const generatePdfReport = (res, { filename, title, columns, rows }) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
  doc.pipe(res);

  doc.fontSize(16).text(title, { align: 'center' });
  doc.moveDown();

  const startX = doc.page.margins.left;
  const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colWidth = usableWidth / columns.length;
  let y = doc.y;

  // Header row
  doc.fontSize(10).font('Helvetica-Bold');
  columns.forEach((col, i) => {
    doc.text(col.label, startX + i * colWidth, y, { width: colWidth, ellipsis: true });
  });
  y += 20;
  doc.moveTo(startX, y).lineTo(doc.page.width - doc.page.margins.right, y).stroke();
  y += 8;

  // Data rows
  doc.font('Helvetica').fontSize(9);
  rows.forEach((row) => {
    // If the next row would overflow past the bottom margin, start a
    // fresh page and reset y back to the top, rather than letting
    // content silently run off the edge of the page.
    if (y > doc.page.height - doc.page.margins.bottom - 20) {
      doc.addPage();
      y = doc.page.margins.top;
    }

    columns.forEach((col, i) => {
      const value = row[col.key] != null ? String(row[col.key]) : '';
      doc.text(value, startX + i * colWidth, y, { width: colWidth, ellipsis: true });
    });
    y += 18;
  });

  doc.end();
};

module.exports = { generateExcelReport, generatePdfReport };