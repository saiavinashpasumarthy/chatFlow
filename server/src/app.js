const express = require("express");
const cors = require("cors");
const healthRoutes = require("./routes/health.routes")
const authRoutes = require("./routes/authRoutes")
const app = express();
const emailRoutes = require("./routes/emailRoutes");
const gmailRoutes = require("./routes/gmailRoutes");
const chatRoutes = require("./routes/chatRoutes");
const filesRoutes = require("./routes/files")

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "ChatFlow server is running",
  });
});
app.use("/api/health", healthRoutes)
app.use("/api/auth", authRoutes);
app.use("/api/emails",emailRoutes);
app.use("/api/gmail",gmailRoutes);
app.use("/api/chats",chatRoutes);
app.use("/api/files",filesRoutes);

module.exports = app;