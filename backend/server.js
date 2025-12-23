const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { Server } = require('socket.io');
const http = require('http');

dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);

// Helper to normalize CLIENT_URL (ensures protocol exists)
const getClientUrl = () => {
    const url = process.env.CLIENT_URL || "http://localhost:3000";
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    return `https://${url}`;
};

const clientUrl = getClientUrl();

// Middleware
app.use(cors({
    origin: clientUrl,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.json());

// Socket.io Setup
const io = new Server(server, {
    cors: {
        origin: clientUrl,
        methods: ["GET", "POST"]
    }
});

// Attach io to req
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routes Placeholder
app.get('/', (req, res) => {
    res.send('API is running...');
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/matches', require('./routes/matchRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/meetings', require('./routes/meetingRoutes'));
app.use('/api/users', require('./routes/userRoutes'));


const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

const Message = require('./models/Message');

// Map to store userId -> socketId
const userSocketMap = new Map();

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join_room', (userId) => {
        socket.join(userId);

        // Initialize Set if not exists
        if (!userSocketMap.has(userId)) {
            userSocketMap.set(userId, new Set());
        }
        userSocketMap.get(userId).add(socket.id);

        console.log(`User matched/joined room: ${userId}. Active Connections: ${userSocketMap.get(userId).size}`);

        // Broadcast online status to all connected clients
        if (userSocketMap.get(userId).size === 1) {
            io.emit('user_status', { userId, status: 'online' });
        }
    });

    socket.on('check_status', (userId) => {
        const isOnline = userSocketMap.has(userId);
        socket.emit('user_status', { userId, status: isOnline ? 'online' : 'offline' });
    });

    socket.on('typing', (data) => {
        const { receiverId } = data;
        io.to(receiverId).emit('typing', data); // Relay to receiver
    });

    socket.on('toggleScreenShare', (data) => {
        const { to } = data;
        io.to(to).emit('toggleScreenShare', data);
    });

    socket.on('stop_typing', (data) => {
        const { receiverId } = data;
        io.to(receiverId).emit('stop_typing', data);
    });

    // Whiteboard Events
    socket.on('draw', (data) => {
        const { receiverId } = data;
        io.to(receiverId).emit('draw', data);
    });

    socket.on('clear_board', (data) => {
        const { receiverId } = data;
        io.to(receiverId).emit('clear_board', data);
    });

    // Video Call Events
    socket.on("callUser", (data) => {
        // data.userToCall is the DB User ID from frontend
        // We need the Socket ID to emit to that specific user (or use room if we trust room joining)
        // Since we join rooms with userId, we can actually just emit to the room 'data.userToCall'
        // But io.to() works with socket IDs OR rooms.
        // Let's rely on the room joining mechanism we already have: socket.join(userId).

        io.to(data.userToCall).emit("callUser", {
            signal: data.signalData,
            from: data.from,
            name: data.name
        });
    });

    socket.on("answerCall", (data) => {
        // data.to is the caller's User ID (passed as 'from' initially)
        io.to(data.to).emit("callAccepted", data.signal);
    });

    socket.on("endCall", (data) => {
        io.to(data.to).emit("endCall");
    });



    socket.on("toggleWhiteboard", (data) => {
        io.to(data.to).emit("toggleWhiteboard", data.isOpen);
    });

    socket.on('send_message', async (data) => {
        const { senderId, receiverId, message, fileUrl } = data;

        // Save to DB
        try {
            const newMessage = await Message.create({
                sender: senderId,
                receiver: receiverId,
                message,
                fileUrl
            });

            // Emit to receiver
            io.to(receiverId).emit('receive_message', newMessage);
            // Emit back to sender (optional, or handle in frontend)
            io.to(senderId).emit('receive_message', newMessage);

        } catch (error) {
            console.error(error);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        // Find user by socket.id and remove
        for (const [userId, sockets] of userSocketMap.entries()) {
            if (sockets.has(socket.id)) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    userSocketMap.delete(userId);
                    io.emit('user_status', { userId, status: 'offline' });
                }
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
