
const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const { db } = require("../config/firebase");
const upload = require("../middleware/fileUpload");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();
const uploadDirectory = path.join(__dirname, "../../uploads");
const filesCollection = db.collection("files");

function formatFile(id, data) {
  return {
    id,
    name: data.originalName,
    sizeBytes: data.size,
    type: data.type,
    mimeType: data.mimeType,
    date: data.createdAt,
    updatedAt: data.createdAt,
    sharedBy: data.uploaderName || data.uploaderEmail || "You",
    relatedContext: null,
    downloadUrl: `/api/files/${id}/download`,
  };
}

function getFileType(filename, mimeType = "") {
  const ext = path.extname(filename).toLowerCase();

  if ([".fig", ".sketch", ".psd", ".ai"].includes(ext)) {
    return "design";
  }

  if (
    [".js", ".jsx", ".ts", ".tsx", ".json", ".md",
      ".html", ".css", ".py", ".java", ".c", ".cpp"].includes(ext)
  ) {
    return "code";
  }

  if (mimeType.startsWith("image/")) return "image";

  if (
    mimeType.startsWith("video/") ||
    mimeType.startsWith("audio/")
  ) {
    return "media";
  }

  return "document";
}

// List the current user's files
router.get("/", requireAuth, async (req, res) => {
  try {
    const snapshot = await filesCollection
      .where("ownerId", "==", req.user.uid)
      .get();

    const files = snapshot.docs
      .map((doc) => formatFile(doc.id, doc.data()))
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
      );

    res.json({ success: true, files });
  } catch (error) {
    console.error("List files error:", error);
    res.status(500).json({
      success: false,
      message: "Could not load files.",
    });
  }
});

// Upload a file to local backend storage
router.post(
  "/upload",
  requireAuth,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Choose a file to upload.",
        });
      }

      const metadata = {
        ownerId: req.user.uid,
        originalName: req.file.originalname,
        storageName: req.file.filename,
        mimeType:
          req.file.mimetype || "application/octet-stream",
        size: req.file.size,
        type: getFileType(
          req.file.originalname,
          req.file.mimetype
        ),
        uploaderName: req.user.name || null,
        uploaderEmail: req.user.email || null,
        createdAt: new Date().toISOString(),
      };

      const docRef = await filesCollection.add(metadata);

      res.status(201).json({
        success: true,
        message: "File uploaded successfully.",
        file: formatFile(docRef.id, metadata),
      });
    } catch (error) {
      if (req.file?.path) {
        await fs.unlink(req.file.path).catch(() => {});
      }

      console.error("File upload error:", error);
      res.status(500).json({
        success: false,
        message: "File upload failed.",
      });
    }
  }
);

// Download only if the authenticated user owns the file
router.get("/:id/download", requireAuth, async (req, res) => {
  try {
    const snapshot = await filesCollection
      .doc(req.params.id)
      .get();

    if (
      !snapshot.exists ||
      snapshot.data().ownerId !== req.user.uid
    ) {
      return res.status(404).json({
        success: false,
        message: "File not found.",
      });
    }

    const metadata = snapshot.data();
    const filePath = path.join(
      uploadDirectory,
      path.basename(metadata.storageName)
    );

    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        message: "Stored file is missing from the server.",
      });
    }

    return res.download(filePath, metadata.originalName);
  } catch (error) {
    console.error("File download error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not download file.",
    });
  }
});

// Delete both the stored file and its Firestore metadata
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const docRef = filesCollection.doc(req.params.id);
    const snapshot = await docRef.get();

    if (
      !snapshot.exists ||
      snapshot.data().ownerId !== req.user.uid
    ) {
      return res.status(404).json({
        success: false,
        message: "File not found.",
      });
    }

    const metadata = snapshot.data();
    const filePath = path.join(
      uploadDirectory,
      path.basename(metadata.storageName)
    );

    await fs.unlink(filePath).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });

    await docRef.delete();

    res.json({
      success: true,
      message: "File deleted successfully.",
    });
  } catch (error) {
    console.error("File delete error:", error);
    res.status(500).json({
      success: false,
      message: "Could not delete file.",
    });
  }
});

module.exports = router;