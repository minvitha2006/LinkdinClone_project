const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// 1. GET SUGGESTIONS (People to connect with)
router.get('/suggestions', auth, async (req, res) => {
    try {
        const myId = req.user.id;
        
        // This query finds everyone except YOU who isn't already connected
        const query = `
            SELECT u.user_id, u.full_name, COALESCE(p.headline, 'Engineering Student') as headline
            FROM users u
            LEFT JOIN profiles p ON u.user_id = p.user_id
            WHERE u.user_id != $1
            AND u.user_id NOT IN (
                SELECT receiver_id FROM connections WHERE sender_id = $1
                UNION
                SELECT sender_id FROM connections WHERE receiver_id = $1
            )
        `;
        const result = await db.query(query, [myId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. SEND CONNECTION REQUEST
router.post('/send/:receiverId', auth, async (req, res) => {
    try {
        await db.query(
            "INSERT INTO connections (sender_id, receiver_id, status) VALUES ($1, $2, 'pending')",
            [req.user.id, req.params.receiverId]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: "Request already exists or failed" });
    }
});

// 3. GET PENDING REQUESTS (For the person receiving the invitation)
router.get('/pending', auth, async (req, res) => {
    try {
        const myId = req.user.id;

        // Fetch people who sent YOU a request that is still 'pending'
        const query = `
            SELECT 
                c.id as connection_id, 
                u.user_id as sender_id, 
                u.full_name, 
                COALESCE(p.headline, 'New Member') as headline
            FROM connections c
            JOIN users u ON c.sender_id = u.user_id
            LEFT JOIN profiles p ON u.user_id = p.user_id
            WHERE c.receiver_id = $1 AND c.status = 'pending'
        `;

        const result = await db.query(query, [myId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch invitations" });
    }
});

// 4. ACCEPT A REQUEST
router.put('/accept/:connectionId', auth, async (req, res) => {
    try {
        const { connectionId } = req.params;
        
        // Update the status to 'accepted'
        await db.query(
            "UPDATE connections SET status = 'accepted' WHERE id = $1",
            [connectionId]
        );
        res.json({ success: true, message: "Connection accepted!" });
    } catch (err) {
        res.status(500).json({ error: "Failed to accept connection" });
    }
});
// GET MY ACCEPTED CONNECTIONS
router.get('/my-network', auth, async (req, res) => {
    try {
        const myId = req.user.id;

        // This query finds people where the status is 'accepted'
        // It checks both sender_id and receiver_id because a connection is two-way
        const query = `
            SELECT 
                u.user_id, 
                u.full_name, 
                COALESCE(p.headline, 'Professional Connection') as headline
            FROM connections c
            JOIN users u ON (c.sender_id = u.user_id OR c.receiver_id = u.user_id)
            LEFT JOIN profiles p ON u.user_id = p.user_id
            WHERE (c.sender_id = $1 OR c.receiver_id = $1) 
            AND c.status = 'accepted'
            AND u.user_id != $1
        `;

        const result = await db.query(query, [myId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch network" });
    }
});
// REMOVE CONNECTION (Unfollow)
router.delete('/remove/:userId', auth, async (req, res) => {
    try {
        const myId = req.user.id;
        const targetId = req.params.userId;

        // Delete the connection where either I sent it or they sent it
        const query = `
            DELETE FROM connections 
            WHERE (sender_id = $1 AND receiver_id = $2) 
            OR (sender_id = $2 AND receiver_id = $1)
        `;

        await db.query(query, [myId, targetId]);
        res.json({ success: true, message: "Connection removed" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to remove connection" });
    }
});

module.exports = router;