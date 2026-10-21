// Non-component helpers for Pay & Tax: labels and file downloads

export const formatFinancialYear = (financialYear: string) => financialYear.replace('-', ' - ');

// ── Files ───────────────────────────────────────────────────────────────────

export function downloadFile(content: string, fileName: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

const csvCell = (value: string | number) => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const toCsv = (rows: (string | number)[][]) => rows.map((row) => row.map(csvCell).join(',')).join('\n');

// Opens a printable copy in a new window; the browser's print dialog can save it as PDF
export function printHtml(html: string): boolean {
  const printWindow = window.open('', '_blank', 'width=900,height=1000');
  if (!printWindow) return false;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  return true;
}
