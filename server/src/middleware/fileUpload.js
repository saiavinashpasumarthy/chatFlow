
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const uploadDirectory = path.join(__dirname, "../../uploads");

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDirectory);
  },
  filename: (_req, _file, callback) => {
    callback(null, crypto.randomUUID());
  },
});

module.exports = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});