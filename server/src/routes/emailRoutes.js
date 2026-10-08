const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const { sendEmail } = require("../services/emailService");
const { db } = require("../config/firebase");

const router = express.Router();

router.post("/send", requireAuth, async (req, res) => {
  try {
    const { to, subject, body } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: "To, subject, and body are required",
      });
    }

    const email = await sendEmail({
      senderId: req.user.uid,
      senderEmail: req.user.email,
      senderName: req.user.name,
      to,
      subject,
      body,
    });

    res.status(201).json({
      success: true,
      message: "Email sent successfully",
      email,
    });
  } catch (error) {
    console.error("Send email error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to send email",
    });
  }
});

router.get("/sent", requireAuth, async (req, res) => {
  try {
    const snapshot = await db
      .collection("emails")
      .where("senderId", "==", req.user.uid)
      .get();

    const emails = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;

        return timeB - timeA;
      });

    res.status(200).json({
      success: true,
      emails,
    });
  } catch (error) {
    console.error("Get sent emails error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch sent emails",
    });
  }
});

module.exports = router;