const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new sqlite3.Database(path.resolve(__dirname, 'iams.db'));

db.serialize(() => {
    db.all("SELECT id, password FROM users", [], async (err, rows) => {
        if (err) throw err;
        for (const row of rows) {
            if (!row.password.startsWith('$2a$') && !row.password.startsWith('$2b$')) {
                const hash = await bcrypt.hash(row.password, 10);
                db.run("UPDATE users SET password = ? WHERE id = ?", [hash, row.id]);
                console.log(`Hashed password for user ID ${row.id}`);
            }
        }
        console.log('Finished hashing passwords.');
    });
});
