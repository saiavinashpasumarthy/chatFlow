const express = require("express");
const cors = require("cors");
const healthRoutes = require("./routes/health.routes")
const app = express();

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

module.exports = app;