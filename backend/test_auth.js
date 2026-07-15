async function test() {
    try {
        const loginRes = await fetch('http://localhost:3000/api/login', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'it', password: 'admin' })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log("Logged in");

        const notifRes = await fetch('http://localhost:3000/api/notifications?user=it&role=IT+Officer', { 
            headers: { Authorization: `Bearer ${token}` } 
        });
        if (!notifRes.ok) console.error("Notifications Error:", notifRes.status, await notifRes.text());
        else {
            const data = await notifRes.json();
            console.log("Notifications works:", data.length);
        }

        const settingsRes = await fetch('http://localhost:3000/api/settings', { 
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'category', value: 'Notebook' })
        });
        if (!settingsRes.ok) console.error("Settings Error:", settingsRes.status, await settingsRes.text());
        else console.log("Settings POST works");
    } catch (e) {
        console.error("Test failed:", e.message);
    }
}
test();
