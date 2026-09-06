const xlsx = require('xlsx');
const path = require('path');

const filePath = path.resolve('src/file_export/Produk.xlsx');
try {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  
  for(let i=0; i<10; i++) {
    if (data[i]) console.log(`Row ${i}:`, data[i]);
  }
} catch (e) {
  console.error('Error reading excel:', e);
}
