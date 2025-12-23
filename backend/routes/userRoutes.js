const express = require('express');
const router = express.Router();
const { getUserById } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:id', protect, getUserById);

module.exports = router;
