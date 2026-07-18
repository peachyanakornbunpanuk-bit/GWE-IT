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
    
    db.all("SELECT * FROM assets WHERE name LIKE '%Cable Ziplock%' OR id = '' OR id IS NULL", [], (err, rows) => {
        if (err) {
            console.error(err);
        } else {
            console.log("Found assets:");
            console.log(JSON.stringify(rows, null, 2));
            
            // Delete them
            if (rows.length > 0) {
                db.run("DELETE FROM assets WHERE name LIKE '%Cable Ziplock%' OR id = '' OR id IS NULL", [], function(err) {
                    if (err) console.error(err);
                    else console.log(`Deleted ${this.changes} rows.`);
                });
            }
        }
    });
});
