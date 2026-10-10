# ElectionSync: Real-Time Voting System

ElectionSync is a fully real-time, interactive, and gamified voting system. It allows administrators to securely control the flow of an election while providing users with an engaging, gamified interface to cast their votes and watch live results update instantly.

## 🚀 Features

- **Live Leaderboard & WebSockets**: Votes are processed and broadcasted in real-time to all connected clients instantly using Spring WebSockets.
- **Gamified Voting Experience**: A highly premium dark-mode UI with glassmorphism, 3D interactive candidate cards (`framer-motion`), and live confetti bursts upon voting (`canvas-confetti`).
- **Secure Admin Panel**: A protected admin dashboard requiring a secret key to manage candidates, toggle the election open/close, and view detailed ledger insights.
- **Robust Persistence**: Built with Spring Boot and MongoDB, ensuring that all votes and election states (open/closed) are securely stored and persisted across server restarts.
- **Production Ready**: Fully configured for containerized deployment (Docker) on modern cloud platforms like Render.

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 (via Vite)
- **Styling**: Tailwind CSS v4, Lucide React (Icons)
- **Animations**: Framer Motion (Page transitions, 3D tilt, dynamic progress bars)
- **Interactions**: Canvas Confetti

### Backend
- **Framework**: Spring Boot 3
- **Language**: Java 21
- **Database**: MongoDB (Spring Data MongoDB & MongoTemplate)
- **Real-Time**: Spring WebSockets
- **Containerization**: Docker (Multi-stage build)

---

## 💻 Local Development Setup

### 1. Database Setup
You will need a MongoDB instance running locally or via MongoDB Atlas.
Get your connection string (e.g., `mongodb://localhost:27017/electiondb`).

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd election-backend
   ```
2. Create a local properties file to store your secrets (this file is git-ignored):
   Create `src/main/resources/application-local.properties` and add:
   ```properties
   spring.data.mongodb.uri=your_mongodb_connection_string
   admin.secret-key=your_super_secret_key
   ```
3. Run the Spring Boot application:
   ```bash
   ./mvnw spring-boot:run
   ```
   *(The backend runs on port 8080 by default)*

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the environment variables:
   Create a `.env` file in the `frontend` root:
   ```env
   VITE_API_BASE_URL=http://localhost:8080/api
   VITE_WS_BASE_URL=ws://localhost:8080
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

---

## ☁️ Deployment Guide (Render)

This project is optimized for deployment on [Render](https://render.com).

### Backend (Web Service)
1. Create a new **Web Service** on Render and connect your repository.
2. Set the Root Directory to `election-backend`.
3. Set the Environment to **Docker**. (Render will automatically detect the provided multi-stage `Dockerfile`).
4. Add your Environment Variables:
   - `MONGODB_URI`
   - `ADMIN_SECRET_KEY`

### Frontend (Static Site)
1. Create a new **Static Site** on Render.
2. Set the Root Directory to `frontend`.
3. Set the **Build Command**: `npm install && npm run build`
4. Set the **Publish Directory**: `dist` (Important: Do not leave this blank).
5. Add your Environment Variables:
   - `VITE_API_BASE_URL` (e.g., `https://your-backend.onrender.com/api`)
   - `VITE_WS_BASE_URL` (e.g., `wss://your-backend.onrender.com`)
6. In **Redirects/Rewrites**, add a rewrite rule for SPA routing:
   - Source: `/*` -> Destination: `/index.html` (Action: Rewrite)

## 🛡️ Security

- **Admin Authentication**: Admin routes (`/api/admin/**`) are protected by a custom `AdminAuthInterceptor` that validates the `X-Admin-Secret` header against the server's environment variables.
- **CORS Configuration**: The backend explicitly configures CORS and WebSocket allowed origins to prevent unauthorized cross-origin requests.
