const xlsx = require('xlsx');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function runMigration() {
    console.log("Starting Legacy Data Migration...");
    
    // Generate an admin token for the script
    const token = jwt.sign({ id: 1, username: 'Admin', role: 'Manager' }, process.env.JWT_SECRET || 'supersecret123', { expiresIn: '1h' });

    // 1. Read Excel
    const workbook = xlsx.readFile('C:\\Users\\Peach\\OneDrive - BUU\\Documents\\Stock Inventory.xlsx');
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    console.log(`Found ${rows.length} total rows. Processing...`);

    // 2. Helper for Category Mapping
    const getCategory = (name) => {
        if (!name) return 'General';
        const n = name.toLowerCase();
        if (n.includes('ไฟ') || n.includes('สปอร์ตไลท์') || n.includes('灯')) return 'Lighting';
        if (n.includes('ไมค์') || n.includes('หูฟัง') || n.includes('มิกเซอร์') || n.includes('麦克风') || n.includes('耳机')) return 'Audio';
        if (n.includes('กล้อง') || n.includes('เลนส์') || n.includes('相机')) return 'Camera';
        if (n.includes('ปลั๊ก') || n.includes('สาย') || n.includes('lan') || n.includes('hdmi') || n.includes('插座')) return 'Network';
        if (n.includes('คอมพิวเตอร์') || n.includes('monitor') || n.includes('电脑')) return 'IT Equipment';
        if (n.includes('คีย์บอร์ด') || n.includes('เมาส์')) return 'Peripherals';
        if (n.includes('โต๊ะ') || n.includes('เก้าอี้') || n.includes('桌子') || n.includes('椅子') || n.includes('ฉากกั้นห้อง')) return 'Furniture';
        if (n.includes('ปากกา') || n.includes('กระดาษ') || n.includes('แฟ้ม') || n.includes('กรรไกร') || n.includes('เทป') || n.includes('มีด') || n.includes('เครื่องเจาะ') || n.includes('เครื่องเย็บ')) return 'Stationery';
        if (n.includes('เครื่องพิมพ์')) return 'Office Equipment';
        if (n.includes('น้ำยา') || n.includes('ถุงขยะ') || n.includes('ไม้กวาด') || n.includes('ถังปั่น')) return 'Cleaning Supplies';
        return 'General';
    };

    // Keep track of what we've processed to avoid exact duplicate names if any exist on different rows
    const processedNames = new Set();
    let successCount = 0;

    // Data starts at row index 2
    for (let i = 2; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 2) continue; // Skip empty rows

        const name = row[1];
        if (!name || name.trim() === '') continue;

        if (processedNames.has(name)) {
            console.log(`Skipping duplicate item name: ${name}`);
            continue;
        }

        let rawDate = row[2] || '2025.01.01';
        // Replace dots with dashes for standard date format
        const purchaseDate = rawDate.toString().replace(/\./g, '-');
        
        const category = getCategory(name);

        const payload = {
            item_name: name,
            category: category,
            supplier: 'Legacy System Migration',
            unit_cost: 0,
            quantity: 1, // Only inserting 1 as a placeholder catalog entry!
            purchase_date: purchaseDate,
            user: 'System Migration'
        };

        try {
            // Post to our local API so it handles all the generation, audit logs, and notifications!
            const res = await fetch('http://localhost:3000/api/purchase', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Status ${res.status}: ${text}`);
            }

            console.log(`[SUCCESS] Imported: ${name} -> Category: ${category}`);
            processedNames.add(name);
            successCount++;
            
            // Wait 100ms between requests to not overwhelm the server/SQLite lock
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err) {
            console.error(`[ERROR] Failed to import: ${name}`, err.message);
        }
    }

    console.log(`\nMigration Complete! Successfully imported ${successCount} unique catalog items.`);
}

runMigration();
