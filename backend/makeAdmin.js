const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const bcrypt = require('bcryptjs');

const makeAdmin = async () => {
    try {
        const email = process.argv[2];
        const password = process.argv[3]; // Optional password for creation

        if (!email) {
            console.log('Usage: node makeAdmin.js <user_email> [password]');
            process.exit(1);
        }

        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        let user = await User.findOne({ email });

        if (!user) {
            if (!password) {
                console.log('User not found! Provide a password to create the user.');
                process.exit(1);
            }

            // Create new Admin User
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            user = await User.create({
                name: 'Admin User',
                email,
                password: hashedPassword,
                isAdmin: true
            });
            console.log(`Created new Admin User: ${user.email}`);
        } else {
            user.isAdmin = true;
            await user.save();
            console.log(`Updated User ${user.email} to Admin.`);
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

makeAdmin();
