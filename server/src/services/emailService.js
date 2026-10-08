const { db } = require("../config/firebase");
const transporter = require("../config/mail");
const { Timestamp } = require("firebase-admin/firestore");

const sendEmail = async ({
  senderId,
  senderEmail,
  senderName,
  to,
  subject,
  body,
}) => {
  const emailRef = db.collection("emails").doc();

  const emailData = {
    senderId,
    senderEmail,
    senderName: senderName || "",
    to,
    subject,
    body,
    status: "pending",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await emailRef.set(emailData);

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text: body,
    });

    await emailRef.update({
      status: "sent",
      updatedAt: Timestamp.now(),
    });

    return {
      id: emailRef.id,
      ...emailData,
      status: "sent",
    };
  } catch (error) {
    await emailRef.update({
      status: "failed",
      error: error.message,
      updatedAt: Timestamp.now(),
    });

    throw error;
  }
};

module.exports = {
  sendEmail,
};