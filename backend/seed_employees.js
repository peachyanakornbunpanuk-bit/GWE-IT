const sqlite3 = require('@libsql/sqlite3');

const db = new sqlite3.Database(
    'libsql://gwe-db-peachyanakornbunpanuk-bit.aws-ap-northeast-1.turso.io?authToken=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQxMDQ4NTUsImlkIjoiMDE5ZjYzOTMtODkwMS03NmEzLThlYTMtY2RiOWU3NzkxYzBmIiwia2lkIjoiS2JJWnlLVGx5NGhzWWZxWEJMcUtnQlhBbng1ZUZpSzI2ZXlWR3NPMGl6WSIsInJpZCI6IjA1YjU3OGY5LTYyOTUtNGY4Yy04YTM4LTQxOTEyMjQ3ZWNmOSJ9.25Ncbf2LwuOrFfCYK-_GBtCwN1m66rj9W7PkpjzZ1GhAJngDW9y5tkIOg7lJAEOzBrXjzNBu4gCxwdY1qi7rDQ'
);

const employees = [
    { id: 'emp001', name: 'John Doe', department: 'Engineering', email: 'john@example.com' },
    { id: 'emp002', name: 'Jane Smith', department: 'Marketing', email: 'jane@example.com' },
    { id: 'emp003', name: 'Bob Johnson', department: 'Sales', email: 'bob@example.com' },
    { id: 'emp004', name: 'Alice Williams', department: 'HR', email: 'alice@example.com' },
    { id: 'emp005', name: 'Charlie Brown', department: 'Engineering', email: 'charlie@example.com' },
    { id: 'emp006', name: 'Diana Prince', department: 'Operations', email: 'diana@example.com' },
    { id: 'emp007', name: 'Ethan Hunt', department: 'IT', email: 'ethan@example.com' },
    { id: 'emp008', name: 'Fiona Gallagher', department: 'Finance', email: 'fiona@example.com' },
    { id: 'emp009', name: 'George Costanza', department: 'Sales', email: 'george@example.com' },
    { id: 'emp010', name: 'Hannah Abbott', department: 'Marketing', email: 'hannah@example.com' },
    { id: 'IT', name: 'IT Admin', department: 'IT Support', email: 'it@example.com' },
    { id: 'manager', name: 'Manager', department: 'Management', email: 'manager@example.com' },
    { id: 'user', name: 'Standard User', department: 'Operations', email: 'user@example.com' }
];

db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    const stmt = db.prepare("INSERT OR IGNORE INTO employees (id, name, department, email) VALUES (?, ?, ?, ?)");
    
    for (const e of employees) {
        stmt.run(e.id, e.name, e.department, e.email);
    }
    
    stmt.finalize();
    db.run("COMMIT", (err) => {
        if (err) console.error("Error committing:", err);
        else console.log("Employees seeded successfully!");
        db.close();
    });
});
