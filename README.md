<img width="2879" height="1621" alt="Screenshot 2025-12-27 175502" src="https://github.com/user-attachments/assets/c63f22f1-3b6a-4b71-a8f1-5245bffcec7d" /><img width="2879" height="1621" alt="Screenshot 2025-12-27 175502" src="https://github.com/user-attachments/assets/3946cad6-6b56-4d01-9a30-ea36c5a4dba3" /># 🔄 Skill Swap

![MERN Stack](https://img.shields.io/badge/MERN-Stack-000000?style=for-the-badge&logo=mongodb&logoColor=green)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![WebRTC](https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white)
[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit_Now-success?style=for-the-badge&logo=vercel&logoColor=white)](https://skill-swap-by-sonu.vercel.app/)

**Skill Swap** is a dynamic platform designed to connect individuals who want to exchange skills. Whether you want to learn coding in exchange for guitar lessons or swap language practice, Skill Swap makes it easy. Built with the MERN stack and enhanced with real-time features like chat, video calls, and a collaborative whiteboard.
*   **LIVE LINK**: [https://skill-swap-by-sonu.vercel.app/](https://skill-swap-by-sonu.vercel.app/)
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
## Screenshot
<img width="2879" height="1621" alt="Screenshot 2025-12-27 175502" src="https://github.com/user-attachments/assets/5df8d888-9726-4877-87aa-7f43ec8480b9" />
<img width="2615" height="1479" alt="Screenshot 2025-12-27 175603" src="https://github.com/user-attachments/assets/45131041-349d-4601-b899-f0c5158985a4" />
<img width="2825" height="1621" alt="Screenshot 2025-12-27 175620" src="https://github.com/user-attachments/assets/c8f7540e-095c-43c7-9a7f-35c5a5efc796" />
<img width="2879" height="1626" alt="Screenshot 2025-12-27 175638" src="https://github.com/user-attachments/assets/0c711cc6-7749-440b-b8e5-394ef0fd0698" />
<img width="2878" height="1623" alt="Screenshot 2025-12-27 175652" src="https://github.com/user-attachments/assets/bbf8a1a9-ff03-401b-af94-24483c6bd8d1" />
<img width="2833" height="1524" alt="Screenshot 2025-12-27 175709" src="https://github.com/user-attachments/assets/18aebc99-3e09-45ab-8998-27725cfe2208" />
<img width="2879" height="1612" alt="Screenshot 2025-12-27 175745" src="https://github.com/user-attachments/assets/3fd86004-91e4-4fd5-a7cb-e0651d7789cc" />
<img width="2868" height="1607" alt="Screenshot 2025-12-27 175827" src="https://github.com/user-attachments/assets/c57d8e2d-5a07-4eda-9a67-a71516b0fafc" />
<img width="2703" height="1582" alt="Screenshot 2025-12-27 175840" src="https://github.com/user-attachments/assets/128a0c1e-19a4-4b92-82bb-e9c839aaed07" />
<img width="2313" height="1608" alt="Screenshot 2025-12-27 175927" src="https://github.com/user-attachments/assets/d2669cb8-97f3-4585-b59d-0148efa2edb1" />

---

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

---

## 📄 License

This project is licensed under the [Sonu Kumar Saw](LICENSE).
