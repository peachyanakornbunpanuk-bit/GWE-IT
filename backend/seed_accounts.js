require('dotenv').config();
const sqlite3 = require('@libsql/sqlite3').verbose();
const bcrypt = require('bcryptjs');

const baseUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const url = authToken ? `${baseUrl}?authToken=${authToken}` : baseUrl;

const db = new sqlite3.Database(url, async (err) => {
    if (err) {
        console.error("Database connection error:", err);
        process.exit(1);
    }
    
    console.log("Connected to Turso. Adding user accounts...");

    const users = [
        { username: 'Admin', password: 'gewadmin', role: 'Manager' },
        { username: 'IT', password: 'gewit', role: 'IT Officer' },
        { username: 'emp001', password: 'gewemp001', role: 'Employee' }
    ];

    for (let u of users) {
        const hash = await bcrypt.hash(u.password, 10);
        
        db.run(`DELETE FROM users WHERE username = ?`, [u.username], (err) => {
            db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`, [u.username, hash, u.role], (err) => {
                if (err) console.error("Error inserting user:", err.message);
                else console.log(`Added user: ${u.username}`);
            });
        });
        
        db.run(`INSERT OR IGNORE INTO employees (id, name, department, email) VALUES (?, ?, ?, ?)`, 
               [u.username, u.username, u.role, `${u.username}@company.com`], (err) => {
            if (err) console.error("Error inserting employee:", err.message);
        });
    }
    
    // Give it a second to finish async queries before exiting
    setTimeout(() => {
        console.log("Finished adding accounts.");
        process.exit(0);
    }, 2000);
});
