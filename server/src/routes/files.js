const express = require("express");
const path = require("path");
const { db } = require("../config/firebase");
const upload = require("../middleware/fileUpload");
const { requireAuth } = require("../middleware/authMiddleware");
const { cloudinary } = require("../config/cloudinary");

const router = express.Router();
const filesCollection = db.collection("files");

function formatFile(id, data) {
  const originalName = data.originalName || "download";
  const fileUrl = data.url || null;

  return {
    id,
    name: originalName,
    originalName,
    sizeBytes: data.size || 0,
    type: data.type || "file",
    mimeType: data.mimeType || "application/octet-stream",
    date: data.createdAt,
    updatedAt: data.updatedAt || data.createdAt,
    sharedBy: data.uploaderName || data.uploaderEmail || "You",
    relatedContext: null,

    url: fileUrl,
    secure_url: fileUrl,
    publicId: data.publicId || null,
    resourceType: data.resourceType || null,
    format: data.format || null,

    // Use the backend download route to preserve the original filename.
    downloadUrl: `/api/files/${id}/download`,
  };
}

function getFileType(filename, mimeType = "") {
  const ext = path.extname(filename).toLowerCase();

  if ([".fig", ".sketch", ".psd", ".ai"].includes(ext)) {
    return "design";
  }

  if (
    [
      ".js", ".jsx", ".ts", ".tsx", ".json", ".md",
      ".html", ".css", ".py", ".java", ".c", ".cpp",
    ].includes(ext)
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

    const file = snapshot.data();

    if (!file.url) {
      return res.status(404).json({
        success: false,
        message: "File URL is unavailable.",
      });
    }

    const originalName = file.originalName || "download";
    const safeName = originalName.replace(/["\r\n]/g, "_");

    // Tell Cloudinary to deliver the file as an attachment
    // and preserve the original filename.
    const downloadUrl = new URL(file.url);
    downloadUrl.searchParams.set("fl_attachment", safeName);

    return res.redirect(downloadUrl.toString());
  } catch (error) {
    console.error("File download error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not download file.",
    });
  }
});


// Upload to Cloudinary and save metadata in Firestore
router.post(
  "/upload",
  requireAuth,
  upload.single("file"),
  async (req, res) => {
    let cloudinaryResult;

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Choose a file to upload.",
        });
      }

      // fileUpload middleware must provide the file buffer.
      if (!req.file.buffer) {
        return res.status(400).json({
          success: false,
          message:
            "Upload middleware must use memoryStorage for Cloudinary uploads.",
        });
      }

      const resourceType = req.file.mimetype.startsWith("image/")
        ? "image"
        : req.file.mimetype.startsWith("video/") ||
          req.file.mimetype.startsWith("audio/")
        ? "video"
        : "raw";
const path = require("path");

// Inside the upload route:
const originalName = req.file.originalname || "download";
const parsedName = path.parse(originalName);

cloudinaryResult = await new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    {
      folder: "chatflow/files",
      resource_type: resourceType,
      public_id: `${Date.now()}-${parsedName.name}`,
      use_filename: true,
      unique_filename: true,
      ...(resourceType === "raw" && parsedName.ext
        ? { format: parsedName.ext.slice(1) }
        : {}),
    },
    (error, result) => {
      if (error) return reject(error);
      resolve(result);
    }
  );

  stream.end(req.file.buffer);
});

      if (!cloudinaryResult?.secure_url) {
        throw new Error("Cloudinary did not return a secure URL.");
      }

      const metadata = {
        ownerId: req.user.uid,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype || "application/octet-stream",
        size: req.file.size,
        type: getFileType(req.file.originalname, req.file.mimetype),
        uploaderName: req.user.name || null,
        uploaderEmail: req.user.email || null,
        createdAt: new Date().toISOString(),
        url: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id,
        resourceType: cloudinaryResult.resource_type,
        format: cloudinaryResult.format || null,
      };

      const docRef = await filesCollection.add(metadata);
      const file = formatFile(docRef.id, metadata);

      // ChatPage.jsx can now use response.file.url.
      return res.status(201).json({
        success: true,
        message: "File uploaded successfully.",
        file,
      });
    } catch (error) {
      // If Cloudinary succeeded but Firestore failed, clean up the upload.
      if (cloudinaryResult?.public_id) {
        await cloudinary.uploader
          .destroy(cloudinaryResult.public_id, {
            resource_type: cloudinaryResult.resource_type || "raw",
          })
          .catch((cleanupError) => {
            console.error("Cloudinary cleanup error:", cleanupError);
          });
      }

      console.error("File upload error:", error);

      return res.status(500).json({
        success: false,
        message: "File upload failed.",
      });
    }
  }
);

// Download/redirect to the Cloudinary file if the user owns it
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

    const file = snapshot.data();

    if (!file.url) {
      return res.status(404).json({
        success: false,
        message: "File URL is unavailable.",
      });
    }

    return res.redirect(file.url);
  } catch (error) {
    console.error("File download error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not download file.",
    });
  }
});

// Delete Cloudinary file and its Firestore metadata
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

    const file = snapshot.data();

    if (file.publicId) {
      await cloudinary.uploader.destroy(file.publicId, {
        resource_type: file.resourceType || "raw",
      });
    }

    await docRef.delete();

    return res.json({
      success: true,
      message: "File deleted successfully.",
    });
  } catch (error) {
    console.error("File delete error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not delete file.",
    });
  }
});

module.exports = router;
