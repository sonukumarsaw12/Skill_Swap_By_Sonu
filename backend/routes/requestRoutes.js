const express = require('express');
const router = express.Router();
const { sendRequest, getRequests, updateRequestStatus, getConnections } = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, sendRequest);
router.get('/', protect, getRequests);
router.put('/:id', protect, updateRequestStatus);
router.get('/accepted', protect, getConnections);

module.exports = router;
