const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const nodemailer = require('nodemailer');

// --- 1. AUTH MIDDLEWARE ---
const auth = (req, res, next) => {
    const token = req.header('x-auth-token') || req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// --- 2. NODEMAILER CONFIG ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// --- DELETE ACCOUNT ROUTE ---
router.delete('/delete-account', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        await db.query('BEGIN');
        
        await db.query('DELETE FROM posts WHERE user_id = $1', [userId]);
        await db.query('DELETE FROM profiles WHERE user_id = $1', [userId]);
        const result = await db.query('DELETE FROM users WHERE user_id = $1', [userId]);

        if (result.rowCount === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ msg: "User not found" });
        }

        await db.query('COMMIT');
        res.json({ success: true, msg: "Account deleted successfully" });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error("DELETE ACCOUNT ERROR:", err);
        res.status(500).json({ msg: "Server Error during account deletion" });
    }
});

// --- REGISTER ROUTE ---
router.post('/register', async (req, res) => {
    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
        return res.status(400).json({ msg: "Please enter all fields" });
    }

    if (password.length < 6) {
        return res.status(400).json({ msg: "Password must be at least 6 characters" });
    }

    const cleanEmail = email.toLowerCase().trim(); 
    try {
        const existingUser = await db.query("SELECT * FROM users WHERE email = $1", [cleanEmail]);
        if (existingUser.rows.length > 0) return res.status(400).json({ msg: "An account with this email already exists." });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        await db.query(
            `INSERT INTO unverified_users (email, password_hash, full_name, verification_code) 
             VALUES ($1, $2, $3, $4) 
             ON CONFLICT (email) DO UPDATE SET verification_code = $4, password_hash = $2, full_name = $3`,
            [cleanEmail, password_hash, full_name, otp]
        );

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: cleanEmail,
            subject: 'Verify your LinkedIn Clone Account',
            text: `Hello ${full_name}, your verification code is: ${otp}`
        });
        res.json({ msg: "OTP sent to email" });
    } catch (err) {
        console.error("REGISTER ERROR:", err);
        res.status(500).json({ msg: "Server Error during registration" });
    }
});

// --- RESEND OTP ROUTE ---
router.post('/resend-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: "Email is required" });

    const cleanEmail = email.toLowerCase().trim();
    try {
        const user = await db.query("SELECT * FROM unverified_users WHERE email = $1", [cleanEmail]);
        if (user.rows.length === 0) return res.status(400).json({ msg: "No pending registration found." });

        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        await db.query("UPDATE unverified_users SET verification_code = $1 WHERE email = $2", [newOtp, cleanEmail]);

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: cleanEmail,
            subject: 'Your New Verification Code',
            text: `Your new verification code is: ${newOtp}`
        });

        res.json({ msg: "A new OTP has been sent to your email." });
    } catch (err) {
        console.error("RESEND ERROR:", err);
        res.status(500).json({ msg: "Failed to resend OTP" });
    }
});

// --- VERIFY OTP ROUTE ---
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ msg: "Missing email or OTP" });

    const cleanEmail = email.toLowerCase().trim();
    try {
        const result = await db.query("SELECT * FROM unverified_users WHERE email = $1 AND verification_code = $2", [cleanEmail, otp]);
        if (result.rows.length === 0) return res.status(400).json({ msg: "Invalid or expired OTP" });

        const user = result.rows[0];
        await db.query('BEGIN');
        const newUser = await db.query("INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING user_id", [user.email, user.password_hash, user.full_name]);
        const newUserId = newUser.rows[0].user_id;
        await db.query("INSERT INTO profiles (user_id, full_name, profile_pic) VALUES ($1, $2, NULL)", [newUserId, user.full_name]);
        await db.query("DELETE FROM unverified_users WHERE email = $1", [cleanEmail]);
        await db.query('COMMIT');

        res.json({ msg: "Account verified! You can now login." });
    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ msg: "Verification failed" });
    }
});

// --- LOGIN ROUTE ---
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ msg: "Please enter all fields" });

    const cleanEmail = email.toLowerCase().trim();
    try {
        const result = await db.query(`
            SELECT u.user_id, u.email, u.password_hash, u.full_name, p.profile_pic 
            FROM users u 
            LEFT JOIN profiles p ON u.user_id = p.user_id 
            WHERE u.email = $1`, [cleanEmail]);

        if (result.rows.length === 0) return res.status(400).json({ msg: "Invalid Credentials" });

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ msg: "Invalid Credentials" });

        const payload = { user: { id: user.user_id } };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ 
                token, 
                user: { 
                    id: user.user_id, 
                    email: user.email, 
                    full_name: user.full_name, 
                    profile_pic: user.profile_pic 
                } 
            });
        });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ msg: "Server Error" }); 
    }
});

// --- FORGOT & RESET PASSWORD ---
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    const cleanEmail = email.toLowerCase().trim();
    try {
        const userCheck = await db.query('SELECT full_name FROM users WHERE email = $1', [cleanEmail]);
        if (userCheck.rows.length === 0) return res.status(404).json({ msg: "Email not found" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await db.query(`INSERT INTO unverified_users (email, verification_code, full_name, password_hash) 
             VALUES ($1, $2, $3, 'RESET_IN_PROGRESS') ON CONFLICT (email) DO UPDATE SET verification_code = $2`, 
            [cleanEmail, otp, userCheck.rows[0].full_name]);

        await transporter.sendMail({ from: process.env.EMAIL_USER, to: cleanEmail, subject: 'Reset Code', text: `Code: ${otp}` });
        res.json({ msg: "OTP sent" });
    } catch (err) { res.status(500).json({ msg: "Error" }); }
});

router.post('/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;

    // --- ADDED VALIDATION CHECK HERE ---
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ msg: "New password must be at least 6 characters" });
    }

    try {
        const result = await db.query("SELECT * FROM unverified_users WHERE email = $1 AND verification_code = $2", [email.toLowerCase(), otp]);
        if (result.rows.length === 0) return res.status(400).json({ msg: "Invalid OTP" });

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);
        await db.query('BEGIN');
        await db.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, email.toLowerCase()]);
        await db.query('DELETE FROM unverified_users WHERE email = $1', [email.toLowerCase()]);
        await db.query('COMMIT');
        res.json({ msg: "Success" });
    } catch (err) { 
        await db.query('ROLLBACK'); 
        res.status(500).json({ msg: "Failed" }); 
    }
});

module.exports = router;