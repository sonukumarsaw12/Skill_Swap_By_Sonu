const express = require('express');
const router = express.Router();
const { upload, uploadFile } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, (req, res, next) => {
    upload.single('file')(req, res, function (err) {
        if (err) {
            console.error("Upload Error:", err);
            return res.status(500).json({
                message: "Image upload failed",
                error: err.message || err
            });
        }
        // If no error, proceed to controller
        next();
    });
}, uploadFile);

module.exports = router;
