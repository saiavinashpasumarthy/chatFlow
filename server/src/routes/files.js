const express = require("express");
const upload = require("../middleware/upload");
const { requireAuth } = require("../middleware/authMiddleware");
const { uploadToCloudinary } = require("../services/cloudinaryService");

const router = express.Router();

router.post(
  "/upload",
  requireAuth,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "No file uploaded",
        });
      }

      const result = await uploadToCloudinary(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      res.status(200).json({
        message: "File uploaded successfully",
        file: result,
      });
    } catch (error) {
      console.error("Cloudinary upload error:", error);

      res.status(500).json({
        message: "File upload failed",
        error: error.message,
      });
    }
  }
);

module.exports = router;