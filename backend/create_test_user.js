const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const createTestUser = async () => {
    await connectDB();

    const email = 'testuser@example.com';
    const userExists = await User.findOne({ email });

    if (userExists) {
        console.log('Test user already exists');
        process.exit();
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    const user = await User.create({
        name: 'Test Tutor',
        email: email,
        password: hashedPassword,
        skillsKnown: ['React', 'JavaScript'],
        skillsToLearn: ['Python'], // Reciprocal match for Astha (who teaches Python)
        bio: 'I am a React expert looking to learn Python.'
    });

    console.log('Created Test User:', user);
    process.exit();
};

createTestUser();
