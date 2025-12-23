const express = require('express');
const router = express.Router();
const Meeting = require('../models/Meeting');
const User = require('../models/User');

// Middleware to verify token (Assuming you have one, if not I'll inline a simple check or rely on caller)
// For now, I'll assume the client sends the user ID or a token. 
// Ideally we should import the 'protect' middleware from authMiddleware if it exists.
// I will check the codebase for auth middleware in a moment, but for now I'll write the logic assuming `req.user` is populated or we strictly use IDs.

// Create a new meeting
router.post('/schedule', async (req, res) => {
    try {
        const { organizerId, participantId, title, description, startTime, duration } = req.body;

        const newMeeting = new Meeting({
            organizer: organizerId,
            participant: participantId,
            title,
            description,
            startTime,
            duration
        });

        const savedMeeting = await newMeeting.save();
        res.status(201).json(savedMeeting);
    } catch (err) {
        console.error("Error scheduling meeting:", err);
        res.status(500).json({ message: 'Server error scheduling meeting' });
    }
});

// Get upcoming meetings for a user (as organizer or participant)
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const today = new Date();

        // Find meetings where user is organizer OR participant, and start time is in future (or recent past)
        const meetings = await Meeting.find({
            $or: [{ organizer: userId }, { participant: userId }],
            // Optional: Filter by date to only show future? For now, let's fetch all sorted by date.
            // startTime: { $gte: today } 
        })
            .populate('organizer', 'name email')
            .populate('participant', 'name email')
            .sort({ startTime: 1 });

        res.json(meetings);
    } catch (err) {
        console.error("Error fetching meetings:", err);
        res.status(500).json({ message: 'Server error fetching meetings' });
    }
});

// Update meeting status
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const meeting = await Meeting.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        res.json(meeting);
    } catch (err) {
        res.status(500).json({ message: 'Server error updating meeting' });
    }
});

module.exports = router;
