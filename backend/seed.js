const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'iams.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
        process.exit(1);
    }
});

console.log("Seeding database with extensive sample data...");

db.serialize(() => {
    db.run("DELETE FROM assets");
    db.run("DELETE FROM employees");
    db.run("DELETE FROM borrow_records");
    db.run("DELETE FROM repair_records");
    db.run("DELETE FROM purchases");
    db.run("DELETE FROM settings");

    // SETTINGS (Categories, Departments, Suppliers)
    const settings = [
        ['Category', 'Notebook'], ['Category', 'Monitor'], ['Category', 'Mouse'], ['Category', 'Keyboard'], ['Category', 'GPU'], ['Category', 'Network'], ['Category', 'Cable'],
        ['Department', 'Engineering'], ['Department', 'Marketing'], ['Department', 'Human Resources'], ['Department', 'Finance'], ['Department', 'Operations'], ['Department', 'Executive'],
        ['Supplier', 'Apple Store'], ['Supplier', 'Dell Direct'], ['Supplier', 'JIB'], ['Supplier', 'Banana IT'], ['Supplier', 'Network Solutions'], ['Supplier', 'Logitech Service']
    ];
    const insertSetting = db.prepare(`INSERT INTO settings (type, value) VALUES (?, ?)`);
    settings.forEach(s => insertSetting.run(s));
    insertSetting.finalize();

    // EMPLOYEES (10)
    const emps = [
        ['EMP-1001', 'Alice Johnson', 'Engineering', 'alice@example.com'],
        ['EMP-1002', 'Bob Smith', 'Marketing', 'bob@example.com'],
        ['EMP-1003', 'Charlie Davis', 'Human Resources', 'charlie@example.com'],
        ['EMP-1004', 'Diana Prince', 'Finance', 'diana@example.com'],
        ['EMP-1005', 'Evan Wright', 'Operations', 'evan@example.com'],
        ['EMP-1006', 'Fiona Gallagher', 'Engineering', 'fiona@example.com'],
        ['EMP-1007', 'George Costanza', 'Marketing', 'george@example.com'],
        ['EMP-1008', 'Hannah Abbott', 'Executive', 'hannah@example.com'],
        ['EMP-1009', 'Ian Malcolm', 'Engineering', 'ian@example.com'],
        ['EMP-1010', 'Julia Stiles', 'Finance', 'julia@example.com']
    ];
    const insertEmp = db.prepare(`INSERT INTO employees (id, name, department, email) VALUES (?, ?, ?, ?)`);
    emps.forEach(e => insertEmp.run(e));
    insertEmp.finalize();

    // ASSETS (20)
    const assets = [
        ['AST-2001', 'MacBook Pro M2', 'Notebook', 'Borrowed', 'EMP-1001', 75000],
        ['AST-2002', 'Dell XPS 15', 'Notebook', 'Available', '-', 65000],
        ['AST-2003', 'Dell UltraSharp 27"', 'Monitor', 'Borrowed', 'EMP-1008', 15000],
        ['AST-2004', 'Logitech MX Master 3', 'Mouse', 'Repair', '-', 3500],
        ['AST-2005', 'Cisco Catalyst Switch', 'Network', 'Damaged', '-', 45000],
        ['AST-2006', 'Keychron K2', 'Keyboard', 'Available', '-', 4000],
        ['AST-2007', 'Logitech B100', 'Mouse', 'Available', '-', 200],
        ['AST-2008', 'ThinkPad T14', 'Notebook', 'Borrowed', 'EMP-1006', 45000],
        ['AST-2009', 'LG 34" Ultrawide', 'Monitor', 'Available', '-', 20000],
        ['AST-2010', 'Apple Magic Mouse', 'Mouse', 'Borrowed', 'EMP-1001', 2500],
        ['AST-2011', 'NVIDIA RTX 4090', 'GPU', 'Available', '-', 60000],
        ['AST-2012', 'Cat6 LAN Cable 10m', 'Cable', 'Available', '-', 500],
        ['AST-2013', 'Ubiquiti UniFi AP', 'Network', 'Repair', '-', 6000],
        ['AST-2014', 'Razer DeathAdder', 'Mouse', 'Available', '-', 1500],
        ['AST-2015', 'MacBook Air M1', 'Notebook', 'Available', '-', 32000],
        ['AST-2016', 'HDMI 2.1 Cable 3m', 'Cable', 'Borrowed', 'EMP-1010', 800],
        ['AST-2017', 'Dell XPS 13', 'Notebook', 'Damaged', '-', 55000],
        ['AST-2018', 'Logitech MX Keys', 'Keyboard', 'Available', '-', 3500],
        ['AST-2019', 'Samsung Odyssey G7', 'Monitor', 'Available', '-', 22000],
        ['AST-2020', 'ASUS ROG Strix 4080', 'GPU', 'Borrowed', 'EMP-1009', 45000]
    ];
    const insertAsset = db.prepare(`INSERT INTO assets (id, name, category, status, holder, value) VALUES (?, ?, ?, ?, ?, ?)`);
    assets.forEach(a => insertAsset.run(a));
    insertAsset.finalize();

    // BORROW RECORDS (10)
    const borrows = [
        ['AST-2001', 'EMP-1001', '2023-10-01', '2023-10-31', null, 'Need for offsite project', 'Active'],
        ['AST-2003', 'EMP-1008', '2023-10-10', '2023-12-31', null, 'Executive home office setup', 'Active'],
        ['AST-2008', 'EMP-1006', '2023-10-12', '2023-11-15', null, 'Development work', 'Active'],
        ['AST-2010', 'EMP-1001', '2023-10-01', '2023-10-31', null, 'Need for offsite project', 'Active'],
        ['AST-2016', 'EMP-1010', '2023-10-05', '2023-10-15', null, 'Client presentation room', 'Active'],
        ['AST-2020', 'EMP-1009', '2023-09-25', '2023-11-01', null, 'AI Model training', 'Active'],
        ['AST-2002', 'EMP-1002', '2023-09-15', '2023-09-20', '2023-09-20', 'Client presentation', 'Returned'],
        ['AST-2015', 'EMP-1005', '2023-08-10', '2023-08-12', '2023-08-12', 'Temporary extra laptop', 'Returned'],
        ['AST-2011', 'EMP-1004', '2023-07-05', '2023-07-15', '2023-07-15', 'Testing software rendering', 'Returned'],
        ['AST-2007', 'EMP-1003', '2023-06-01', '2023-06-05', '2023-06-05', 'Mouse stopped working', 'Returned']
    ];
    const insertBorrow = db.prepare(`INSERT INTO borrow_records (asset_id, employee_id, borrow_date, expected_return_date, return_date, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    borrows.forEach(b => insertBorrow.run(b));
    insertBorrow.finalize();

    // REPAIR RECORDS (8)
    const repairs = [
        ['AST-2004', 'Scroll wheel broken', 'Logitech Service', 500, 'In Repair'],
        ['AST-2013', 'Firmware corruption', 'Network Solutions', 1200, 'In Repair'],
        ['AST-2017', 'Screen shattered', 'Dell Care', 8000, 'In Repair'],
        ['AST-2005', 'Port 1 burnt out', 'Cisco Direct', 12000, 'Completed'],
        ['AST-2002', 'Screen flickering', 'Dell Care', 4500, 'Completed'],
        ['AST-2001', 'Battery replacement', 'Apple Store', 3500, 'Completed'],
        ['AST-2003', 'Power supply failure', 'JIB', 1500, 'Completed'],
        ['AST-2019', 'Dead pixels', 'Samsung Care', 2000, 'Completed']
    ];
    const insertRepair = db.prepare(`INSERT INTO repair_records (asset_id, issue, vendor, cost, status) VALUES (?, ?, ?, ?, ?)`);
    repairs.forEach(r => insertRepair.run(r));
    insertRepair.finalize();

    // PURCHASES (10)
    const purchases = [
        ['MacBook Pro M2', 'Notebook', 'Apple Store', 75000, '2023-01-15'],
        ['Dell XPS 15', 'Notebook', 'Dell Direct', 65000, '2023-02-10'],
        ['Dell UltraSharp 27"', 'Monitor', 'JIB', 15000, '2023-03-05'],
        ['Logitech MX Master 3', 'Mouse', 'Banana IT', 3500, '2023-04-20'],
        ['Cisco Catalyst Switch', 'Network', 'Network Solutions', 45000, '2023-05-30'],
        ['NVIDIA RTX 4090', 'GPU', 'JIB', 60000, '2023-06-15'],
        ['ThinkPad T14', 'Notebook', 'Lenovo Direct', 45000, '2023-07-01'],
        ['Samsung Odyssey G7', 'Monitor', 'Banana IT', 22000, '2023-08-10'],
        ['Cat6 LAN Cable 10m', 'Cable', 'Network Solutions', 500, '2023-09-05'],
        ['Apple Magic Mouse', 'Mouse', 'Apple Store', 2500, '2023-09-20']
    ];
    const insertPurchase = db.prepare(`INSERT INTO purchases (item_name, category, supplier, cost, purchase_date, status) VALUES (?, ?, ?, ?, ?, 'Received')`);
    purchases.forEach(p => insertPurchase.run(p));
    insertPurchase.finalize();

    console.log("Database massively seeded successfully!");
    
    db.close(() => {
        process.exit(0);
    });
});
