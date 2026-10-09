const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB
  },
  fileFilter: (req, file, cb) => {
    if (!file.originalname) {
      return cb(new Error("A valid filename is required."));
    }

    cb(null, true);
  },
});

module.exports = upload;
