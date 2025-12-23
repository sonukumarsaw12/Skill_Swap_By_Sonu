const Request = require('../models/Request');
const User = require('../models/User');

// @desc    Send connection request
// @route   POST /api/requests
// @access  Private
const sendRequest = async (req, res) => {
    try {
        const { receiverId } = req.body;

        const existingRequest = await Request.findOne({
            sender: req.user.id,
            receiver: receiverId
        });

        if (existingRequest) {
            return res.status(400).json({ message: 'Request already sent' });
        }

        const request = await Request.create({
            sender: req.user.id,
            receiver: receiverId
        });

        // Emit real-time event
        req.io.to(receiverId).emit('new_request', request);

        res.status(201).json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get received requests
// @route   GET /api/requests
// @access  Private
const getRequests = async (req, res) => {
    try {
        const requests = await Request.find({ receiver: req.user.id })
            .populate('sender', 'name email skillsKnown skillsToLearn');
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update request status (accept/reject)
// @route   PUT /api/requests/:id
// @access  Private
const updateRequestStatus = async (req, res) => {
    try {
        const { status } = req.body; // 'accepted' or 'rejected'
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.receiver.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        request.status = status;
        await request.save();

        if (status === 'accepted') {
            // Notify sender that request was accepted
            req.io.to(request.sender.toString()).emit('request_accepted', {
                partnerId: req.user.id,
                partnerName: req.user.name
            });
            // Also notify receiver (myself) to update UI? Frontend handles this via success of API call, 
            // but we can emit 'request_accepted' to self room too if we want multi-tab sync.
            req.io.to(req.user.id).emit('request_accepted', {
                partnerId: request.sender.toString()
            });
        }

        res.json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get accepted connections
// @route   GET /api/requests/accepted
// @access  Private
// @desc    Get accepted connections
// @route   GET /api/requests/accepted
// @access  Private
const getConnections = async (req, res) => {
    try {
        const connections = await Request.find({
            $or: [{ sender: req.user.id }, { receiver: req.user.id }],
            status: 'accepted'
        })
            .populate('sender', 'name email')
            .populate('receiver', 'name email');

        // Deduplicate connections based on partner ID
        const uniqueConnections = [];
        const partnerIds = new Set();

        connections.forEach(conn => {
            const partner = conn.sender._id.toString() === req.user.id ? conn.receiver : conn.sender;
            if (!partnerIds.has(partner._id.toString())) {
                partnerIds.add(partner._id.toString());
                uniqueConnections.push(conn);
            }
        });

        res.json(uniqueConnections);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { sendRequest, getRequests, updateRequestStatus, getConnections };
