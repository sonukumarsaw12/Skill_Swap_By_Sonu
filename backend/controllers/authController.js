const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const PendingUser = require('../models/PendingUser');
const sendEmail = require('../utils/sendEmail');

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

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = Date.now() + 10 * 60 * 1000;

        // Check if pending user already exists (to handle re-signup before verification)
        let pendingUser = await PendingUser.findOne({ email });

        if (pendingUser) {
            // Update existing pending user
            pendingUser.name = name;
            pendingUser.password = hashedPassword;
            pendingUser.skillsKnown = skillsKnown;
            pendingUser.skillsToLearn = skillsToLearn;
            pendingUser.otp = otp;
            pendingUser.otpExpires = otpExpires;
            await pendingUser.save();
        } else {
            // Create New Pending User
            pendingUser = await PendingUser.create({
                name,
                email,
                password: hashedPassword,
                skillsKnown,
                skillsToLearn,
                otp,
                otpExpires
            });
        }

        if (pendingUser) {
                // Start sending email in background (Fast Response)
                const message = `Your verification code is: ${otp}. It will expire in 10 minutes.`;
                setImmediate(async () => {
                    try {
                        console.log(`Background: Sending signup OTP to ${pendingUser.email}`);
                        await sendEmail({
                            email: pendingUser.email,
                            subject: 'Email Verification OTP',
                            message,
                            html: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
                                    <h2 style="color: #4f46e5; text-align: center;">Welcome to SkillSwap!</h2>
                                    <p>Thank you for signing up. Please use the following One-Time Password (OTP) to verify your email address:</p>
                                    <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1f2937; border-radius: 8px; margin: 20px 0;">
                                        ${otp}
                                    </div>
                                    <p>This code will expire in <strong>10 minutes</strong>.</p>
                                    <p>If you didn't request this, please ignore this email.</p>
                                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                                    <p style="font-size: 12px; color: #6b7280; text-align: center;">&copy; 2024 SkillSwap. All rights reserved.</p>
                                </div>
                            `,
                        });
                    } catch (err) {
                        console.error("Background Email Error (Signup):", err);
                    }
                });

                res.status(201).json({
                    message: 'OTP sent to email. Please verify.',
                    email: pendingUser.email,
                    unverified: true
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
            
            // Skip OTP for admins
            if (user.isAdmin) {
                return res.status(200).json({
                    _id: user.id,
                    name: user.name,
                    email: user.email,
                    isAdmin: user.isAdmin,
                    token: generateToken(user.id),
                });
            }

            // Generate OTP for Login 2FA (for regular users)
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpires = Date.now() + 10 * 60 * 1000;

            user.otp = otp;
            user.otpExpires = otpExpires;
            await user.save();

            // Start sending email in background (Fast Response)
            const message = `Your login verification code is: ${otp}. It will expire in 10 minutes.`;
            setImmediate(async () => {
                try {
                    console.log(`Background: Sending login OTP to ${user.email}`);
                    await sendEmail({
                        email: user.email,
                        subject: 'Login Verification OTP',
                        message,
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
                                <h2 style="color: #4f46e5; text-align: center;">SkillSwap Login</h2>
                                <p>You are trying to log in. Please use the following One-Time Password (OTP) to verify your identity:</p>
                                <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1f2937; border-radius: 8px; margin: 20px 0;">
                                    ${otp}
                                </div>
                                <p>This code will expire in <strong>10 minutes</strong>.</p>
                                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                                <p style="font-size: 12px; color: #6b7280; text-align: center;">&copy; 2024 SkillSwap. All rights reserved.</p>
                            </div>
                        `,
                    });
                } catch (err) {
                    console.error("Background Email Error (Login):", err);
                }
            });

            return res.status(200).json({
                message: 'OTP sent to email for login verification',
                email: user.email,
                requiresOtp: true
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

// @desc    Verify Email OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // 1. Check PendingUser (Signup Case)
        const pendingUser = await PendingUser.findOne({ email });

        if (pendingUser) {
            if (pendingUser.otp !== otp || pendingUser.otpExpires < Date.now()) {
                return res.status(400).json({ message: 'Invalid or expired OTP' });
            }

            // Create the actual User
            const user = await User.create({
                name: pendingUser.name,
                email: pendingUser.email,
                password: pendingUser.password,
                skillsKnown: pendingUser.skillsKnown,
                skillsToLearn: pendingUser.skillsToLearn,
                isVerified: true
            });

            // Delete Pending User
            await PendingUser.deleteOne({ email });

            return res.status(200).json({
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
        }

        // 2. Check User (Login Case)
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Clear OTP fields
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.status(200).json({
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
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        // Check PendingUser (Signup Case)
        const pendingUser = await PendingUser.findOne({ email });

        if (pendingUser) {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpires = Date.now() + 10 * 60 * 1000;

            pendingUser.otp = otp;
            pendingUser.otpExpires = otpExpires;
            await pendingUser.save();

            const message = `Your new verification code is: ${otp}. It will expire in 10 minutes.`;
            await sendEmail({
                email: pendingUser.email,
                subject: 'New Verification OTP',
                message,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
                        <h2 style="color: #4f46e5; text-align: center;">SkillSwap Verification</h2>
                        <p>You requested a new verification code. Please use the following OTP:</p>
                        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1f2937; border-radius: 8px; margin: 20px 0;">
                            ${otp}
                        </div>
                        <p>This code will expire in <strong>10 minutes</strong>.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 12px; color: #6b7280; text-align: center;">&copy; 2024 SkillSwap. All rights reserved.</p>
                    </div>
                `,
            });
            return res.status(200).json({ message: 'OTP resent successfully' });
        }

        // Check User (Login Case)
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = Date.now() + 10 * 60 * 1000;

        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        const message = `Your new login verification code is: ${otp}. It will expire in 10 minutes.`;
        await sendEmail({
            email: user.email,
            subject: 'New Login OTP',
            message,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
                    <h2 style="color: #4f46e5; text-align: center;">SkillSwap Login</h2>
                    <p>You requested a new login verification code. Please use the following OTP:</p>
                    <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1f2937; border-radius: 8px; margin: 20px 0;">
                        ${otp}
                    </div>
                    <p>This code will expire in <strong>10 minutes</strong>.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #6b7280; text-align: center;">&copy; 2024 SkillSwap. All rights reserved.</p>
                </div>
            `,
        });

        res.status(200).json({ message: 'OTP resent successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
    updateProfile,
    getUserById,
    verifyEmail,
    resendOTP
};
