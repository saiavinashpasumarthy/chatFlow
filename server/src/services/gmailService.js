const { google } = require("googleapis");
const { db } = require("../config/firebase");
const { createGmailOAuthClient } = require("../config/gmail");

const getGmailMessages = async (uid) => {
  if (!uid) {
    throw new Error("User ID is required");
  }

  const userSnapshot = await db
    .collection("users")
    .doc(uid)
    .get();

  if (!userSnapshot.exists) {
    throw new Error("User profile not found");
  }

  const userData = userSnapshot.data();

  if (!userData.gmailRefreshToken) {
    throw new Error(
      "Gmail account is not connected. Please connect Gmail first."
    );
  }

  const oauth2Client = createGmailOAuthClient(
    userData.gmailRefreshToken
  );

  const gmail = google.gmail({
    version: "v1",
    auth: oauth2Client,
  });

  const response = await gmail.users.messages.list({
    userId: "me",
    maxResults: 20,
    q: "in:inbox",
  });

  const messages = response.data.messages || [];

  const detailedMessages = await Promise.all(
    messages.map(async (message) => {
      const result = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
        format: "metadata",
        metadataHeaders: [
          "From",
          "To",
          "Subject",
          "Date",
        ],
      });

      const headers = result.data.payload?.headers || [];

      const getHeader = (name) =>
        headers.find(
          (header) =>
            header.name.toLowerCase() === name.toLowerCase()
        )?.value || "";

      return {
        id: result.data.id,
        threadId: result.data.threadId,
        from: getHeader("From"),
        to: getHeader("To"),
        subject: getHeader("Subject") || "(No Subject)",
        date: getHeader("Date"),
        snippet: result.data.snippet || "",
      };
    })
  );

  return detailedMessages;
};

module.exports = {
  getGmailMessages,
};
