
import { auth } from "../config/firebase";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const getAuthHeaders = async () => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not logged in");
  }

  const token = await user.getIdToken();

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const apiRequest = async (endpoint, options = {}) => {
  const headers = {
    ...(options.body instanceof FormData
      ? {}
      : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
    ...(await getAuthHeaders()),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const responseText = await response.text();
  let data;

  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Invalid API response from ${endpoint} (HTTP ${response.status})`
    );
  }

  if (!response.ok) {
    throw new Error(data.message || "API request failed");
  }

  return data;
};

// Existing chat APIs — preserved.
export const getChats = async () => {
  return apiRequest("/api/chats");
};

export const getMessages = async (conversationId) => {
  return apiRequest(`/api/chats/${conversationId}/messages`);
};

export const sendMessage = async (conversationId, messageData) => {
  return apiRequest(`/api/chats/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify(messageData),
  });
};

export const createConversation = async (conversationData) => {
  return apiRequest("/api/chats", {
    method: "POST",
    body: JSON.stringify(conversationData),
  });
};

export const getUsers = async () => {
  return apiRequest("/api/auth/users");
};

// Files APIs — use the local backend storage.
export const getFiles = async () => {
  return apiRequest("/api/files",{
  cache:"no-store",
  });
};

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest("/api/files/upload", {
    method: "POST",
    body: formData,
  });
};

export const deleteFile = async (fileId) => {
  return apiRequest(`/api/files/${encodeURIComponent(fileId)}`, {
    method: "DELETE",
  });
};

export const downloadFile = async (fileId, fileName) => {
  const headers = await getAuthHeaders();

  const response = await fetch(
    `${API_URL}/api/files/${encodeURIComponent(fileId)}/download`,
    { headers }
  );

  if (!response.ok) {
    let message = "File download failed.";

    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = fileName || "download";
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(objectUrl);
};