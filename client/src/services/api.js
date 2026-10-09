
import { auth } from "../config/firebase";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export const apiRequest = async (endpoint, options = {}) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not logged in");
  }

  const token = await user.getIdToken();

  const headers = {
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  // JSON requests use application/json.
  // FormData requests must let the browser set Content-Type automatically.
  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  } else if (!headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });


const responseText = await response.text();

let data;

try {
  data = JSON.parse(responseText);
} catch {
  console.error("API returned non-JSON response:", {
    endpoint,
    status: response.status,
    response: responseText.slice(0, 500),
  });

  throw new Error(
    `Expected JSON from ${endpoint}, but received a non-JSON response (HTTP ${response.status}). Check the browser console.`
  );
}

  if (!response.ok) {
    throw new Error(data.message || "API request failed");
  }

  return data;
};

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

// Upload a file to the backend, which uploads it to Cloudinary.
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest("/api/files/upload", {
    method: "POST",
    body: formData,
  });
};