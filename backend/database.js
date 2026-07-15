require('dotenv').config();
const sqlite3 = require('@libsql/sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const baseUrl = process.env.TURSO_DATABASE_URL || 'file:iams.db';
const authToken = process.env.TURSO_AUTH_TOKEN;
const url = authToken ? `${baseUrl}?authToken=${authToken}` : baseUrl;

console.log('Connecting to database...');
const db = new sqlite3.Database(url, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the Turso SQLite database.');
        
        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS assets (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    category TEXT NOT NULL,
                    status TEXT NOT NULL,
                    holder TEXT,
                    value REAL
                )
            `);
            db.run("ALTER TABLE assets ADD COLUMN image_url TEXT", (err) => { /* ignore if exists */ });
            db.run("ALTER TABLE assets ADD COLUMN location TEXT DEFAULT '-'", (err) => { /* ignore if exists */ });
            db.run(`
                CREATE TABLE IF NOT EXISTS employees (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    department TEXT NOT NULL,
                    email TEXT
                )
            `);
            db.run(`
                CREATE TABLE IF NOT EXISTS settings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    type TEXT NOT NULL,
                    value TEXT NOT NULL
                )
            `);
            // UPDATED: Added reason column
            db.run(`
                CREATE TABLE IF NOT EXISTS borrow_records (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    asset_id TEXT NOT NULL,
                    employee_id TEXT NOT NULL,
                    borrow_date TEXT NOT NULL,
                    expected_return_date TEXT NOT NULL,
                    return_date TEXT,
                    reason TEXT,
                    status TEXT NOT NULL
                )
            `);
            db.run(`
                CREATE TABLE IF NOT EXISTS repair_records (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    asset_id TEXT NOT NULL,
                    issue TEXT NOT NULL,
                    vendor TEXT,
                    cost REAL,
                    status TEXT NOT NULL
                )
            `);
            db.run(`
                CREATE TABLE IF NOT EXISTS purchases (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    item_name TEXT NOT NULL,
                    category TEXT NOT NULL,
                    supplier TEXT,
                    cost REAL NOT NULL,
                    unit_cost REAL DEFAULT 0,
                    quantity INTEGER DEFAULT 1,
                    purchase_date TEXT NOT NULL,
                    status TEXT NOT NULL
                )
            `);
            db.run("ALTER TABLE purchases ADD COLUMN location TEXT DEFAULT '-'", (err) => { /* ignore if exists */ });
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    role TEXT NOT NULL
                )
            `);
            db.run(`
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    asset_id TEXT NOT NULL,
                    action TEXT NOT NULL,
                    description TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    user TEXT NOT NULL
                )
            `);
            db.run(`
                CREATE TABLE IF NOT EXISTS notifications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user TEXT NOT NULL,
                    title TEXT NOT NULL,
                    message TEXT NOT NULL,
                    link TEXT NOT NULL,
                    is_read INTEGER DEFAULT 0,
                    timestamp TEXT NOT NULL,
                    icon TEXT,
                    color TEXT
                )
            `);

            // Seed default users if empty
            db.get("SELECT COUNT(*) as count FROM users", [], async (err, row) => {
                if (!err && row.count === 0) {
                    const stmt = db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)");
                    const adminHash = await bcrypt.hash('admin', 10);
                    const userHash = await bcrypt.hash('user', 10);
                    stmt.run('manager', adminHash, 'Manager');
                    stmt.run('it', adminHash, 'IT Officer');
                    stmt.run('user', userHash, 'Employee');
                    stmt.finalize();
                    console.log('Seeded default users with hashed passwords.');
                }
            });

            // Seed default employees for the auth users
            db.get("SELECT COUNT(*) as count FROM employees WHERE id IN ('manager', 'it', 'user')", [], (err, row) => {
                if (!err && row.count === 0) {
                    const empStmt = db.prepare("INSERT OR IGNORE INTO employees (id, name, department, email) VALUES (?, ?, ?, ?)");
                    empStmt.run('manager', 'Manager Admin', 'Management', 'manager@company.com');
                    empStmt.run('it', 'IT Administrator', 'IT Support', 'it@company.com');
                    empStmt.run('user', 'Standard Employee', 'Operations', 'user@company.com');
                    empStmt.finalize();
                    console.log('Seeded default employees for auth accounts.');
                }
            });
        });
    }
});

module.exports = db;
