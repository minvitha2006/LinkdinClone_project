const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. CONFIGURE MULTER FOR FILE UPLOADS
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Points to the uploads folder in the root directory
        const uploadPath = path.resolve(__dirname, '../uploads'); 
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Unique filename using user ID and timestamp to avoid browser caching issues
        cb(null, `profile-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit
});

// 2. GET CURRENT USER PROFILE
router.get('/me', auth, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT u.email, p.* FROM profiles p JOIN users u ON p.user_id = u.user_id WHERE p.user_id = $1',
            [req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ msg: "Profile not found" });
        }
        res.json(result.rows[0]);
    } catch (err) { 
        console.error("Get Profile Error:", err.message);
        res.status(500).send('Server Error'); 
    }
});

// 3. UPLOAD OR UPDATE PROFILE PICTURE
// Changed to ensure the image URL is stored correctly as /uploads/filename
router.post('/upload-pic', auth, upload.single('profilePic'), async (req, res) => {
    try {
        if (!req.file) {
            console.log("No file received by Multer");
            return res.status(400).json({ msg: "No file uploaded" });
        }

        // Clean up old profile picture from server storage
        const oldProfile = await db.query('SELECT profile_pic FROM profiles WHERE user_id = $1', [req.user.id]);
        if (oldProfile.rows[0]?.profile_pic) {
            const relativePath = oldProfile.rows[0].profile_pic.replace(/^\//, '');
            const oldPath = path.join(__dirname, '..', relativePath);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        const imageUrl = `/uploads/${req.file.filename}`;
        
        // Update database with the new URL
        const result = await db.query(
            'UPDATE profiles SET profile_pic = $1 WHERE user_id = $2 RETURNING profile_pic', 
            [imageUrl, req.user.id]
        );

        console.log("Saved to DB:", result.rows[0].profile_pic);
        res.json({ imageUrl: result.rows[0].profile_pic });
    } catch (err) { 
        console.error("Upload Route Error:", err.message);
        res.status(500).send('Upload Error'); 
    }
});

// 4. DELETE PROFILE PICTURE
router.delete('/upload-pic', auth, async (req, res) => {
    try {
        const profile = await db.query('SELECT profile_pic FROM profiles WHERE user_id = $1', [req.user.id]);
        if (profile.rows[0]?.profile_pic) {
            const relativePath = profile.rows[0].profile_pic.replace(/^\//, '');
            const fullPath = path.join(__dirname, '..', relativePath);
            if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
            
            await db.query('UPDATE profiles SET profile_pic = NULL WHERE user_id = $1', [req.user.id]);
        }
        res.json({ msg: "Deleted" });
    } catch (err) { 
        console.error("Delete Pic Error:", err.message);
        res.status(500).send('Delete Error'); 
    }
});

// 5. UPDATE PROFILE DETAILS
// CRITICAL FIX: We do NOT update profile_pic here. 
// This prevents the photo from being reset to null when you save text details.
router.put('/me', auth, async (req, res) => {
    const { full_name, headline, skills, education, certifications, experience, location } = req.body;
    try {
        const result = await db.query(
            `UPDATE profiles 
             SET full_name=$1, headline=$2, skills=$3, education=$4, certifications=$5, experience=$6, location=$7
             WHERE user_id=$8 RETURNING *`,
            [
                full_name, 
                headline, 
                Array.isArray(skills) ? JSON.stringify(skills) : skills, 
                Array.isArray(education) ? JSON.stringify(education) : education, 
                Array.isArray(certifications) ? JSON.stringify(certifications) : certifications, 
                Array.isArray(experience) ? JSON.stringify(experience) : experience,
                location,
                req.user.id
            ]
        );
        res.json(result.rows[0]);
    } catch (err) { 
        console.error("Update Profile Error:", err.message);
        res.status(500).send('Update Error'); 
    }
});

// 6. GET OTHER USER'S PROFILE BY ID
router.get('/:id', auth, async (req, res) => {
    try {
        const targetId = req.params.id;
        const result = await db.query(
            `SELECT p.*, u.email FROM users u
             LEFT JOIN profiles p ON u.user_id = p.user_id
             WHERE u.user_id = $1`,
            [targetId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const data = result.rows[0];
        const formattedData = {
            ...data,
            skills: typeof data.skills === 'string' ? JSON.parse(data.skills) : (data.skills || []),
            education: typeof data.education === 'string' ? JSON.parse(data.education) : (data.education || []),
            experience: typeof data.experience === 'string' ? JSON.parse(data.experience) : (data.experience || []),
            certifications: typeof data.certifications === 'string' ? JSON.parse(data.certifications) : (data.certifications || [])
        };

        res.json(formattedData);
    } catch (err) {
        console.error("Backend Get Profile ID Error:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;