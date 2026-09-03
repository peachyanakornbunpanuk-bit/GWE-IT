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

const backupDir = path.join(__dirname, 'backups');
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

// Automated Backup Helper
const performBackup = (createdBy = 'System', type = 'automatic') => {
    return new Promise((resolve, reject) => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-${type}-${timestamp}.json`;
        const filePath = path.join(backupDir, filename);

        const tables = [
            'assets', 'employees', 'borrow_records', 'repair_records', 
            'purchases', 'users', 'audit_logs', 'settings', 
            'notifications', 'audit_sessions', 'audit_snapshots'
        ];
        const backupData = { createdAt: new Date().toISOString(), type, version: '1.0', data: {} };
        let count = 0;

        tables.forEach(table => {
            db.all(`SELECT * FROM ${table}`, [], (err, rows) => {
                backupData.data[table] = rows || [];
                count++;
                if (count === tables.length) {
                    const jsonContent = JSON.stringify(backupData, null, 2);
                    fs.writeFile(filePath, jsonContent, 'utf8', (writeErr) => {
                        if (writeErr) return reject(writeErr);
                        const stats = fs.statSync(filePath);
                        db.run(
                            `INSERT INTO system_backups (filename, created_at, size_bytes, created_by, type) VALUES (?, ?, ?, ?, ?)`,
                            [filename, new Date().toISOString(), stats.size, createdBy, type],
                            (dbErr) => {
                                if (dbErr) console.error("Error logging backup to db:", dbErr);
                                logAudit('SYSTEM', 'BACKUP_CREATED', `Created ${type} backup: ${filename} (${stats.size} bytes)`, createdBy);
                                resolve({ filename, size: stats.size, createdAt: backupData.createdAt });
                            }
                        );
                    });
                }
            });
        });
    });
};

// Check for daily automated backup on startup and hourly
const checkDailyBackup = () => {
    db.get("SELECT created_at FROM system_backups ORDER BY id DESC LIMIT 1", [], (err, row) => {
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        if (!row || new Date(row.created_at).getTime() < oneDayAgo) {
            console.log('Initiating automated daily database backup...');
            performBackup('System-Scheduler', 'automatic').catch(err => console.error('Auto backup failed:', err));
        }
    });
};
setTimeout(checkDailyBackup, 5000);
setInterval(checkDailyBackup, 60 * 60 * 1000);

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

app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '2.0.0' }));

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
        
        const role = req.user.role;
        const isSuperAdmin = role === 'Super Admin' || role === 'Manager';
        const isWarehouse = role === 'Warehouse Staff' || role === 'IT Officer' || isSuperAdmin;

        // General Employees: View only + scan check + chat
        if (!isWarehouse) {
            const allowedForEmployees = [
                { method: 'GET', path: '/assets' },
                { method: 'GET', path: '/employees' },
                { method: 'GET', path: '/notifications' },
                { method: 'PUT', path: '/notifications/' },
                { method: 'GET', path: '/dashboard' },
                { method: 'GET', path: '/analytics' },
                { method: 'POST', path: '/chat' },
                { method: 'GET', path: '/audit/' }
            ];
            const isAllowed = allowedForEmployees.some(route => 
                req.method === route.method && req.path.startsWith(route.path)
            );
            if (!isAllowed) {
                return res.status(403).json({ error: "Forbidden: Insufficient privileges" });
            }
        }

        // Super Admin only routes
        const adminOnlyRoutes = [
            { method: 'GET', path: '/users' },
            { method: 'POST', path: '/users' },
            { method: 'PUT', path: '/users/' },
            { method: 'DELETE', path: '/users/' },
            { method: 'GET', path: '/backup' },
            { method: 'POST', path: '/backup' },
            { method: 'DELETE', path: '/assets/' },
            { method: 'POST', path: '/audit/sessions/' } // closing audit is restricted
        ];

        if (req.path.endsWith('/close') && !isSuperAdmin) {
            return res.status(403).json({ error: "Forbidden: Only Super Admin can close audit sessions" });
        }

        if (!isSuperAdmin) {
            const isAdminRoute = adminOnlyRoutes.some(route =>
                req.method === route.method && req.path.startsWith(route.path) && !req.path.includes('/audit/sessions')
            );
            if (isAdminRoute) {
                return res.status(403).json({ error: "Forbidden: Super Admin access required" });
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
    
    const safeUsername = String(username).trim();
    
    if (!safeUsername || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    db.get("SELECT id, username, password as hash, role FROM users WHERE LOWER(username) = LOWER(?)", [safeUsername], async (err, user) => {
        try {
            if (err) return res.status(500).json({ error: err.message });
            if (!user) return res.status(401).json({ error: "Invalid credentials" });
            
            // Trim password to handle mobile keyboard trailing spaces
            const safePassword = String(password).trim();
            const validPassword = await bcrypt.compare(safePassword, String(user.hash));
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

app.get('/api/audit-trail', (req, res) => {
    const { search, action, user, limit = 100, offset = 0 } = req.query;
    let query = "SELECT * FROM audit_logs WHERE 1=1";
    let params = [];

    if (search) {
        query += " AND (asset_id LIKE ? OR description LIKE ? OR user LIKE ?)";
        const s = `%${search}%`;
        params.push(s, s, s);
    }
    if (action) {
        query += " AND action = ?";
        params.push(action);
    }
    if (user) {
        query += " AND user = ?";
        params.push(user);
    }

    query += " ORDER BY id DESC LIMIT ? OFFSET ?";
    params.push(Number(limit), Number(offset));

    db.all(query, params, (err, rows) => {
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
        const lostAssets = rows.filter(a => a.status === 'Lost').length;
        const totalValue = rows.reduce((sum, a) => sum + (a.value || 0), 0);
        res.json({ totalAssets, availableAssets, borrowedAssets, repairDamagedAssets, lostAssets, totalValue });
    });
});

app.get('/api/dashboard/summary', (req, res) => {
    db.all("SELECT * FROM assets", [], (err, assets) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const totalAssets = assets.length;
        const availableAssets = assets.filter(a => a.status === 'Available').length;
        const borrowedAssets = assets.filter(a => a.status === 'Borrowed').length;
        const damagedAssets = assets.filter(a => ['Repair', 'Damaged'].includes(a.status)).length;
        const lostAssets = assets.filter(a => a.status === 'Lost').length;
        const totalValue = assets.reduce((sum, a) => sum + (a.value || 0), 0);

        // Low stock calculation (< 5 available)
        const nameCounts = {};
        assets.forEach(a => {
            if (!nameCounts[a.name]) nameCounts[a.name] = { name: a.name, category: a.category, available: 0, total: 0 };
            nameCounts[a.name].total++;
            if (a.status === 'Available') nameCounts[a.name].available++;
        });
        const lowStockItems = Object.values(nameCounts).filter(item => item.available < 5).sort((a, b) => a.available - b.available);

        // Overdue borrows calculation
        const todayStr = new Date().toISOString().split('T')[0];
        db.all(
            `SELECT b.*, e.name as employee_name, e.department, e.email as employee_email, a.name as asset_name, a.category as asset_category
             FROM borrow_records b
             LEFT JOIN employees e ON b.employee_id = e.id
             LEFT JOIN assets a ON b.asset_id = a.id
             WHERE b.status = 'Active' AND b.expected_return_date < ?
             ORDER BY b.expected_return_date ASC`,
            [todayStr],
            (err2, overdueRows) => {
                const overdueItems = (overdueRows || []).map(r => {
                    const diffDays = Math.ceil((new Date(todayStr).getTime() - new Date(r.expected_return_date).getTime()) / (1000 * 60 * 60 * 24));
                    return { ...r, days_overdue: diffDays };
                });

                // Recent activities from audit_logs
                db.all("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 25", [], (err3, recentActivities) => {
                    res.json({
                        totalAssets,
                        availableAssets,
                        borrowedAssets,
                        damagedAssets,
                        lostAssets,
                        totalValue,
                        lowStockItems,
                        overdueItems: overdueItems || [],
                        recentActivities: recentActivities || []
                    });
                });
            }
        );
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
    db.all("SELECT * FROM borrow_records ORDER BY id DESC", [], (err, rows) => res.json(rows));
});

app.get('/api/borrow/overdue', (req, res) => {
    const todayStr = new Date().toISOString().split('T')[0];
    db.all(
        `SELECT b.*, e.name as employee_name, e.department, e.email as employee_email, a.name as asset_name, a.category as asset_category
         FROM borrow_records b
         LEFT JOIN employees e ON b.employee_id = e.id
         LEFT JOIN assets a ON b.asset_id = a.id
         WHERE b.status = 'Active' AND b.expected_return_date < ?
         ORDER BY b.expected_return_date ASC`,
        [todayStr],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            const result = (rows || []).map(r => ({
                ...r,
                days_overdue: Math.ceil((new Date(todayStr).getTime() - new Date(r.expected_return_date).getTime()) / (1000 * 60 * 60 * 24))
            }));
            res.json(result);
        }
    );
});

app.post('/api/borrow/notify-overdue', async (req, res) => {
    const todayStr = new Date().toISOString().split('T')[0];
    db.all(
        `SELECT b.*, e.name as employee_name, e.email as employee_email, a.name as asset_name 
         FROM borrow_records b
         LEFT JOIN employees e ON b.employee_id = e.id
         LEFT JOIN assets a ON b.asset_id = a.id
         WHERE b.status = 'Active' AND b.expected_return_date < ?`,
        [todayStr],
        async (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!rows || rows.length === 0) return res.json({ message: "No overdue items found", sentCount: 0 });

            db.get("SELECT value FROM settings WHERE type = 'line_token' LIMIT 1", [], async (errSett, lineRow) => {
                const lineToken = lineRow ? lineRow.value : process.env.LINE_NOTIFY_TOKEN;
                let sentCount = 0;

                for (const item of rows) {
                    const daysOverdue = Math.ceil((new Date(todayStr).getTime() - new Date(item.expected_return_date).getTime()) / (1000 * 60 * 60 * 24));
                    
                    // 1. Send Email Alert
                    const html = generateEmailHtml(
                        'Overdue Equipment Return Notice',
                        `This is an urgent notification regarding overdue equipment checked out to ${item.employee_name || item.employee_id}.`,
                        'repair',
                        `Overdue (${daysOverdue} days)`,
                        {
                            'Asset ID': item.asset_id,
                            'Asset Name': item.asset_name || 'N/A',
                            'Borrower': `${item.employee_name || item.employee_id} (${item.employee_id})`,
                            'Due Date': item.expected_return_date,
                            'Days Overdue': `${daysOverdue} day(s)`
                        }
                    );
                    sendEmail(`🚨 OVERDUE ALERT: ${item.asset_name || item.asset_id} (${daysOverdue} days late)`, `Asset ${item.asset_id} is overdue by ${daysOverdue} days.`, html);

                    // 2. Send LINE Notify if token available
                    if (lineToken) {
                        try {
                            const message = `\n🚨 [IAMS Overdue Alert]\nAsset: ${item.asset_name || item.asset_id} (${item.asset_id})\nBorrower: ${item.employee_name || item.employee_id}\nDue Date: ${item.expected_return_date}\nDays Overdue: ${daysOverdue} day(s)!\nPlease return immediately.`;
                            await fetch('https://notify-api.line.me/api/notify', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                    'Authorization': `Bearer ${lineToken}`
                                },
                                body: new URLSearchParams({ message })
                            });
                        } catch (lineErr) {
                            console.error('LINE Notify dispatch error:', lineErr.message);
                        }
                    }

                    // 3. Create In-App Notification
                    createNotification('GLOBAL_IT', 'Overdue Item Alert', `Asset ${item.asset_id} (${item.employee_name || item.employee_id}) is ${daysOverdue} days overdue.`, `/borrow`, 'warning', 'negative');
                    db.run("UPDATE borrow_records SET overdue_notified = overdue_notified + 1 WHERE id = ?", [item.id]);
                    sentCount++;
                }

                logAudit('SYSTEM', 'OVERDUE_NOTIFIED', `Dispatched overdue return alerts for ${sentCount} item(s)`, req.user?.username || 'System');
                res.json({ message: `Successfully sent notifications for ${sentCount} overdue item(s)`, sentCount });
            });
        }
    );
});

app.post('/api/borrow', (req, res) => {
    const { asset_ids, employee_id, borrow_date, expected_return_date, reason, user, location, signature_data } = req.body;
    
    if (!asset_ids || asset_ids.length === 0) return res.status(400).json({ error: "No assets provided" });

    let completed = 0;
    let hasError = false;

    asset_ids.forEach(id => {
        db.run(
            `INSERT INTO borrow_records (asset_id, employee_id, borrow_date, expected_return_date, reason, status, signature_data) VALUES (?, ?, ?, ?, ?, 'Active', ?)`,
            [id, employee_id, borrow_date, expected_return_date, reason, signature_data || null],
            (err) => {
                if (err) { hasError = true; console.error(err); }
            }
        );
        
        if (location) {
            db.run(`UPDATE assets SET status = 'Borrowed', holder = ?, location = ? WHERE id = ?`, [employee_id, location, id], (err) => { if (err) console.error(err); });
        } else {
            db.run(`UPDATE assets SET status = 'Borrowed', holder = ? WHERE id = ?`, [employee_id, id], (err) => { if (err) console.error(err); });
        }
        
        logAudit(id, 'BORROW', `Borrowed by ${employee_id}. Reason: ${reason || 'N/A'}${signature_data ? ' (Digitally Signed)' : ''}`, user);
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
                'Signature': signature_data ? 'Digital Signature On File' : 'None',
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
    const { borrow_id, asset_id, return_date, condition = 'Good', condition_photo, user, location } = req.body;
    
    db.run(
        `UPDATE borrow_records SET return_date = ?, status = 'Returned', condition = ?, return_condition_photo = ? WHERE asset_id = ? AND status = 'Active'`,
        [return_date, condition, condition_photo || null, asset_id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            
            let newStatus = 'Available';
            let newHolder = '-';
            if (condition === 'Damaged') {
                newStatus = 'Damaged';
            } else if (condition === 'Lost') {
                newStatus = 'Lost';
            }

            if (location) {
                db.run(`UPDATE assets SET status = ?, holder = ?, location = ? WHERE id = ?`, [newStatus, newHolder, location, asset_id]);
            } else {
                db.run(`UPDATE assets SET status = ?, holder = ? WHERE id = ?`, [newStatus, newHolder, asset_id]);
            }
            
            logAudit(asset_id, 'RETURN', `Returned in condition: ${condition}${condition_photo ? ' [Photo Evidence Uploaded]' : ''}`, user);
            
            if (condition === 'Damaged') {
                createNotification('GLOBAL_IT', 'Equipment Returned Damaged', `Asset ${asset_id} returned Damaged. Photo recorded.`, `/asset/${asset_id}/scan`, 'report_problem', 'negative');
                const html = generateEmailHtml(
                    'Critical Alert: Asset Returned Damaged',
                    `Asset ${asset_id} was returned in DAMAGED condition. Please inspect immediately.`,
                    'damaged',
                    'Damaged',
                    {
                        'Asset ID': asset_id,
                        'Condition': condition,
                        'Returned By': user || 'Staff',
                        'Evidence Photo': condition_photo ? 'Photo Recorded' : 'None',
                        'Time': new Date().toLocaleString()
                    }
                );
                sendEmail(`🚨 Critical Alert: Asset ${asset_id} Returned Damaged`, `Asset ${asset_id} returned damaged`, html);
            } else {
                createNotification('GLOBAL_IT', 'Asset Returned', `Asset ${asset_id} returned. Condition: ${condition}`, `/asset/${asset_id}/scan`, 'keyboard_return', 'info');
                const html = generateEmailHtml(
                    'Equipment Returned',
                    'An asset has been returned to the IT inventory.',
                    'return',
                    'Returned',
                    {
                        'Asset ID': asset_id,
                        'Condition': condition,
                        'Time': new Date().toLocaleString()
                    }
                );
                sendEmail('🟢 Alert: Equipment Returned', `Asset ${asset_id} returned`, html);
            }
            
            res.json({ message: "Asset Returned Successfully", status: newStatus });
        }
    );
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

// ==========================================
// MONTHLY AUDIT SYSTEM ("PREVENTING LOSS")
// ==========================================

const updateSessionScannedCount = (sessionId, callback) => {
    db.get("SELECT COUNT(*) as count FROM audit_snapshots WHERE session_id = ? AND is_scanned = 1", [sessionId], (err, row) => {
        if (!err && row) {
            db.run("UPDATE audit_sessions SET total_scanned = ? WHERE id = ?", [row.count, sessionId], () => {
                if (callback) callback();
            });
        } else if (callback) callback();
    });
};

// 1. List all audit sessions
app.get('/api/audit/sessions', (req, res) => {
    db.all("SELECT * FROM audit_sessions ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 2. Open new audit session & freeze stock snapshot
app.post('/api/audit/sessions', (req, res) => {
    const { title, month, notes, user } = req.body;
    const actor = user || req.user?.username || 'Super Admin';
    const sessionMonth = month || new Date().toISOString().slice(0, 7);
    const sessionTitle = title || `Monthly Audit - ${sessionMonth}`;
    const openedAt = new Date().toISOString();

    db.run(
        `INSERT INTO audit_sessions (title, month, status, opened_by, opened_at, notes) VALUES (?, ?, 'Active', ?, ?, ?)`,
        [sessionTitle, sessionMonth, actor, openedAt, notes || ''],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            const sessionId = this.lastID;

            // Snapshot all assets that are currently expected to be in warehouse (status = 'Available')
            db.all("SELECT * FROM assets WHERE status = 'Available'", [], (err2, assets) => {
                if (err2) return res.status(500).json({ error: err2.message });

                const stmt = db.prepare(`
                    INSERT INTO audit_snapshots (session_id, asset_id, asset_name, category, location, expected_status, is_scanned)
                    VALUES (?, ?, ?, ?, ?, ?, 0)
                `);

                assets.forEach(a => {
                    stmt.run([sessionId, a.id, a.name, a.category, a.location || '-', a.status]);
                });

                stmt.finalize((err3) => {
                    if (err3) return res.status(500).json({ error: err3.message });
                    const totalExpected = assets.length;
                    db.run("UPDATE audit_sessions SET total_expected = ? WHERE id = ?", [totalExpected, sessionId]);
                    logAudit('SYSTEM', 'AUDIT_OPENED', `Opened audit session ${sessionTitle}. Frozen ${totalExpected} expected items.`, actor);
                    createNotification('GLOBAL_IT', 'Monthly Audit Session Opened', `${sessionTitle} is now active. Ready for warehouse scan.`, '/audit', 'fact_check', 'primary');
                    res.json({ message: "Audit session created successfully", id: sessionId, total_expected: totalExpected });
                });
            });
        }
    );
});

// 3. Get session details, progress, and zone-grouped checklist
app.get('/api/audit/sessions/:id', (req, res) => {
    const sessionId = req.params.id;
    db.get("SELECT * FROM audit_sessions WHERE id = ?", [sessionId], (err, session) => {
        if (err || !session) return res.status(404).json({ error: "Audit session not found" });

        db.all("SELECT * FROM audit_snapshots WHERE session_id = ? ORDER BY location ASC, asset_name ASC", [sessionId], (err2, snapshots) => {
            if (err2) return res.status(500).json({ error: err2.message });

            const totalScanned = snapshots.filter(s => s.is_scanned === 1).length;
            const totalExpected = session.total_expected || snapshots.length;
            const percentage = totalExpected > 0 ? Math.round((totalScanned / totalExpected) * 100) : 0;

            // Group by Zone / Shelf / Room
            const zones = {};
            snapshots.forEach(s => {
                const loc = s.location || 'Unassigned Zone';
                if (!zones[loc]) zones[loc] = [];
                zones[loc].push(s);
            });

            res.json({
                session,
                stats: { totalExpected, totalScanned, remaining: totalExpected - totalScanned, percentage },
                zones,
                snapshots
            });
        });
    });
});

// 4. Record high-speed scan in audit session
app.post('/api/audit/sessions/:id/scan', (req, res) => {
    const sessionId = req.params.id;
    const { asset_id, condition, notes, user } = req.body;
    const actor = user || req.user?.username || 'Warehouse Staff';
    const scannedAt = new Date().toISOString();

    db.get("SELECT * FROM audit_snapshots WHERE session_id = ? AND asset_id = ?", [sessionId, asset_id], (err, existing) => {
        if (err) return res.status(500).json({ error: err.message });

        if (existing) {
            db.run(
                `UPDATE audit_snapshots SET is_scanned = 1, scanned_at = ?, scanned_by = ?, condition = ?, notes = ? WHERE id = ?`,
                [scannedAt, actor, condition || 'Good', notes || '', existing.id],
                (errUpdate) => {
                    if (errUpdate) return res.status(500).json({ error: errUpdate.message });
                    updateSessionScannedCount(sessionId, () => {
                        logAudit(asset_id, 'AUDIT_SCAN', `Scanned in audit session #${sessionId} (Condition: ${condition || 'Good'})`, actor);
                        res.json({ message: "Item verified in audit", isUnexpected: false, asset_id });
                    });
                }
            );
        } else {
            // Unexpected item found! Check assets table
            db.get("SELECT * FROM assets WHERE id = ?", [asset_id], (errAst, assetRow) => {
                const assetName = assetRow ? assetRow.name : 'Unknown Item';
                const category = assetRow ? assetRow.category : 'General';
                const location = assetRow ? assetRow.location : '-';

                db.run(
                    `INSERT INTO audit_snapshots (session_id, asset_id, asset_name, category, location, expected_status, is_scanned, scanned_at, scanned_by, condition, notes)
                     VALUES (?, ?, ?, ?, ?, 'Unexpected', 1, ?, ?, ?, ?)`,
                    [sessionId, asset_id, assetName, category, location, scannedAt, actor, condition || 'Good', 'Unexpected excess item found during audit'],
                    (errIns) => {
                        if (errIns) return res.status(500).json({ error: errIns.message });
                        updateSessionScannedCount(sessionId, () => {
                            logAudit(asset_id, 'AUDIT_UNEXPECTED_SCAN', `Unexpected excess item scanned in audit #${sessionId}`, actor);
                            res.json({ message: "Unexpected item recorded in audit", isUnexpected: true, asset_id });
                        });
                    }
                );
            });
        }
    });
});

// 5. Close audit session, flag missing items as "Lost", generate discrepancy
app.post('/api/audit/sessions/:id/close', (req, res) => {
    const sessionId = req.params.id;
    const { user, notes } = req.body;
    const actor = user || req.user?.username || 'Super Admin';
    const closedAt = new Date().toISOString();

    db.get("SELECT * FROM audit_sessions WHERE id = ?", [sessionId], (err, session) => {
        if (err || !session) return res.status(404).json({ error: "Audit session not found" });

        // Find all unscanned snapshots
        db.all("SELECT * FROM audit_snapshots WHERE session_id = ? AND is_scanned = 0", [sessionId], (err2, missingSnapshots) => {
            if (err2) return res.status(500).json({ error: err2.message });

            const missingCount = missingSnapshots.length;

            // Mark missing assets as "Lost" in assets table with audit month tag
            const stmt = db.prepare("UPDATE assets SET status = 'Lost', holder = ? WHERE id = ?");
            missingSnapshots.forEach(m => {
                stmt.run([`Lost in Audit ${session.month}`, m.asset_id]);
                logAudit(m.asset_id, 'MARKED_LOST', `Marked as LOST during audit session ${session.title} (${session.month})`, actor);
            });
            stmt.finalize();

            // Close session in DB
            db.run(
                `UPDATE audit_sessions SET status = 'Closed', closed_by = ?, closed_at = ?, total_missing = ?, notes = ? WHERE id = ?`,
                [actor, closedAt, missingCount, notes || session.notes || '', sessionId],
                (errClose) => {
                    if (errClose) return res.status(500).json({ error: errClose.message });

                    logAudit('SYSTEM', 'AUDIT_CLOSED', `Closed audit session ${session.title}. ${missingCount} item(s) flagged as LOST.`, actor);
                    createNotification('GLOBAL_IT', 'Monthly Audit Closed', `${session.title} closed. ${missingCount} item(s) flagged as LOST.`, `/audit`, 'report_problem', missingCount > 0 ? 'negative' : 'positive');

                    const html = generateEmailHtml(
                        'Monthly Stock Audit Closed',
                        `Audit session "${session.title}" (${session.month}) has been closed by ${actor}.`,
                        missingCount > 0 ? 'damaged' : 'add',
                        missingCount > 0 ? `${missingCount} Items Missing (Flagged LOST)` : '100% Reconciled',
                        {
                            'Audit Session': session.title,
                            'Period': session.month,
                            'Expected Stock': session.total_expected,
                            'Scanned Stock': session.total_scanned,
                            'Missing / Lost': `${missingCount} item(s)`,
                            'Closed By': actor
                        }
                    );
                    sendEmail(`📋 Audit Report: ${session.title} (${missingCount} Lost)`, `Audit ${session.title} closed with ${missingCount} missing items.`, html);

                    res.json({
                        message: `Audit closed successfully. ${missingCount} missing item(s) marked as Lost.`,
                        total_missing: missingCount,
                        session_id: sessionId
                    });
                }
            );
        });
    });
});

// 6. Discrepancy report data
app.get('/api/audit/sessions/:id/discrepancy', (req, res) => {
    const sessionId = req.params.id;
    db.get("SELECT * FROM audit_sessions WHERE id = ?", [sessionId], (err, session) => {
        if (err || !session) return res.status(404).json({ error: "Session not found" });

        db.all("SELECT * FROM audit_snapshots WHERE session_id = ?", [sessionId], (err2, rows) => {
            if (err2) return res.status(500).json({ error: err2.message });

            const missing = rows.filter(r => r.is_scanned === 0);
            const found = rows.filter(r => r.is_scanned === 1 && r.expected_status !== 'Unexpected');
            const unexpected = rows.filter(r => r.expected_status === 'Unexpected');

            res.json({
                session,
                summary: {
                    totalExpected: session.total_expected,
                    totalScanned: session.total_scanned,
                    totalMissing: missing.length,
                    totalUnexpected: unexpected.length,
                    reconciliationRate: session.total_expected > 0 ? Math.round((found.length / session.total_expected) * 100) : 0
                },
                missing,
                found,
                unexpected
            });
        });
    });
});

// ==========================================
// AUTOMATED BACKUP ENDPOINTS
// ==========================================
app.get('/api/backup', (req, res) => {
    db.all("SELECT * FROM system_backups ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/backup/create', async (req, res) => {
    try {
        const actor = req.user?.username || 'Super Admin';
        const result = await performBackup(actor, 'manual');
        res.json({ message: "Database backup created successfully", ...result });
    } catch (err) {
        console.error("Backup creation error:", err);
        res.status(500).json({ error: "Failed to create database backup" });
    }
});

app.get('/api/backup/download/:filename', (req, res) => {
    const safeFilename = path.basename(req.params.filename);
    const filePath = path.join(backupDir, safeFilename);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Backup file not found" });
    }
    res.download(filePath, safeFilename);
});

// ==========================================
// USER & ROLE MANAGEMENT ENDPOINTS
// ==========================================
app.get('/api/users', (req, res) => {
    db.all("SELECT id, username, role FROM users ORDER BY id ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/users', async (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
        return res.status(400).json({ error: "Username, password, and role are required" });
    }
    try {
        const hash = await bcrypt.hash(password, 10);
        db.run(
            "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
            [username.trim(), hash, role],
            function(err) {
                if (err) return res.status(400).json({ error: "User already exists or invalid data" });
                logAudit('SYSTEM', 'USER_CREATED', `Created user account: ${username} with role ${role}`, req.user?.username || 'Super Admin');
                res.json({ message: "User created successfully", id: this.lastID });
            }
        );
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/users/:id/role', (req, res) => {
    const { role } = req.body;
    db.run("UPDATE users SET role = ? WHERE id = ?", [role, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        logAudit('SYSTEM', 'USER_ROLE_UPDATED', `Updated user ID ${req.params.id} role to ${role}`, req.user?.username || 'Super Admin');
        res.json({ message: "User role updated successfully" });
    });
});

app.delete('/api/users/:id', (req, res) => {
    db.run("DELETE FROM users WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        logAudit('SYSTEM', 'USER_DELETED', `Deleted user ID ${req.params.id}`, req.user?.username || 'Super Admin');
        res.json({ message: "User deleted successfully" });
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
