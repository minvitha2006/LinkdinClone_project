const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');

/**
 * UTILITY: Activity Logger
 * Since you use this in multiple routes, let's define it once.
 */
const logActivity = async (userId, action, req) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await db.query(
        'INSERT INTO activity_logs (user_id, action, ip_address) VALUES ($1, $2, $3)', 
        [userId, action, ip]
    );
};

// 1. GLOBAL SEARCH (Find people by Name or Skill)
// Fixed: Using profiles table to match your LinkedIn setup
router.get('/search', auth, async (req, res) => {
    const { query } = req.query; 
    try {
        const results = await db.query(
            `SELECT user_id, full_name, headline, location, profile_picture_url 
             FROM profiles 
             WHERE full_name ILIKE $1 
             OR headline ILIKE $1 
             LIMIT 20`,
            [`%${query}%`]
        );
        res.json(results.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Search Error');
    }
});

// 2. SEND A MESSAGE
router.post('/message', auth, async (req, res) => {
    const { receiver_id, message_text } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO messages (sender_id, receiver_id, message_text) VALUES ($1, $2, $3) RETURNING *',
            [req.user.id, receiver_id, message_text]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Could not send message" });
    }
});

// 3. GET CONVERSATION (Chat History)
router.get('/messages/:otherUserId', auth, async (req, res) => {
    try {
        const chat = await db.query(
            `SELECT * FROM messages 
             WHERE (sender_id = $1 AND receiver_id = $2) 
             OR (sender_id = $2 AND receiver_id = $1) 
             ORDER BY created_at ASC`,
            [req.user.id, req.params.otherUserId]
        );
        res.json(chat.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Could not load chat" });
    }
});

// 4. GET MESSAGE INBOX (List of people you have chatted with)
router.get('/inbox', auth, async (req, res) => {
    try {
        const inbox = await db.query(
            `SELECT DISTINCT ON (profiles.user_id) 
                profiles.user_id, profiles.full_name, profiles.profile_picture_url, messages.message_text, messages.created_at
             FROM messages
             JOIN profiles ON (messages.sender_id = profiles.user_id OR messages.receiver_id = profiles.user_id)
             WHERE (messages.sender_id = $1 OR messages.receiver_id = $1) AND profiles.user_id != $1
             ORDER BY profiles.user_id, messages.created_at DESC`,
            [req.user.id]
        );
        res.json(inbox.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Inbox Error');
    }
});


module.exports = router;