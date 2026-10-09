const express = require("express");
const { getAuth } = require("firebase-admin/auth");
const { db } = require("../config/firebase");
const { requireAuth } = require("../middleware/authMiddleware");
const { createNotification } = require("../services/notificationService");

const router = express.Router();

/*
  GET /api/chats
  Get all conversations for the logged-in user.
*/
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;

    const snapshot = await db
      .collection("conversations")
      .where("memberIds", "array-contains", userId)
      .orderBy("updatedAt", "desc")
      .get();

    const conversations = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("Get conversations error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
    });
  }
});

/*
  POST /api/chats
  Create a new conversation or reuse an existing direct conversation.
*/
router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { memberEmail, type = "direct", name = "" } = req.body;

    if (!memberEmail) {
      return res.status(400).json({
        success: false,
        message: "Member email is required",
      });
    }

    let targetUser;

    try {
      targetUser = await getAuth().getUserByEmail(memberEmail);
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        return res.status(404).json({
          success: false,
          message: "User with this email does not exist",
        });
      }

      throw error;
    }

    const targetUserId = targetUser.uid;

    if (targetUserId === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot start a conversation with yourself",
      });
    }

    const memberIds = [...new Set([userId, targetUserId])];

    if (type === "direct") {
      const snapshot = await db
        .collection("conversations")
        .where("memberIds", "array-contains", userId)
        .get();

      const existingConversation = snapshot.docs.find((doc) => {
        const data = doc.data();

        return (
          data.type === "direct" &&
          Array.isArray(data.memberIds) &&
          data.memberIds.length === 2 &&
          memberIds.every((id) => data.memberIds.includes(id))
        );
      });

      if (existingConversation) {
        return res.json({
          success: true,
          conversation: {
            id: existingConversation.id,
            ...existingConversation.data(),
          },
          existing: true,
        });
      }
    }

    const now = new Date();

    const conversationRef = await db.collection("conversations").add({
      type,
      name: name || targetUser.displayName || targetUser.email,
      memberIds,
      memberDetails: [
        {
          uid: userId,
          email: req.user.email,
          name: req.user.name || req.user.email,
        },
        {
          uid: targetUserId,
          email: targetUser.email,
          name: targetUser.displayName || targetUser.email,
        },
      ],
      lastMessage: "",
      updatedAt: now,
      createdAt: now,
    });

    const conversationDoc = await conversationRef.get();

    return res.status(201).json({
      success: true,
      conversation: {
        id: conversationDoc.id,
        ...conversationDoc.data(),
      },
      existing: false,
    });
  } catch (error) {
    console.error("Create conversation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create conversation",
    });
  }
});

/*
  GET /api/chats/:conversationId/messages
  Get all messages from a conversation.
*/
router.get("/:conversationId/messages", requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { conversationId } = req.params;

    const conversationRef = db
      .collection("conversations")
      .doc(conversationId);

    const conversationDoc = await conversationRef.get();

    if (!conversationDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const conversation = conversationDoc.data();

    if (!conversation.memberIds?.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this conversation",
      });
    }

    const snapshot = await conversationRef
      .collection("messages")
      .orderBy("createdAt", "asc")
      .get();

    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Get messages error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
    });
  }
});

/*
  POST /api/chats/:conversationId/messages
  Send a message with optional Cloudinary attachment metadata.
  Notify other conversation members after saving the message.
*/
router.post(
  "/:conversationId/messages",
  requireAuth,
  async (req, res) => {
    try {
      const userId = req.user.uid;
      const { conversationId } = req.params;
      const { content = "", attachment = null } = req.body;

      if (
        typeof content !== "string" ||
        (!content.trim() && !attachment)
      ) {
        return res.status(400).json({
          success: false,
          message: "Message content or attachment is required",
        });
      }

      const conversationRef = db
        .collection("conversations")
        .doc(conversationId);

      const conversationDoc = await conversationRef.get();

      if (!conversationDoc.exists) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found",
        });
      }

      const conversation = conversationDoc.data();

      if (
        !Array.isArray(conversation.memberIds) ||
        !conversation.memberIds.includes(userId)
      ) {
        return res.status(403).json({
          success: false,
          message: "You are not a member of this conversation",
        });
      }

      const now = new Date();
      const trimmedContent = content.trim();
      const senderName =
        req.user.name || req.user.email || "Someone";

      const messageData = {
        conversationId,
        senderId: userId,
        senderEmail: req.user.email || null,
        senderName,
        content: trimmedContent,
        attachment: attachment || null,
        createdAt: now,
      };

      // Save the message first.
      const messageRef = await conversationRef
        .collection("messages")
        .add(messageData);

      const lastMessage = trimmedContent
        ? trimmedContent
        : `📎 ${attachment.name || "Attachment"}`;

      await conversationRef.update({
        lastMessage,
        updatedAt: now,
      });

      // Notify other members without failing the message request
      // if notification creation encounters a problem.
      const io = req.app.get("io");

      const recipientIds = conversation.memberIds.filter(
        (memberId) => memberId !== userId
      );

      const notificationDescription = trimmedContent
        ? trimmedContent
        : `Sent an attachment: ${attachment.name || "Attachment"}`;

      const notificationResults = await Promise.allSettled(
        recipientIds.map((recipientId) =>
          createNotification(io, {
            userId: recipientId,
            title: `${senderName} sent you a message`,
            description: notificationDescription,
            type: "chat",
            targetTab: "chats",
            targetConvId: conversationId,
          })
        )
      );

      notificationResults.forEach((result) => {
        if (result.status === "rejected") {
          console.error(
            "Failed to create chat notification:",
            result.reason
          );
        }
      });

      return res.status(201).json({
        success: true,
        message: {
          id: messageRef.id,
          ...messageData,
        },
      });
    } catch (error) {
      console.error("Send message error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to send message",
      });
    }
  }
);

module.exports = router;
