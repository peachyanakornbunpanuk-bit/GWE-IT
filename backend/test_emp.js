const jwt = require('jsonwebtoken');

async function test() {
    try {
        const token = jwt.sign({ username: 'IT', role: 'IT Officer' }, 'supersecret123');
        const res = await fetch('https://gwe-it.onrender.com/api/employees', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        console.log("Employees API returned:", data);
    } catch (e) {
        console.error("Error:", e);
    }
}
test();
