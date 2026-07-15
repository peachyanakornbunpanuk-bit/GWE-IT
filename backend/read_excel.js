const xlsx = require('xlsx');

const workbook = xlsx.readFile('C:\\Users\\Peach\\OneDrive - BUU\\Documents\\Stock Inventory.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Parse to Array of Arrays
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log(`Found ${rows.length} rows`);
console.log("First 3 rows:");
console.log(JSON.stringify(rows.slice(0, 3), null, 2));
