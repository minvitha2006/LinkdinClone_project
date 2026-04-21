require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

const app = express();

// 0. AUTO-CREATE UPLOADS DIRECTORY
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 1. SECURITY MIDDLEWARE 
app.use(helmet({
    contentSecurityPolicy: false, 
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false
}));

// 2. CORS & PARSING
// UPDATED: Now allows your local dev AND your future live website URL
const allowedOrigins = [
    'http://localhost:3000', 
    process.env.FRONTEND_URL // You will set this in Render later
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'], 
    credentials: true
}));

app.use(express.json());

// STATIC FOLDER FOR UPLOADS
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. RATE LIMITING
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200, 
    message: { status: 429, msg: "Too many requests, please try again later." }
});
app.use('/api/', limiter);

// 4. HEALTH CHECK
app.get('/health', (req, res) => {
    res.status(200).json({ status: "UP", message: "LinkedIn Clone Server is running" });
});

// 5. ROUTE IMPORTS
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));
app.use('/api/profiles', require('./routes/profiles'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/connections', require('./routes/connections')); 
app.use('/api/projects', require('./routes/projects'));

// 6. GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
    console.error("🔥 SYSTEM ERROR:", err.stack);
    res.status(500).json({
        success: false,
        message: "An internal server error occurred"
    });
});

// 7. START SERVER
// UPDATED: Uses process.env.PORT for Render/Railway deployment
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 SERVER RUNNING ON PORT: ${PORT}`);
});