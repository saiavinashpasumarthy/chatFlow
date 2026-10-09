const express = require("express");
const router = express.Router();

const {
  getUserNotifications,
  markAllNotificationsRead,
  toggleNotificationRead,
  dismissNotification,
  clearUserNotifications,
} = require("../services/notificationService");

// Temporary identity resolver.
// Uses the existing frontend user ID, but this is NOT secure for production.
// Replace it with verified authentication before deployment.
const getUserId = (req) => {
  const userId = req.headers["x-user-id"];

  return typeof userId === "string" && userId.trim()
    ? userId.trim()
    : null;
};

// GET /api/notifications
router.get("/", async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User identity is required.",
      });
    }

    const notifications = await getUserNotifications(userId);

    return res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Fetch notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications.",
    });
  }
});

// PATCH /api/notifications/read-all
router.patch("/read-all", async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User identity is required.",
      });
    }

    await markAllNotificationsRead(userId);

    return res.json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark notifications as read.",
    });
  }
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User identity is required.",
      });
    }

    const result = await toggleNotificationRead(userId, req.params.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    return res.json({
      success: true,
      notification: result,
    });
  } catch (error) {
    console.error("Toggle notification read error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update notification.",
    });
  }
});

// DELETE /api/notifications/:id
router.delete("/:id", async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User identity is required.",
      });
    }

    const deleted = await dismissNotification(userId, req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    return res.json({
      success: true,
      message: "Notification dismissed.",
    });
  } catch (error) {
    console.error("Dismiss notification error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to dismiss notification.",
    });
  }
});

// DELETE /api/notifications
router.delete("/", async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User identity is required.",
      });
    }

    await clearUserNotifications(userId);

    return res.json({
      success: true,
      message: "All notifications cleared.",
    });
  } catch (error) {
    console.error("Clear notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to clear notifications.",
    });
  }
});

module.exports = router;