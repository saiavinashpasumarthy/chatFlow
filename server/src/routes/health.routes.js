const express = require("express");
const { db } = require("../config/firebase");

const router = express.Router();

router.get("/firebase", async (req, res) => {
  try {
    await db.collection("_health").doc("connection").set({
      status: "connected",
      checkedAt: new Date(),
    });

    res.json({
      success: true,
      message: "Firestore connection successful",
    });
  } catch (error) {
    console.error("Firestore connection error:", error);

    res.status(500).json({
      success: false,
      message: "Firestore connection failed",
    });
  }
});

module.exports = router;