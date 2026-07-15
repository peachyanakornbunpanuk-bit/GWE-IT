const sqlite3 = require('@libsql/sqlite3');

const db = new sqlite3.Database(
    'libsql://gwe-db-peachyanakornbunpanuk-bit.aws-ap-northeast-1.turso.io?authToken=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQxMDQ4NTUsImlkIjoiMDE5ZjYzOTMtODkwMS03NmEzLThlYTMtY2RiOWU3NzkxYzBmIiwia2lkIjoiS2JJWnlLVGx5NGhzWWZxWEJMcUtnQlhBbng1ZUZpSzI2ZXlWR3NPMGl6WSIsInJpZCI6IjA1YjU3OGY5LTYyOTUtNGY4Yy04YTM4LTQxOTEyMjQ3ZWNmOSJ9.25Ncbf2LwuOrFfCYK-_GBtCwN1m66rj9W7PkpjzZ1GhAJngDW9y5tkIOg7lJAEOzBrXjzNBu4gCxwdY1qi7rDQ'
);

const newCategories = [
    'Lighting',
    'Audio',
    'Camera',
    'Network',
    'IT Equipment',
    'Peripherals',
    'Office Equipment',
    'Furniture',
    'Stationery',
    'General',
    'Cleaning Supplies'
];

const newLocations = [
    'Studio 1',
    'Studio 2',
    'Studio 3',
    'Main Office',
    'Server Room',
    'Storage Room A',
    'Storage Room B',
    'Meeting Room 1'
];

db.serialize(() => {
    // 1. Delete all existing categories (type = 'category' or 'Category')
    db.run("DELETE FROM settings WHERE LOWER(type) = 'category'", (err) => {
        if (err) console.error(err);
        else console.log("Deleted old categories");
    });
    
    // 2. Delete all existing locations
    db.run("DELETE FROM settings WHERE LOWER(type) = 'location'", (err) => {
        if (err) console.error(err);
        else console.log("Deleted old locations");
    });

    // 3. Insert new categories
    const stmt = db.prepare("INSERT INTO settings (type, value) VALUES (?, ?)");
    for (const cat of newCategories) {
        stmt.run('category', cat);
    }
    
    // 4. Insert new locations
    for (const loc of newLocations) {
        stmt.run('location', loc);
    }
    
    stmt.finalize();
    console.log("Inserted new categories and locations successfully!");
});
