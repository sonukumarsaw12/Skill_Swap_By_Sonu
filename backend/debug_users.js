const mongoose = require('mongoose');
const User = require('./models/User');
const Request = require('./models/Request');
const dotenv = require('dotenv');

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

const debugState = async () => {
    await connectDB();

    const users = await User.find({});
    console.log('\n--- USERS ---');
    users.forEach(u => {
        console.log(`ID: ${u._id}, Name: ${u.name}, Email: ${u.email}`);
        console.log(`   Teaches: ${u.skillsKnown}`);
        console.log(`   Learns: ${u.skillsToLearn}`);
    });

    const requests = await Request.find({});
    console.log('\n--- REQUESTS ---');
    requests.forEach(r => {
        console.log(`Sender: ${r.sender}, Receiver: ${r.receiver}, Status: ${r.status}`);
    });

    process.exit();
};

debugState();
