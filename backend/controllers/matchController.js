const User = require('../models/User');
const Request = require('../models/Request');

// @desc    Get matching users
// @route   GET /api/matches
// @access  Private
const getMatches = async (req, res) => {
    try {
        // Assuming req.user is populated by auth middleware (which we need to add)
        // For now, we'll strip auth for MVP or assume we pass ID in query/body if auth not ready
        // But since we did JWT, let's use it. We need the protect middleware.

        // TEMPORARY: If middleware not fully set, we might fail. 
        // Let's implement middleware first or rely on client sending ID? 
        // Better to do it right. I'll implement authMiddleware below or within this file for speed if needed.
        // I'll assume req.user.id is available (needs middleware).

        const currentUser = await User.findById(req.user.id);
        if (!currentUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get requests map for status checking
        const requests = await Request.find({
            $or: [{ sender: req.user.id }, { receiver: req.user.id }]
        });

        const statusMap = new Map();
        requests.forEach(r => {
            const partnerId = r.sender.toString() === req.user.id ? r.receiver.toString() : r.sender.toString();
            // Prioritize accepted over pending if multiple exist (edge case)
            if (!statusMap.has(partnerId) || r.status === 'accepted') {
                statusMap.set(partnerId, r.status);
            }
        });

        // Don't exclude anyone except self, let frontend handle display
        const allUsers = await User.find({ _id: { $ne: currentUser._id } });

        let matches = allUsers.map(user => {
            let score = 0;

            // 1. Check if I can teach them (Teach Match)
            const teachMatch = user.skillsToLearn.some(skill =>
                currentUser.skillsKnown.map(s => s.toLowerCase()).includes(skill.toLowerCase())
            );

            // 2. Check if they can teach me (Learn Match)
            // This is the most valuable for the current user
            const learnMatch = user.skillsKnown.some(skill =>
                currentUser.skillsToLearn.map(s => s.toLowerCase()).includes(skill.toLowerCase())
            );

            // Scoring Logic
            if (teachMatch) score += 2; // I can help them
            if (learnMatch) score += 3; // They can help me (higher priority)

            // Only count rating if there is at least some skill match
            if (teachMatch || learnMatch) {
                // Reciprocal Match (Perfect Match)
                if (teachMatch && learnMatch) {
                    score += 5; // Huge bonus for perfect exchange
                }

                // Rating Weight (0 to 5 points max)
                // A 5-star user gets +2.5 to score
                if (user.rating) {
                    score += (user.rating * 0.5);
                }
            } else {
                score = 0; // Force 0 if no skill match
            }

            const connectionStatus = statusMap.get(user._id.toString()) || 'none';

            return {
                ...user._doc,
                score,
                teachMatch,
                learnMatch,
                isPerfectMatch: (teachMatch && learnMatch),
                connectionStatus
            };
        });

        // Filter only those with score > 0
        matches = matches.filter(m => m.score > 0);

        // Sort by score desc
        matches.sort((a, b) => b.score - a.score);

        res.json(matches);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getMatches };
