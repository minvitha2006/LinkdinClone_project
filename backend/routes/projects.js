const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');

// 1. CREATE A NEW PROJECT
router.post('/', auth, async (req, res) => {
    const { title, description, link, tech_stack } = req.body;

    if (!title || !description) {
        return res.status(400).json({ msg: "Title and Description are required" });
    }

    try {
        const newProject = await db.query(
            'INSERT INTO projects (user_id, title, description, link, tech_stack) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [req.user.id, title, description, link || null, tech_stack || []]
        );
        res.json(newProject.rows[0]);
    } catch (err) {
        console.error("CREATE ERROR:", err.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

// 2. GET ALL PROJECTS (Corrected Query)
router.get('/', auth, async (req, res) => {
    try {
        const query = `
            SELECT p.*, prof.full_name 
            FROM projects p
            JOIN profiles prof ON p.user_id = prof.user_id
            ORDER BY p.created_at DESC;
        `;
        const projects = await db.query(query);
        res.json(projects.rows);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// DELETE A PROJECT
router.delete('/:id', auth, async (req, res) => {
    try {
        const projectId = req.params.id;
        const userId = req.user.id; // ID from the token (Auth Middleware)

        // 1. Find the project
        const projectRes = await db.query('SELECT * FROM projects WHERE id = $1', [projectId]);
        
        if (projectRes.rows.length === 0) {
            return res.status(404).json({ msg: "Project not found" });
        }

        const project = projectRes.rows[0];

        // 2. Ownership Check (Using String comparison to be safe)
        if (String(project.user_id) !== String(userId)) {
            return res.status(401).json({ 
                msg: "Unauthorized: You do not own this project",
                debug: { projectOwner: project.user_id, requester: userId } 
            });
        }

        // 3. Execute Delete
        await db.query('DELETE FROM projects WHERE id = $1', [projectId]);
        
        res.json({ msg: "Innovation deleted successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: "Server error during deletion" });
    }
});
module.exports = router;