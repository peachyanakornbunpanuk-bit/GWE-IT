const db = require('./database.js');

db.serialize(() => {
    db.run("INSERT INTO settings (type, value) VALUES (?, ?)", ["test", "value"], (err) => {
        if (err) console.error("Insert error:", err);
        else console.log("Insert works");
        db.close();
    });
});
