require('dotenv').config();
const { createClient } = require('@libsql/client');

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

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

async function updateDb() {
    try {
        console.log("Connecting to Turso...");
        
        // 1. Delete old categories
        await client.execute("DELETE FROM settings WHERE LOWER(type) = 'category'");
        console.log("Deleted old categories");
        
        // 2. Delete old locations
        await client.execute("DELETE FROM settings WHERE LOWER(type) = 'location'");
        console.log("Deleted old locations");
        
        // 3. Insert new categories
        for (const cat of newCategories) {
            await client.execute({
                sql: "INSERT INTO settings (type, value) VALUES (?, ?)",
                args: ['category', cat]
            });
        }
        
        // 4. Insert new locations
        for (const loc of newLocations) {
            await client.execute({
                sql: "INSERT INTO settings (type, value) VALUES (?, ?)",
                args: ['location', loc]
            });
        }
        
        console.log("Successfully updated settings in Turso!");
    } catch (err) {
        console.error("Error:", err);
    }
}

updateDb();
