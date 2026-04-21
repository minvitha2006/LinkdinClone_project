const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');

// 1. ADD A NEW PORTFOLIO ITEM
router.post('/', auth, async (req, res) => {
    const { title, description, url } = req.body;
    try {
        const newItem = await db.query(
            'INSERT INTO portfolio_items (user_id, title, description, url) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.user.id, title, description, url]
        );
        res.json(newItem.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// 2. GET USER'S PORTFOLIO (With their validated reviews)
router.get('/:userId', auth, async (req, res) => {
    try {
        const portfolio = await db.query(
            `SELECT p.*, 
             (SELECT JSON_AGG(v) FROM skill_validations v WHERE v.item_id = p.id AND v.status = 'completed') as reviews
             FROM portfolio_items p WHERE p.user_id = $1`,
            [req.params.userId]
        );
        res.json(portfolio.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// 3. ASK A CONNECTION TO VALIDATE (Cybersecurity: Connection Check Added)
router.post('/request/:itemId', auth, async (req, res) => {
    const { validator_id } = req.body;
    const itemId = req.params.itemId;

    try {
        // Security Check: Verify if validator is actually a connected friend
        const connectionCheck = await db.query(
            `SELECT * FROM connections 
             WHERE status = 'accepted' 
             AND ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))`,
            [req.user.id, validator_id]
        );

        if (connectionCheck.rows.length === 0) {
            return res.status(403).json({ msg: "You can only ask accepted connections to validate your work" });
        }

        const newRequest = await db.query(
            'INSERT INTO skill_validations (item_id, validator_id) VALUES ($1, $2) RETURNING *',
            [itemId, validator_id]
        );
        
        res.json(newRequest.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// 4. SUBMIT A PEER REVIEW
router.put('/validate/:validationId', auth, async (req, res) => {
    const { rating, comment } = req.body; // Rating 1-5
    const validationId = req.params.validationId;

    try {
        const review = await db.query(
            `UPDATE skill_validations 
             SET status = 'completed', rating = $1, comment = $2, validated_at = CURRENT_TIMESTAMP
             WHERE id = $3 AND validator_id = $4 
             RETURNING *`,
            [rating, comment, validationId, req.user.id]
        );

        if (review.rows.length === 0) {
            return res.status(401).json({ msg: "Not authorized or request not found" });
        }

        res.json(review.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// 5. DELETE PORTFOLIO ITEM
router.delete('/:id', auth, async (req, res) => {
    try {
        const result = await db.query(
            'DELETE FROM portfolio_items WHERE id = $1 AND user_id = $2 RETURNING *',
            [req.params.id, req.user.id]
        );
        if (result.rows.length === 0) return res.status(401).json({ msg: "Unauthorized" });
        res.json({ msg: "Item removed" });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;