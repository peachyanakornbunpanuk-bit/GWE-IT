const sqlite3 = require('@libsql/sqlite3');
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database(
    'libsql://gwe-db-peachyanakornbunpanuk-bit.aws-ap-northeast-1.turso.io?authToken=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQxMDQ4NTUsImlkIjoiMDE5ZjYzOTMtODkwMS03NmEzLThlYTMtY2RiOWU3NzkxYzBmIiwia2lkIjoiS2JJWnlLVGx5NGhzWWZxWEJMcUtnQlhBbng1ZUZpSzI2ZXlWR3NPMGl6WSIsInJpZCI6IjA1YjU3OGY5LTYyOTUtNGY4Yy04YTM4LTQxOTEyMjQ3ZWNmOSJ9.25Ncbf2LwuOrFfCYK-_GBtCwN1m66rj9W7PkpjzZ1GhAJngDW9y5tkIOg7lJAEOzBrXjzNBu4gCxwdY1qi7rDQ'
);

async function resetPasswords() {
    try {
        const adminHash = bcrypt.hashSync('admin', 10);
        const userHash = bcrypt.hashSync('user', 10);
        
        db.run("UPDATE users SET password = ? WHERE username IN ('IT', 'it', 'manager')", [adminHash], (err) => {
            if (err) console.error(err);
            else console.log("Admin passwords updated!");
        });
        
        db.run("UPDATE users SET password = ? WHERE username IN ('user', 'emp001')", [userHash], (err) => {
            if (err) console.error(err);
            else console.log("User passwords updated!");
        });

    } catch (e) {
        console.error("Failed to reset passwords:", e);
    }
}

resetPasswords();
