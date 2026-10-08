const express = require("express");
const crypto = require("crypto");
const { google } = require("googleapis");
const { getAuth } = require("firebase-admin/auth");
const { db } = require("../config/firebase");
const { oauth2Client } = require("../config/gmail");
const { getGmailMessages } = require("../services/gmailService");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
];

const createOAuthState = (uid) => {
  const signature = crypto
    .createHmac("sha256", process.env.GMAIL_CLIENT_SECRET)
    .update(uid)
    .digest("hex");

  return `${uid}.${signature}`;
};

const verifyOAuthState = (state) => {
  if (!state || !state.includes(".")) {
    return null;
  }

  const [uid, signature] = state.split(".");

  if (!uid || !signature) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.GMAIL_CLIENT_SECRET)
    .update(uid)
    .digest("hex");

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );

  return isValid ? uid : null;
};

/*
 * Start Gmail OAuth for the currently logged-in Relay user.
 */
router.get("/auth", requireAuth, (req, res) => {
  try {
    const state = createOAuthState(req.user.uid);

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      prompt: "consent",
      state,
    });

    res.json({
      success: true,
      authUrl,
    });
  } catch (error) {
    console.error("Gmail OAuth start error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to start Gmail authorization",
    });
  }
});

/*
 * Gmail OAuth callback.
 */
router.get("/callback", async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).send("Authorization code is missing");
    }

    const uid = verifyOAuthState(state);

    if (!uid) {
      return res.status(400).send("Invalid OAuth state");
    }

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return res.status(400).send(
        "No Gmail refresh token was returned. Please authorize Gmail again."
      );
    }

    /*
     * Store the Gmail refresh token against this Relay user's
     * Firestore profile.
     */
    await db.collection("users").doc(uid).set(
      {
        gmailConnected: true,
        gmailRefreshToken: tokens.refresh_token,
        gmailConnectedAt: new Date(),
      },
      { merge: true }
    );

    console.log(`Gmail OAuth authorization successful for user ${uid}`);

    res.send(
      "Gmail connected successfully. You can close this window and return to Relay."
    );
  } catch (error) {
    console.error("Gmail OAuth callback error:", error);

    res.status(500).send("Failed to connect Gmail");
  }
});

/*
 * Get Gmail messages for the currently logged-in Relay user.
 */
router.get("/messages", requireAuth, async (req, res) => {
  try {
    const messages = await getGmailMessages(req.user.uid);

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Gmail messages error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch Gmail messages",
    });
  }
});

module.exports = router;
