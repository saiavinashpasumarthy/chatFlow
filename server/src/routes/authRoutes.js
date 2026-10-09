const express = require("express");
const { db } = require("../config/firebase");
const { requireAuth } = require("../middleware/authMiddleware");
const {
  createUserProfile,
  getUserById,
} = require("../services/userService");

const router = express.Router();

router.post("/profile", requireAuth, async (req, res) => {
  try {
    const { uid, email, name } = req.user;
    const { department = "" } = req.body;

    const user = await createUserProfile({
      uid,
      email,
      name: name || email?.split("@")[0] || "User",
      department,
    });

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Create profile error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create user profile",
    });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await getUserById(req.user.uid);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
    });
  }
});

/*
 * Get all registered users except the currently logged-in user.
 * These users are used by the Contacts page.
 */
router.get("/users", requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.uid;

    const snapshot = await db.collection("users").get();

    const users = snapshot.docs
      .filter((doc) => doc.id !== currentUserId)
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
});

module.exports = router;
