require("dotenv").config();
require("./config/mail");
require("./config/firebase");

const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const setupSocket =require("./services/socketService");
const authRoutes = require("./routes/authRoutes");
const fileRoutes = require("./routes/files")
const PORT = process.env.PORT || 5000;

// Create HTTP server from Express app
const server = http.createServer(app);


// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});
app.set("io",io);
setupSocket(io);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("Firebase connected successfully");
  console.log("Socket.IO initialized successfully");
});