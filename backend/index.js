require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

const app = express();

// 0. AUTO-CREATE UPLOADS DIRECTORY
// Moved to an absolute path logic to prevent issues in different environments
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 1. SECURITY MIDDLEWARE 
app.use(helmet({
    contentSecurityPolicy: false, // Set to false if you're serving a frontend from the same domain
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false
}));

// 2. CORS & PARSING
const allowedOrigins = [
    'http://localhost:3000', 
    process.env.FRONTEND_URL 
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'], 
    credentials: true
}));

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: '10mb' })); // Increased limit for larger profile pics/posts
app.use(express.urlencoded({ extended: true }));

// STATIC FOLDER FOR UPLOADS
app.use('/uploads', express.static(uploadDir));

// 3. RATE LIMITING
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200, 
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { status: 429, msg: "Too many requests, please try again later." }
});
app.use('/api/', limiter);

// 4. HEALTH CHECK
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: "UP", 
        message: "LinkedIn Clone Server is running",
        timestamp: new Date().toISOString()
    });
});

// 5. ROUTE IMPORTS
// Wrapping in try-catch or ensuring these exist is key
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));
app.use('/api/profiles', require('./routes/profiles'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/connections', require('./routes/connections')); 
app.use('/api/projects', require('./routes/projects'));

// 6. GLOBAL ERROR HANDLER
// Always place this AFTER routes
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    console.error(`🔥 SYSTEM ERROR [${new Date().toLocaleString()}]:`, err.stack);
    
    res.status(statusCode).json({
        success: false,
        message: err.message || "An internal server error occurred",
        // Only show stack trace in development mode
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

// 7. START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 SERVER RUNNING ON PORT: ${PORT}`);
    console.log(`👉 Health Check: http://localhost:${PORT}/health`);
});
