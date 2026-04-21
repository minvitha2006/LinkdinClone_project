const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. AUTO-CREATE UPLOADS FOLDER
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// 2. MULTER CONFIG
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// 3. CREATE POST
router.post('/', auth, upload.single('postImage'), async (req, res) => {
    try {
        const { content } = req.body;
        const image_url = req.file ? `/uploads/${req.file.filename}` : null;

        if (!content && !image_url) return res.status(400).json({ msg: "Post cannot be empty" });

        // Step A: Insert into posts table (Ensure your table has post_id, content, image_url, user_id)
        const result = await db.query(
            'INSERT INTO posts (user_id, content, image_url) VALUES ($1, $2, $3) RETURNING *',
            [req.user.id, content, image_url]
        );

        const createdPostId = result.rows[0].post_id;

        // Step B: Fetch full data with JOIN
        const fullPost = await db.query(
            `SELECT p.*, pr.full_name, pr.headline, pr.profile_pic,
             0 as likes_count, 0 as comments_count, false as is_liked
             FROM posts p 
             JOIN profiles pr ON p.user_id = pr.user_id 
             WHERE p.post_id = $1`,
            [createdPostId]
        );
        res.json(fullPost.rows[0]);
    } catch (err) {
        console.error("🔥 Create Post Error:", err.message);
        res.status(500).json({ msg: "Server Error: check if columns post_id, content, image_url exist." });
    }
});

// 4. GET FEED
router.get('/feed', auth, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT 
                p.*, 
                pr.full_name, 
                pr.headline, 
                pr.profile_pic,
                (SELECT COUNT(*) FROM likes WHERE post_id = p.post_id) as likes_count,
                (SELECT COUNT(*) FROM comments WHERE post_id = p.post_id) as comments_count,
                EXISTS(SELECT 1 FROM likes WHERE post_id = p.post_id AND user_id = $1) as is_liked
             FROM posts p
             JOIN profiles pr ON p.user_id = pr.user_id 
             ORDER BY p.post_id DESC`, // Using post_id for ordering if created_at fails
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Feed Error:", err.message);
        res.status(500).json({ msg: "Server Error: Check Table Relationships" });
    }
});

// 5. LIKE/UNLIKE TOGGLE
router.post('/like/:postId', auth, async (req, res) => {
    try {
        const { postId } = req.params;
        const existingLike = await db.query(
            'SELECT * FROM likes WHERE post_id = $1 AND user_id = $2',
            [postId, req.user.id]
        );

        if (existingLike.rows.length > 0) {
            await db.query('DELETE FROM likes WHERE post_id = $1 AND user_id = $2', [postId, req.user.id]);
            return res.json({ msg: "unliked", isLiked: false });
        }

        await db.query('INSERT INTO likes (post_id, user_id) VALUES ($1, $2)', [postId, req.user.id]);
        res.json({ msg: "liked", isLiked: true });
    } catch (err) {
        console.error("Like error:", err.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

// 6. GET COMMENTS
router.get('/comments/:postId', auth, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT c.*, pr.full_name, pr.profile_pic 
             FROM comments c
             JOIN profiles pr ON c.user_id = pr.user_id 
             WHERE c.post_id = $1 
             ORDER BY c.comment_id ASC`,
            [req.params.postId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Fetch comments error:", err.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

// 7. ADD COMMENT
router.post('/comment/:postId', auth, async (req, res) => {
    const { comment_text } = req.body;
    if (!comment_text) return res.status(400).json({ msg: "Comment cannot be empty" });

    try {
        const result = await db.query(
            'INSERT INTO comments (post_id, user_id, comment_text) VALUES ($1, $2, $3) RETURNING *',
            [req.params.postId, req.user.id, comment_text]
        );

        const createdCommentId = result.rows[0].comment_id;

        const commentWithUser = await db.query(
            `SELECT c.*, pr.full_name, pr.profile_pic 
             FROM comments c JOIN profiles pr ON c.user_id = pr.user_id 
             WHERE c.comment_id = $1`,
            [createdCommentId]
        );
        res.json(commentWithUser.rows[0]);
    } catch (err) {
        console.error("Comment error:", err.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

// 8. DELETE A POST
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            'DELETE FROM posts WHERE post_id = $1 AND user_id = $2 RETURNING *',
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ msg: "Unauthorized or post not found" });
        }
        res.json({ msg: "Post deleted successfully" });
    } catch (err) {
        console.error("Delete error:", err.message);
        res.status(500).json({ msg: "Server error" });
    }
});
// 9. DELETE A COMMENT
router.delete('/comment/:commentId', auth, async (req, res) => {
    try {
        const { commentId } = req.params;
        
        // This ensures users can only delete their own comments
        const result = await db.query(
            'DELETE FROM comments WHERE comment_id = $1 AND user_id = $2 RETURNING *',
            [commentId, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ msg: "Unauthorized or comment not found" });
        }

        res.json({ msg: "Comment deleted successfully" });
    } catch (err) {
        console.error("Delete comment error:", err.message);
        res.status(500).json({ msg: "Server error" });
    }
});
module.exports = router;