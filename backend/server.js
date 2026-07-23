require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret123';

const p1 = "AQ.Ab8RN6KJiU6rwrM3";
const p2 = "eMFVXSPFHzhjayvKbnvdFeTvWtpDYvzQKg";
const fallbackGeminiKey = p1 + p2;
const genAI = new GoogleGenerativeAI(fallbackGeminiKey);

const nodemailer = require('nodemailer');
let transporter;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    // Use Real Gmail SMTP
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
    console.log('📧 Email System: Connected to Gmail SMTP.');
} else {
    // Fallback to Ethereal Mock Server for Testing
    nodemailer.createTestAccount((err, account) => {
        if (err) {
            console.error('Failed to create a testing account. ' + err.message);
            return;
        }
        transporter = nodemailer.createTransport({
            host: account.smtp.host,
            port: account.smtp.port,
            secure: account.smtp.secure,
            auth: { user: account.user, pass: account.pass }
        });
        console.log('📧 Email System: Connected to Ethereal Mock Server.');
    });
}

const sendEmail = (subject, text, html) => {
    if (!transporter) return;
    let message = {
        from: `IAMS Enterprise <${process.env.EMAIL_USER || 'iams@example.com'}>`,
        to: 'peachyanakornbunpanuk@gmail.com',
        subject: subject,
        text: text,
        html: html
    };
    transporter.sendMail(message, (err, info) => {
        if (err) return console.log('Error occurred sending email. ' + err.message);
        
        if (!process.env.EMAIL_USER) {
            console.log('Email Sent! Preview URL: %s', nodemailer.getTestMessageUrl(info));
        } else {
            console.log(`✅ Email Successfully Delivered to: ${message.to}`);
        }
    });
};

const generateEmailHtml = (title, description, badgeClass, badgeText, detailsMap) => {
    let rows = '';
    for (const [key, value] of Object.entries(detailsMap)) {
        rows += `
            <tr>
                <th>${key}</th>
                <td>${value}</td>
            </tr>
        `;
    }

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e0e6ed; }
            .header { background-color: #1976D2; color: #ffffff; padding: 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; letter-spacing: 1px; }
            .content { padding: 30px; color: #37474f; line-height: 1.6; }
            .badge { display: inline-block; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
            .badge.borrow { background-color: #FFF3E0; color: #E65100; }
            .badge.repair { background-color: #FFEBEE; color: #C62828; }
            .badge.add { background-color: #E8F5E9; color: #2E7D32; }
            .badge.damaged { background-color: #FFEBEE; color: #D32F2F; }
            .badge.info { background-color: #E3F2FD; color: #1565C0; }
            .badge.return { background-color: #E8F5E9; color: #2E7D32; }
            .details-table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px; }
            .details-table th, .details-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e0e6ed; }
            .details-table th { color: #78909c; font-weight: 600; width: 35%; }
            .details-table td { font-weight: 500; }
            .footer { background-color: #f8fafc; color: #78909c; text-align: center; padding: 15px; font-size: 12px; border-top: 1px solid #e0e6ed; }
            .btn { display: inline-block; padding: 10px 20px; background-color: #1976D2; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>IAMS Alert System</h1>
            </div>
            <div class="content">
                <h2 style="margin-top: 0;">${title}</h2>
                <p>${description}</p>
                <div style="margin-bottom: 15px;">
                    <span class="badge ${badgeClass}">Status: ${badgeText}</span>
                </div>
                <table class="details-table">
                    ${rows}
                </table>
                <p style="margin-top: 25px;">
                    <a href="http://172.20.10.3:5173" class="btn">View in Dashboard</a>
                </p>
            </div>
            <div class="footer">
                &copy; 2026 IT Asset Management System. This is an automatically generated email.
            </div>
        </div>
    </body>
    </html>
    `;
};

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

// Add CORS headers for API
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Fallback for cached frontend clients sending requests to /api/api/...
app.use((req, res, next) => {
    if (req.url.startsWith('/api/api/')) {
        req.url = req.url.replace('/api/api/', '/api/');
    }
    next();
});

const upload = multer({ storage });

app.use(express.json());
app.use('/uploads', express.static(uploadDir));

app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '1.0.1' }));

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(401).json({ error: "Invalid token" });
        req.user = user;
        next();
    });
};

// Apply to all /api routes except login and upload
app.use('/api', (req, res, next) => {
    if (req.path === '/login') return next();
    
    authenticateToken(req, res, (err) => {
        if (err) return next(err);
        
        // RBAC Middleware
        const allowedForEmployees = [
            { method: 'GET', path: '/assets' },
            { method: 'GET', path: '/employees' },
            { method: 'GET', path: '/notifications' },
            { method: 'PUT', path: '/notifications/' },
            { method: 'POST', path: '/borrow' },
            { method: 'POST', path: '/return' }
        ];
        
        if (req.user.role === 'Employee') {
            const isAllowed = allowedForEmployees.some(route => 
                req.method === route.method && req.path.startsWith(route.path)
            );
            if (!isAllowed) {
                return res.status(403).json({ error: "Forbidden: Insufficient privileges" });
            }
        }
        next();
    });
});

const logAudit = (asset_id, action, description, user) => {
    const timestamp = new Date().toISOString();
    const actor = user || 'System';
    db.run(
        `INSERT INTO audit_logs (asset_id, action, description, timestamp, user) VALUES (?, ?, ?, ?, ?)`,
        [asset_id, action, description, timestamp, actor],
        (err) => { if (err) console.error('Audit log failed:', err.message); }
    );
};

const createNotification = (user, title, message, link, icon, color) => {
    const timestamp = new Date().toISOString();
    db.run(
        `INSERT INTO notifications (user, title, message, link, timestamp, icon, color) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user, title, message, link, timestamp, icon, color],
        (err) => { if (err) console.error('Notification failed:', err.message); }
    );
};

// NOTIFICATIONS
app.get('/api/notifications', (req, res) => {
    const user = req.query.user;
    const role = req.query.role;
    let query = "SELECT * FROM notifications WHERE user = ?";
    let params = [user];
    if (role === 'Manager' || role === 'IT Officer') {
        query = "SELECT * FROM notifications WHERE user = ? OR user = 'GLOBAL_IT' ORDER BY timestamp DESC LIMIT 50";
        params = [user];
    } else {
        query = "SELECT * FROM notifications WHERE user = ? ORDER BY timestamp DESC LIMIT 50";
    }
    
    db.all(query, params, (err, rows) => {
        if (err) {
            console.error("GET /api/notifications Error:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.put('/api/notifications/:id/read', (req, res) => {
    db.run("UPDATE notifications SET is_read = 1 WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Marked as read" });
    });
});

app.put('/api/notifications/read-all', (req, res) => {
    const user = req.body.user;
    const role = req.body.role;
    let query = "UPDATE notifications SET is_read = 1 WHERE user = ?";
    let params = [user];
    if (role === 'Manager' || role === 'IT Officer') {
        query = "UPDATE notifications SET is_read = 1 WHERE user = ? OR user = 'GLOBAL_IT'";
    }
    db.run(query, params, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "All marked as read" });
    });
});

// AUTHENTICATION
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    db.get("SELECT id, username, password as hash, role FROM users WHERE username = ?", [username], async (err, user) => {
        try {
            if (err) return res.status(500).json({ error: err.message });
            if (!user) return res.status(401).json({ error: "Invalid credentials" });
            
            const validPassword = await bcrypt.compare(String(password), String(user.hash));
            if (!validPassword) return res.status(401).json({ error: "Invalid credentials" });
            
            const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
            delete user.hash;
            
            res.json({ message: "Login successful", user, token });
        } catch (error) {
            console.error("Login error:", error);
            res.status(500).json({ error: "Internal server error during login" });
        }
    });
});

// AUDIT LOGS
app.get('/api/audit/:asset_id', (req, res) => {
    db.all("SELECT * FROM audit_logs WHERE asset_id = ? ORDER BY timestamp DESC", [req.params.asset_id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// DASHBOARD
app.get('/api/dashboard', (req, res) => {
    db.all("SELECT * FROM assets", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const totalAssets = rows.length;
        const availableAssets = rows.filter(a => a.status === 'Available').length;
        const borrowedAssets = rows.filter(a => a.status === 'Borrowed').length;
        const repairDamagedAssets = rows.filter(a => ['Repair', 'Damaged'].includes(a.status)).length;
        const totalValue = rows.reduce((sum, a) => sum + (a.value || 0), 0);
        res.json({ totalAssets, availableAssets, borrowedAssets, repairDamagedAssets, totalValue });
    });
});

app.get('/api/analytics', (req, res) => {
    db.all("SELECT * FROM assets", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Group by category (Count & Value)
        const categories = {};
        const locations = {};
        const statuses = {};
        
        rows.forEach(asset => {
            // Category
            if (!categories[asset.category]) categories[asset.category] = { count: 0, value: 0 };
            categories[asset.category].count += 1;
            categories[asset.category].value += (asset.value || 0);
            
            // Location
            if (!locations[asset.location]) locations[asset.location] = 0;
            locations[asset.location] += 1;
            
            // Status
            if (!statuses[asset.status]) statuses[asset.status] = 0;
            statuses[asset.status] += 1;
        });
        
        res.json({ categories, locations, statuses });
    });
});

// SETTINGS
app.get('/api/settings', (req, res) => {
    db.all("SELECT * FROM settings", [], (err, rows) => res.json(rows));
});

app.post('/api/settings', (req, res) => {
    const { type, value } = req.body;
    db.run(
        `INSERT INTO settings (type, value) VALUES (?, ?)`,
        [type, value],
        function(err) {
            if (err) {
                console.error("POST /api/settings Error:", err.message);
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: "Setting added successfully", id: this.lastID });
        }
    );
});

app.delete('/api/settings/:id', (req, res) => {
    db.run(`DELETE FROM settings WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Setting deleted" });
    });
});

app.put('/api/settings/:id', (req, res) => {
    const { value } = req.body;
    
    // Fetch old setting to know its type and old value
    db.get(`SELECT type, value as oldValue FROM settings WHERE id = ?`, [req.params.id], (err, row) => {
        if (err || !row) return res.status(500).json({ error: "Setting not found" });
        
        // 1. Update the setting itself
        db.run(`UPDATE settings SET value = ? WHERE id = ?`, [value, req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // 2. Cascade changes based on type
            if (row.type === 'Category') {
                db.run(`UPDATE assets SET category = ? WHERE category = ?`, [value, row.oldValue]);
                db.run(`UPDATE purchases SET category = ? WHERE category = ?`, [value, row.oldValue]);
            } else if (row.type === 'Department') {
                db.run(`UPDATE employees SET department = ? WHERE department = ?`, [value, row.oldValue]);
            } else if (row.type === 'Vendor') {
                db.run(`UPDATE purchases SET supplier = ? WHERE supplier = ?`, [value, row.oldValue]);
                db.run(`UPDATE repair_records SET vendor = ? WHERE vendor = ?`, [value, row.oldValue]);
            } else if (row.type === 'Location') {
                db.run(`UPDATE assets SET location = ? WHERE location = ?`, [value, row.oldValue]);
            }
            
            res.json({ message: "Setting updated and changes cascaded successfully" });
        });
    });
});

// ASSETS
app.get('/api/assets', (req, res) => {
    db.all("SELECT * FROM assets", [], (err, rows) => res.json(rows));
});

app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
});

const generatePrefix = (category) => {
    if (!category) return 'AST';
    let prefix = category.toUpperCase().replace(/[AEIOU\s\W\d_]/g, '').substring(0, 4);
    if (!prefix || prefix.length === 0) prefix = 'AST';
    return prefix;
};

const getNextAssetId = (category, callback) => {
    const prefix = generatePrefix(category);
    db.get(`SELECT id FROM assets WHERE id LIKE ? ORDER BY CAST(SUBSTR(id, LENGTH(?) + 2) AS INTEGER) DESC LIMIT 1`, [`${prefix}-%`, prefix], (err, row) => {
        let nextNum = 1;
        if (row && row.id) {
            const parts = row.id.split('-');
            if (parts.length > 1) {
                const num = parseInt(parts[1], 10);
                if (!isNaN(num)) nextNum = num + 1;
            }
        }
        callback(prefix, nextNum);
    });
};

app.post('/api/assets', (req, res) => {
    let { id, name, category, status, holder, value, user, image_url, location } = req.body;
    
    const performInsert = (finalId, finalImageUrl) => {
        db.run(
            `INSERT INTO assets (id, name, category, status, holder, value, image_url, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [finalId, name, category, status, holder, value, finalImageUrl, location || '-'],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                
                if (finalImageUrl) {
                    db.run(`UPDATE assets SET image_url = ? WHERE name = ? AND (image_url IS NULL OR image_url = '')`, [finalImageUrl, name]);
                }
                
                logAudit(finalId, 'CREATE_ASSET', `Asset created manually: ${name}`, user);
                createNotification('GLOBAL_IT', 'New Asset Added', `Manual entry: ${name}`, `/asset/${finalId}/scan`, 'add_circle', 'positive');
                
                const html = generateEmailHtml(
                    'New Hardware Registered',
                    'A new asset has been successfully registered in the system.',
                    'add',
                    'Available',
                    {
                        'Asset ID': finalId,
                        'Asset Name': name,
                        'Category': category,
                        'Value': `฿${(value||0).toLocaleString()}`
                    }
                );
                sendEmail('🟢 Alert: New Hardware Registered', `Asset ${finalId} (${name}) registered`, html);
                
                res.json({ message: "Asset added successfully", id: finalId });
            }
        );
    };

    const processImageAndInsert = (finalId) => {
        if (!image_url) {
            db.get("SELECT image_url FROM assets WHERE name = ? AND image_url IS NOT NULL AND image_url != '' LIMIT 1", [name], (err, row) => {
                performInsert(finalId, row ? row.image_url : null);
            });
        } else {
            performInsert(finalId, image_url);
        }
    };

    if (!id || id.trim() === '') {
        getNextAssetId(category, (prefix, nextNum) => {
            const finalId = `${prefix}-${String(nextNum).padStart(4, '0')}`;
            processImageAndInsert(finalId);
        });
    } else {
        processImageAndInsert(id);
    }
});


app.get('/api/assets/:id', (req, res) => {
    db.get("SELECT * FROM assets WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Asset not found" });
        res.json(row);
    });
});

app.put('/api/assets/:id', (req, res) => {
    const { name, category, status, holder, value, user, image_url, location } = req.body;
    
    db.get("SELECT status FROM assets WHERE id = ?", [req.params.id], (err, oldRow) => {
        db.run(
            `UPDATE assets SET name = ?, category = ?, status = ?, holder = ?, value = ?, image_url = ?, location = ? WHERE id = ?`,
            [name, category, status, holder, value, image_url, location || '-', req.params.id],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                
                if (image_url) {
                    db.run(`UPDATE assets SET image_url = ? WHERE name = ? AND (image_url IS NULL OR image_url = '')`, [image_url, name]);
                }
                
                if (oldRow && oldRow.status !== 'Damaged' && status === 'Damaged') {
                    const html = generateEmailHtml(
                        'Equipment Damaged',
                        'An asset has been marked as damaged. Please inspect immediately.',
                        'damaged',
                        'Damaged',
                        {
                            'Asset ID': req.params.id,
                            'Asset Name': name,
                            'Category': category,
                            'Reported By': user || 'System'
                        }
                    );
                    sendEmail('🚨 Critical Alert: Asset Damaged', `Asset ${req.params.id} (${name}) has been marked as Damaged.`, html);
                }
                
                logAudit(req.params.id, 'UPDATE_ASSET', `Asset updated: Status=${status}, Holder=${holder || 'None'}`, user);
                res.json({ message: "Asset updated successfully" });
            }
        );
    });
});

app.delete('/api/assets/:id', (req, res) => {
    const user = req.query.user || 'System';
    db.run(`DELETE FROM assets WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        logAudit(req.params.id, 'DELETE_ASSET', `Asset completely deleted from system`, user);
        res.json({ message: "Asset deleted" });
    });
});

app.post('/api/assets/bulk', (req, res) => {
    const { assets } = req.body;
    if (!assets || !Array.isArray(assets)) return res.status(400).json({ error: "Invalid assets array" });

    db.all("SELECT name, image_url FROM assets WHERE image_url IS NOT NULL AND image_url != ''", [], (err, rows) => {
        const imageMap = {};
        if (rows) {
            rows.forEach(r => imageMap[r.name] = r.image_url);
        }

        const stmt = db.prepare(`INSERT OR REPLACE INTO assets (id, name, category, status, holder, value, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)`);
        
        assets.forEach(a => {
            stmt.run([a.id, a.name, a.category, a.status || 'Available', a.holder || null, a.value || 0, imageMap[a.name] || null]);
        });
        
        stmt.finalize((err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: `Successfully synced ${assets.length} assets` });
        });
    });
});

// EMPLOYEES
app.get('/api/employees', (req, res) => {
    db.all("SELECT * FROM employees", [], (err, rows) => res.json(rows));
});

app.post('/api/employees', (req, res) => {
    const { id, name, department, email } = req.body;
    db.run(
        `INSERT INTO employees (id, name, department, email) VALUES (?, ?, ?, ?)`,
        [id, name, department, email],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Employee added successfully" });
        }
    );
});

app.put('/api/employees/:id', (req, res) => {
    const { name, department, email } = req.body;
    db.run(
        `UPDATE employees SET name = ?, department = ?, email = ? WHERE id = ?`,
        [name, department, email, req.params.id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Employee updated" });
        }
    );
});

app.delete('/api/employees/:id', (req, res) => {
    db.run(`DELETE FROM employees WHERE id = ?`, [req.params.id], function(err) {
        res.json({ message: "Employee deleted" });
    });
});

// BORROW / RETURN
app.get('/api/borrow', (req, res) => {
    db.all("SELECT * FROM borrow_records", [], (err, rows) => res.json(rows));
});

app.post('/api/borrow', (req, res) => {
    const { asset_ids, employee_id, borrow_date, expected_return_date, reason, user, location } = req.body;
    
    if (!asset_ids || asset_ids.length === 0) return res.status(400).json({ error: "No assets provided" });

    let completed = 0;
    let hasError = false;

    asset_ids.forEach(id => {
        db.run(`INSERT INTO borrow_records (asset_id, employee_id, borrow_date, expected_return_date, reason, status) VALUES (?, ?, ?, ?, ?, 'Active')`, [id, employee_id, borrow_date, expected_return_date, reason], (err) => {
            if (err) { hasError = true; console.error(err); }
        });
        
        if (location) {
            db.run(`UPDATE assets SET status = 'Borrowed', holder = ?, location = ? WHERE id = ?`, [employee_id, location, id], (err) => { if (err) console.error(err); });
        } else {
            db.run(`UPDATE assets SET status = 'Borrowed', holder = ? WHERE id = ?`, [employee_id, id], (err) => { if (err) console.error(err); });
        }
        
        logAudit(id, 'BORROW', `Borrowed by ${employee_id}. Reason: ${reason || 'N/A'}`, user);
        createNotification('GLOBAL_IT', 'Asset Borrowed', `Asset ${id} checked out by ${employee_id}`, `/asset/${id}/scan`, 'swap_horiz', 'warning');
        
        const html = generateEmailHtml(
            'Equipment Borrowed',
            'This is an automated notification from the IT Asset Management System.',
            'borrow',
            'Borrowed',
            {
                'Asset ID': id,
                'Employee ID': employee_id,
                'Reason': reason || 'N/A',
                'Time': new Date().toLocaleString()
            }
        );
        sendEmail('🟠 Alert: Equipment Borrowed', `Asset ${id} borrowed by ${employee_id}`, html);
        
        completed++;
        if (completed === asset_ids.length) {
            if (hasError) return res.status(500).json({ error: "Error borrowing some assets" });
            res.json({ message: "Assets Borrowed Successfully" });
        }
    });
});

app.post('/api/return', (req, res) => {
    const { borrow_id, asset_id, return_date, condition, user, location } = req.body;
    
    db.run(`UPDATE borrow_records SET return_date = ?, status = 'Returned' WHERE asset_id = ? AND status = 'Active'`, [return_date, asset_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (location) {
            db.run(`UPDATE assets SET status = 'Available', holder = '-', location = ? WHERE id = ?`, [location, asset_id]);
        } else {
            db.run(`UPDATE assets SET status = 'Available', holder = '-' WHERE id = ?`, [asset_id]);
        }
        
        logAudit(asset_id, 'RETURN', `Returned in condition: ${condition || 'N/A'}`, user);
        createNotification('GLOBAL_IT', 'Asset Returned', `Asset ${asset_id} returned. Condition: ${condition || 'N/A'}`, `/asset/${asset_id}/scan`, 'keyboard_return', 'info');
        
        const html = generateEmailHtml(
            'Equipment Returned',
            'An asset has been returned to the IT inventory.',
            'return',
            'Returned',
            {
                'Asset ID': asset_id,
                'Condition': condition || 'N/A',
                'Time': new Date().toLocaleString()
            }
        );
        sendEmail('🟢 Alert: Equipment Returned', `Asset ${asset_id} returned`, html);
        
        res.json({ message: "Asset Returned Successfully" });
    });
});

// REPAIR
app.get('/api/repair', (req, res) => {
    db.all("SELECT * FROM repair_records", [], (err, rows) => res.json(rows));
});

app.post('/api/repair', (req, res) => {
    const { asset_id, issue, vendor, cost, repair_date, user } = req.body;
    db.serialize(() => {
        db.run(`INSERT INTO repair_records (asset_id, issue, vendor, cost, repair_date, status) VALUES (?, ?, ?, ?, ?, 'In Repair')`, [asset_id, issue, vendor, cost, repair_date]);
        db.run(`UPDATE assets SET status = 'Repair' WHERE id = ?`, [asset_id], function(err) {
            logAudit(asset_id, 'SENT_TO_REPAIR', `Issue: ${issue}. Vendor: ${vendor}. Estimated Cost: ${cost}`, user);
            createNotification('GLOBAL_IT', 'Asset in Repair', `Asset ${asset_id} sent to ${vendor}`, `/repair`, 'build', 'negative');
            
            const html = generateEmailHtml(
                'Equipment Sent to Repair',
                'An asset has been flagged as requiring maintenance and has been sent for repair.',
                'repair',
                'In Repair',
                {
                    'Asset ID': asset_id,
                    'Issue': issue,
                    'Vendor': vendor,
                    'Est. Cost': `฿${parseFloat(cost).toLocaleString()}`
                }
            );
            sendEmail('🔴 Alert: Equipment Sent to Repair', `Asset ${asset_id} sent to ${vendor}`, html);
            
            res.json({ message: "Asset sent to repair" });
        });
    });
});

app.post('/api/repair/finish', (req, res) => {
    const { repair_id, asset_id, user } = req.body;
    db.run(`UPDATE repair_records SET status = 'Completed' WHERE id = ?`, [repair_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        
        db.run(`UPDATE assets SET status = 'Available' WHERE id = ?`, [asset_id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            logAudit(asset_id, 'REPAIR_RESOLVED', `Repaired completely and returned to inventory`, user);
            createNotification('GLOBAL_IT', 'Repair Completed', `Asset ${asset_id} is back in inventory`, `/asset/${asset_id}/scan`, 'build_circle', 'positive');
            res.json({ message: "Repair Completed" });
        });
    });
});

// PURCHASE
app.get('/api/purchase', (req, res) => {
    db.all("SELECT * FROM purchases", [], (err, rows) => res.json(rows));
});

app.post('/api/purchase', (req, res) => {
    const { item_name, category, supplier, unit_cost, purchase_date, quantity = 1, user, location = '-' } = req.body;
    
    const totalCost = unit_cost * quantity;
    
    db.run(`INSERT INTO purchases (item_name, category, supplier, cost, unit_cost, quantity, purchase_date, status, location) VALUES (?, ?, ?, ?, ?, ?, ?, 'Received', ?)`, [item_name, category, supplier, totalCost, unit_cost, quantity, purchase_date, location], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        
        getNextAssetId(category, (prefix, nextNum) => {
            db.get("SELECT image_url FROM assets WHERE name = ? AND image_url IS NOT NULL AND image_url != '' LIMIT 1", [item_name], (err, imgRow) => {
                const foundImageUrl = imgRow ? imgRow.image_url : null;
                
                const stmt = db.prepare(`INSERT INTO assets (id, name, category, status, holder, value, image_url, location) VALUES (?, ?, ?, 'Available', '-', ?, ?, ?)`);
                let currentNum = nextNum;
                for (let i = 0; i < quantity; i++) {
                    const assetId = `${prefix}-${String(currentNum).padStart(4, '0')}`;
                    stmt.run([assetId, item_name, category, unit_cost, foundImageUrl, location]);
                    logAudit(assetId, 'PURCHASED', `Procured from ${supplier} via bulk order`, user);
                    currentNum++;
                }
                
                stmt.finalize((err) => {
                    if (err) return res.status(500).json({ error: err.message });
                    
                    createNotification('GLOBAL_IT', 'Procurement Arrived', `${quantity}x ${item_name} received from ${supplier}`, `/purchase`, 'shopping_cart', 'info');
                    
                    const html = generateEmailHtml(
                        'Procurement Arrived',
                        'A new bulk purchase has arrived and assets have been automatically generated.',
                        'add',
                        'Received',
                        {
                            'Item Name': item_name,
                            'Quantity': quantity,
                            'Supplier': supplier,
                            'Total Cost': `฿${parseFloat(totalCost).toLocaleString()}`
                        }
                    );
                    sendEmail('📦 Procurement Alert: New Hardware Arrived', `${quantity}x ${item_name} received from ${supplier}.`, html);
                    
                    res.json({ message: "Purchase completed and assets auto-generated" });
                });
            });
        });
    });
});

// --- AI Chatbot Endpoint ---
const searchAssetsTool = {
  name: "search_assets",
  description: "Searches the IT asset database by category or status to answer user questions about inventory. Returns counts of items.",
  parameters: {
    type: "OBJECT",
    properties: {
      category: { type: "STRING", description: "e.g., Laptop, Audio, Lighting, Camera, Network" },
      status: { type: "STRING", description: "e.g., Available, Borrowed, Repair" }
    }
  }
};

const fallbackModels = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-flash-latest"
];

let workingModelIndex = 0;

app.post('/api/chat', authenticateToken, async (req, res) => {
    try {
        const { message, history } = req.body;
        let formattedHistory = (history || []).map(msg => ({
            role: msg.role === 'ai' ? 'model' : 'user',
            parts: [{ text: msg.text }]
        }));
        
        if (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
            formattedHistory.shift();
        }
        
        let result = null;
        let chat = null;
        
        for (let i = workingModelIndex; i < fallbackModels.length; i++) {
            try {
                const aiModel = genAI.getGenerativeModel({
                  model: fallbackModels[i],
                  tools: [{ functionDeclarations: [searchAssetsTool] }],
                  systemInstruction: "You are the IAMS IT Assistant. You help employees check inventory. Use the search_assets tool to check the database when asked about equipment. RULES: 1. You MUST respond ONLY in Thai. 2. Keep your answers EXTREMELY concise and short (1-2 sentences max). 3. Do not add conversational filler. 4. VERY IMPORTANT: When counting items, you MUST SUM the 'qty' field from the tool response (do NOT just count the number of rows)."
                });
                
                chat = aiModel.startChat({ history: formattedHistory });
                result = await chat.sendMessage(message);
                
                workingModelIndex = i; // Save the working model for next time
                break;
            } catch (err) {
                if (err.message && (err.message.includes("404") || err.message.includes("not found"))) {
                    console.warn(`Model ${fallbackModels[i]} failed. Trying next...`);
                    continue;
                }
                throw err;
            }
        }
        
        if (!result) {
            throw new Error("All fallback models failed to respond.");
        }
        
        const call = result.response.functionCalls()?.[0];
        if (call && call.name === "search_assets") {
            const { category, status } = call.args;
            let query = "SELECT name, category, status, COUNT(*) as qty FROM assets WHERE 1=1";
            let params = [];
            if (category) { query += " AND category LIKE ?"; params.push(`%${category}%`); }
            if (status) { query += " AND status = ?"; params.push(status); }
            query += " GROUP BY name, category, status LIMIT 500";
            
            db.all(query, params, async (err, rows) => {
                try {
                    if (err) return res.status(500).json({ error: err.message });
                    const toolResult = await chat.sendMessage([{
                        functionResponse: { name: "search_assets", response: { items: rows } }
                    }]);
                    res.json({ text: toolResult.response.text() });
                } catch (toolErr) {
                    console.error("Gemini Tool Error:", toolErr);
                    res.status(500).json({ text: "Sorry, I encountered an error while searching the database." });
                }
            });
        } else {
            res.json({ text: result.response.text() });
        }
    } catch (err) {
        console.error("Gemini AI Error:", err);
        res.status(500).json({ text: "Sorry, I'm having trouble connecting to my brain right now." });
    }
});

// Serve Vue Frontend
app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(port, '0.0.0.0', () => {
    console.log(`IAMS Backend listening at http://0.0.0.0:${port}`);
});
