const { FieldValue } = require("firebase-admin/firestore");

const serverTimestamp = () => FieldValue.serverTimestamp();

module.exports = {
  serverTimestamp,
};