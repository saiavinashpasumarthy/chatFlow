const { google } = require("googleapis");
const { oauth2Client } = require("../config/gmail");

const getGmailMessages = async () => {
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
        metadataHeaders: ["From", "To", "Subject", "Date"],
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

module.exports = { getGmailMessages };