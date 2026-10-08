const express = require("express");
const { oauth2Client } = require("../config/gmail");
const {google}= require("googleapis");
const router = express.Router();
const {getGmailMessages}=require("../services/gmailService");
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
];

router.get("/auth", (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });

  res.redirect(authUrl);
});
router.get("/callback", async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).send("Authorization code is missing");
    }

    const { tokens } = await oauth2Client.getToken(code);

    oauth2Client.setCredentials(tokens);

    console.log("Gmail OAuth authorization successful");

    if (tokens.refresh_token) {
      console.log("Gmail refresh token received:");
      console.log(tokens.refresh_token);
    } else {
      console.log("No refresh token received");
    }

    res.send("Gmail connected successfully. You can close this window.");
  } catch (error) {
    console.error("Gmail OAuth callback error:", error);

    res.status(500).send("Failed to connect Gmail");
  }
});
router.get("/messages", async (req, res) => {
  try {
    const messages = await getGmailMessages();

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Gmail messages error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch Gmail messages",
    });
  }
});
module.exports = router;