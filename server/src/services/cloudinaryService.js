const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = (fileBuffer, originalName, mimeType) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: "chatflow",
        public_id: `${Date.now()}-${originalName.replace(/\.[^/.]+$/, "")}`,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

module.exports = {
  uploadToCloudinary,
};