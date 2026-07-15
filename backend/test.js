const http = require('http');

const endpoints = [
    { name: 'Dashboard Metrics', path: '/api/dashboard' },
    { name: 'Asset Inventory', path: '/api/assets' },
    { name: 'Employee Roster', path: '/api/employees' },
    { name: 'Borrow Records', path: '/api/borrow' },
    { name: 'Repair Logs', path: '/api/repair' },
    { name: 'Purchase History', path: '/api/purchase' }
];

console.log("======================================");
console.log("   IAMS System Diagnostic Test        ");
console.log("======================================\n");

let testsCompleted = 0;
let passed = 0;

endpoints.forEach(endpoint => {
    http.get(`http://localhost:3000${endpoint.path}`, (res) => {
        const status = res.statusCode === 200 ? '✅ PASS' : '❌ FAIL';
        if (res.statusCode === 200) passed++;
        
        console.log(`[${status}] System: ${endpoint.name.padEnd(20)} | HTTP ${res.statusCode}`);
        
        // Consume response data to free up memory
        res.on('data', () => {});
        res.on('end', () => {
            testsCompleted++;
            if (testsCompleted === endpoints.length) {
                console.log("\n======================================");
                console.log(`Diagnostic Complete: ${passed}/${endpoints.length} Systems Normal`);
                if (passed === endpoints.length) {
                    console.log("Status: ALL SYSTEMS ARE WORKING PROPERLY 🚀");
                } else {
                    console.log("Status: PROBLEMS DETECTED ⚠️");
                }
                console.log("======================================");
            }
        });
    }).on('error', (e) => {
        console.log(`[❌ FAIL] System: ${endpoint.name.padEnd(20)} | Error: ${e.message}`);
        testsCompleted++;
    });
});
