# 🔄 Skill Swap

![MERN Stack](https://img.shields.io/badge/MERN-Stack-000000?style=for-the-badge&logo=mongodb&logoColor=green)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![WebRTC](https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white)
[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit_Now-success?style=for-the-badge&logo=vercel&logoColor=white)](https://skill-swap-by-sonu.vercel.app/)

**Skill Swap** is a dynamic platform designed to connect individuals who want to exchange skills. Whether you want to learn coding in exchange for guitar lessons or swap language practice, Skill Swap makes it easy. Built with the MERN stack and enhanced with real-time features like chat, video calls, and a collaborative whiteboard.

---

## 🚀 Features

### 👤 User Experience
*   **Authentication & Authorization**: Secure signup and login functionality using JWT and bcrypt.
*   **User Profiles**: comprehensive user profiles with avatars and skill listings.
*   **Skill Matching**: Find users with complementary skills to yours.

### 💬 Real-Time Communication
*   **Live Chat**: Instant messaging powered by **Socket.io** for seamless coordination.
*   **Video Calls**: High-quality video conferencing using **WebRTC** (Simple Peer) and Socket.io.
*   **Collaborative Whiteboard**: Real-time collaborative drawing board for teaching and brainstorming.

### 🛠️ Functionality
*   **File Sharing**: Upload and share resources with other users (Cloudinary integration).
*   **Admin Dashboard**: Dedicated area for administrative tasks.
*   **Review System**: Rate and review your skill swap partners.
*   **Meeting Management**: Schedule and manage your skill swap sessions.

---

## 🛠️ Tech Stack

### Frontend
*   **Framework**: [Next.js 16](https://nextjs.org/) (React 19)
*   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Real-time Client**: `socket.io-client`, `simple-peer`
*   **HTTP Client**: `axios`

### Backend
*   **Runtime**: [Node.js](https://nodejs.org/)
*   **Framework**: [Express.js](https://expressjs.com/)
*   **Database**: [MongoDB](https://www.mongodb.com/) (Mongoose ODM)
*   **Real-time Server**: `socket.io`
*   **File Storage**: `multer`, `cloudinary`
*   **Security**: `bcryptjs`, `jsonwebtoken`, `cors`, `dotenv`

---

## 📂 Project Structure

```bash
skill-swap/
├── backend/            # Express.js server and API
│   ├── controllers/    # Request handlers
│   ├── models/         # Mongoose schemas
│   ├── routes/         # API endpoints
│   └── server.js       # Entry point
│
└── frontend/           # Next.js client application
    ├── src/
    │   ├── app/        # App router pages (profile, chat, admin, etc.)
    │   └── components/ # Reusable UI components
    └── package.json
```

---

## ⚡ Getting Started

Follow these instructions to set up the project locally.

### Prerequisites
*   Node.js (v18+ recommended)
*   MongoDB installed locally or a MongoDB Atlas connection string.

### 1. Clone the Repository
```bash
git clone https://github.com/sonukumarsaw12/Skill_Swap_By_Sonu.git
cd skill-swap
```

### 2. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory with the following variables:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
# Cloudinary Configuration (Optional for generic setup, required for uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Start the backend server:
```bash
npm start
# OR for development with nodemon
npm run dev
```

### 3. Frontend Setup
Open a new terminal, navigate to the frontend directory and install dependencies:
```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` directory (if required) or configure API base URL pointing to `http://localhost:5000`.

Start the development server:
```bash
npm run dev
```

The app should now be running at `http://localhost:3000`.

---

## 🛣️ API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **Auth** | `/api/auth` | User signup, login, and authentication |
| **Users** | `/api/users` | User profile management |
| **Chat** | `/api/chat` | Chat history and messaging routes |
| **Match** | `/api/match` | Skill matching algorithms |
| **Upload** | `/api/upload` | File upload handling |
| **Requests** | `/api/requests` | Connection requests management |
| **Reviews** | `/api/reviews` | User ratings and reviews |
| **Admin** | `/api/admin` | Administrative actions |

---

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

---

## 📄 License

This project is licensed under the [Sonu Kumar Saw](LICENSE).
