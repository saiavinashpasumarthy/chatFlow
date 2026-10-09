const { db } = require("../config/firebase");
const { FieldValue } = require("firebase-admin/firestore");

const NOTIFICATIONS_COLLECTION = "notifications";

const getUserRoom = (userId) => `user:${userId}`;

const formatNotification = (doc) => {
  const data = doc.data();
  const createdAt = data.createdAt?.toDate
    ? data.createdAt.toDate()
    : new Date();

  return {
    id: doc.id,
    title: data.title,
    description: data.description,
    type: data.type || "system",
    read: Boolean(data.read),
    targetTab: data.targetTab || null,
    targetEmailId: data.targetEmailId || null,
    targetConvId: data.targetConvId || null,
    createdAt: createdAt.toISOString(),
    timestamp: createdAt.toLocaleString(),
  };
};

// Create and broadcast a notification.
const createNotification = async (io, notification) => {
  const {
    userId,
    title,
    description,
    type = "system",
    targetTab = null,
    targetEmailId = null,
    targetConvId = null,
  } = notification;

  if (!userId || !title || !description) {
    throw new Error(
      "userId, title, and description are required to create a notification."
    );
  }

  if (!["email", "chat", "system"].includes(type)) {
    throw new Error("Notification type must be email, chat, or system.");
  }

  const docRef = await db.collection(NOTIFICATIONS_COLLECTION).add({
    userId: String(userId),
    title,
    description,
    type,
    read: false,
    targetTab,
    targetEmailId,
    targetConvId,
    createdAt: FieldValue.serverTimestamp(),
  });

  const savedDoc = await docRef.get();
  const savedNotification = formatNotification(savedDoc);

  // Only sockets in this user's room receive the notification.
  if (io) {
    io.to(getUserRoom(String(userId))).emit(
      "notification:new",
      savedNotification
    );
  }

  return savedNotification;
};

// Retrieve notifications belonging to one user.
const getUserNotifications = async (userId) => {
  if (!userId) {
    throw new Error("userId is required.");
  }

  const snapshot = await db
    .collection(NOTIFICATIONS_COLLECTION)
    .where("userId", "==", String(userId))
    .get();

  return snapshot.docs
    .map(formatNotification)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

// Mark all unread notifications as read.
const markAllNotificationsRead = async (userId) => {
  if (!userId) {
    throw new Error("userId is required.");
  }

  const snapshot = await db
    .collection(NOTIFICATIONS_COLLECTION)
    .where("userId", "==", String(userId))
    .where("read", "==", false)
    .get();

  if (snapshot.empty) return;

  const batch = db.batch();

  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { read: true });
  });

  await batch.commit();
};

// Toggle the read status of a notification belonging to this user.
const toggleNotificationRead = async (userId, notificationId) => {
  if (!userId || !notificationId) {
    throw new Error("userId and notificationId are required.");
  }

  const docRef = db
    .collection(NOTIFICATIONS_COLLECTION)
    .doc(notificationId);

  return db.runTransaction(async (transaction) => {
    const doc = await transaction.get(docRef);

    if (!doc.exists || doc.data().userId !== String(userId)) {
      return null;
    }

    const read = !Boolean(doc.data().read);

    transaction.update(docRef, { read });

    return { id: doc.id, read };
  });
};

// Delete one notification belonging to this user.
const dismissNotification = async (userId, notificationId) => {
  if (!userId || !notificationId) {
    throw new Error("userId and notificationId are required.");
  }

  const docRef = db
    .collection(NOTIFICATIONS_COLLECTION)
    .doc(notificationId);

  const doc = await docRef.get();

  if (!doc.exists || doc.data().userId !== String(userId)) {
    return false;
  }

  await docRef.delete();
  return true;
};

// Delete all notifications belonging to one user.
const clearUserNotifications = async (userId) => {
  if (!userId) {
    throw new Error("userId is required.");
  }

  const snapshot = await db
    .collection(NOTIFICATIONS_COLLECTION)
    .where("userId", "==", String(userId))
    .get();

  // Firestore batches support up to 500 writes.
  for (let i = 0; i < snapshot.docs.length; i += 500) {
    const batch = db.batch();

    snapshot.docs.slice(i, i + 500).forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAllNotificationsRead,
  toggleNotificationRead,
  dismissNotification,
  clearUserNotifications,
};