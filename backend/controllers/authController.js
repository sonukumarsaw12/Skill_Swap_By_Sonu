const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { name, email, password, skillsKnown, skillsToLearn } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please add all fields' });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            skillsKnown,
            skillsToLearn
        });

        if (user) {
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                title: user.title,
                bio: user.bio,
                profilePic: user.profilePic,
                achievements: user.achievements,
                skillsKnown: user.skillsKnown,
                skillsToLearn: user.skillsToLearn,
                token: generateToken(user.id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user email
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            // Update last login
            user.lastLogin = Date.now();
            await user.save();

            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                title: user.title,
                bio: user.bio,
                profilePic: user.profilePic,
                achievements: user.achievements,
                skillsKnown: user.skillsKnown,
                skillsToLearn: user.skillsToLearn,
                isAdmin: user.isAdmin,
                token: generateToken(user.id),
            });
        } else {
            res.status(400).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    // We will add auth middleware later to populate req.user
    const { _id, name, email } = await User.findById(req.user.id);

    res.status(200).json({
        id: _id,
        name,
        email,
    });
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;

            if (req.body.skillsKnown) {
                user.skillsKnown = req.body.skillsKnown;
            }
            if (req.body.skillsKnown) user.skillsKnown = req.body.skillsKnown;
            if (req.body.skillsToLearn) user.skillsToLearn = req.body.skillsToLearn;
            if (req.body.title !== undefined) user.title = req.body.title;
            if (req.body.bio !== undefined) user.bio = req.body.bio;
            if (req.body.profilePic !== undefined) user.profilePic = req.body.profilePic;
            if (req.body.achievements !== undefined) user.achievements = req.body.achievements;

            if (req.body.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(req.body.password, salt);
            }

            const updatedUser = await user.save();

            // Broadcase profile update so everyone's recommendations refresh
            req.io.emit('user_updated', { userId: updatedUser.id });

            res.json({
                _id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                title: updatedUser.title,
                bio: updatedUser.bio,
                profilePic: updatedUser.profilePic,
                achievements: updatedUser.achievements,
                skillsKnown: updatedUser.skillsKnown,
                skillsToLearn: updatedUser.skillsToLearn,
                token: generateToken(updatedUser.id),
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get specific user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
    updateProfile,
    getUserById
};
