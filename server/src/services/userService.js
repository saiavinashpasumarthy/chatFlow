const { db } = require("../config/firebase");
const { serverTimestamp } = require("../utils/firestore");

const usersCollection = db.collection("users");

const createUserProfile = async ({
  uid,
  name,
  email,
}) => {
  const userRef = usersCollection.doc(uid);

  const existingUser = await userRef.get();

  if (existingUser.exists) {
    return {
      id: uid,
      ...existingUser.data(),
    };
  }

  const userData = {
    name,
    email,
    avatarUrl: "",
    role: "user",
    department: "",
    location: "",
    bio: "",
    status: "offline",
    isOnline: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await userRef.set(userData);

  return {
    id: uid,
    ...userData,
  };
};

const getUserById = async (uid) => {
  const snapshot = await usersCollection.doc(uid).get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
};

module.exports = {
  createUserProfile,
  getUserById,
};