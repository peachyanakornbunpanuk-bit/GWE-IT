const sqlite3 = require('@libsql/sqlite3').verbose();

const baseUrl = 'libsql://gwe-db-peachyanakornbunpanuk-bit.aws-ap-northeast-1.turso.io';
const t1 = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQxNjkwNTQsImlkIjoiMDE5ZjYzOTMtODkwMS03NmEzLThlYTMtY2RiOWU3NzkxYzBmIiwia2lkIjoiS2JJWnlLVGx5NGhzWWZxWEJMcUtnQlhBbng1ZUZpSzI2ZXlWR3NPMGl6WSIsInJpZCI6IjA1YjU3OGY5LTYyOTUtNGY4Yy04YTM4LTQxOTEyMjQ3ZWNmOSJ9.";
const t2 = "GBRMu82GewmEsy620qxxX7jeE4Yt1S1nZKIFs_pa2RA2DpKfx1pfUNjzMSbtVABNHLOfLfx2EuVqPX2IRr18Aw";
const authToken = (t1 + t2);
const url = `${baseUrl}?authToken=${authToken}`;

const db = new sqlite3.Database(url, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
        process.exit(1);
    }
    
    db.serialize(() => {
        // 1. Check if 'Main Building' exists
        db.get("SELECT * FROM settings WHERE type = 'building' AND value = 'Main Building'", (err, row) => {
            if (!row) {
                db.run("INSERT INTO settings (type, value) VALUES ('building', 'Main Building')");
            }
        });

        // 2. Prefix settings
        db.run("UPDATE settings SET value = 'Main Building > ' || value WHERE type = 'location' AND value NOT LIKE '% > %'", function(err) {
            console.log(`Updated ${this.changes} location settings.`);
        });

        // 3. Prefix assets location
        db.run("UPDATE assets SET location = 'Main Building > ' || location WHERE location != '-' AND location IS NOT NULL AND location NOT LIKE '% > %'", function(err) {
            console.log(`Updated ${this.changes} asset locations.`);
        });
        
        // 4. Prefix purchases location
        db.run("UPDATE purchases SET location = 'Main Building > ' || location WHERE location != '-' AND location IS NOT NULL AND location NOT LIKE '% > %'", function(err) {
            console.log(`Updated ${this.changes} purchase locations.`);
        });
    });
});
