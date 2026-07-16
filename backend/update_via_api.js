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

const API_URL = 'https://gwe-it.onrender.com/api';

async function updateSettings() {
    try {
        console.log("Logging into Live API...");
        const loginRes = await fetch(`${API_URL}/login`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'it', password: 'admin' })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;
        if (!token) throw new Error("Failed to get token");

        console.log("Fetching existing settings from Live Render Backend...");
        const res = await fetch(`${API_URL}/settings`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const settings = await res.json();
        
        console.log(`Found ${settings.length} total settings. Deleting old categories and locations...`);
        
        for (const s of settings) {
            if (s.type.toLowerCase() === 'category' || s.type.toLowerCase() === 'location') {
                await fetch(`${API_URL}/settings/${s.id}`, { 
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log(`Deleted ${s.type}: ${s.value}`);
            }
        }
        
        console.log("Inserting new categories...");
        for (const cat of newCategories) {
            await fetch(`${API_URL}/settings`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ type: 'category', value: cat })
            });
            console.log(`Added category: ${cat}`);
        }
        
        console.log("Inserting new locations...");
        for (const loc of newLocations) {
            await fetch(`${API_URL}/settings`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ type: 'location', value: loc })
            });
            console.log(`Added location: ${loc}`);
        }
        
        console.log("✅ Successfully updated live database via API!");
        
    } catch (err) {
        console.error("Failed:", err);
    }
}

updateSettings();
