
const { getAuth } = require("firebase-admin/auth");
const { db } = require("../config/firebase");

const setupSocket = (io) => {
  // Keep existing application socket events.
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("join_user", (userId) => {
      if (typeof userId !== "string" || !userId.trim()) return;

      socket.join(`user:${userId.trim()}`);
    });

    socket.on("join_conversation", (conversationId) => {
      if (!conversationId) return;
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("leave_conversation", (conversationId) => {
      if (!conversationId) return;
      socket.leave(`conversation:${conversationId}`);
    });

    // Authenticate and join a meeting.
    socket.on("meeting:join", async ({ code, token } = {}) => {
      try {
        if (
          typeof code !== "string" ||
          typeof token !== "string" ||
          !code.trim() ||
          !token.trim()
        ) {
          socket.emit("meeting:error", {
            message: "Meeting code and authentication token are required.",
          });
          return;
        }

        const decoded = await getAuth().verifyIdToken(token);
        const meetingCode = code.trim().toUpperCase();

        const meetingRef = db.collection("meetings").doc(meetingCode);
        const meetingSnapshot = await meetingRef.get();

        if (!meetingSnapshot.exists) {
          socket.emit("meeting:error", {
            message: "Meeting not found.",
          });
          return;
        }

        const meeting = meetingSnapshot.data();

        if (
          meeting.status === "ended" ||
          !Array.isArray(meeting.participantIds) ||
          !meeting.participantIds.includes(decoded.uid)
        ) {
          socket.emit("meeting:error", {
            message: "You are not authorized to join this meeting.",
          });
          return;
        }

        // Prevent this socket from retaining a previous meeting membership.
        if (socket.data.meetingCode) {
          const previousRoom = `meeting:${socket.data.meetingCode}`;

          socket.to(previousRoom).emit("meeting:participant-left", {
            socketId: socket.id,
            uid: socket.data.meetingUser?.uid,
          });

          socket.leave(previousRoom);
        }

        const user = {
          uid: decoded.uid,
          name: decoded.name || decoded.email || "Participant",
          email: decoded.email || null,
        };

        const room = `meeting:${meetingCode}`;

        socket.data.meetingCode = meetingCode;
        socket.data.meetingUser = user;

        // Get existing participants before joining so the new client
        // can initiate WebRTC connections to them.
        const existingSockets = await io.in(room).fetchSockets();

        const participants = existingSockets
          .filter((peer) => peer.data.meetingUser)
          .map((peer) => ({
            ...peer.data.meetingUser,
            socketId: peer.id,
          }));

        socket.join(room);

        socket.emit("meeting:joined", {
          code: meetingCode,
          self: { ...user, socketId: socket.id },
          participants,
        });

        socket.to(room).emit("meeting:participant-joined", {
          ...user,
          socketId: socket.id,
        });

        console.log(
          `${user.name} joined meeting ${meetingCode}`
        );
      } catch (error) {
        console.error("Meeting join error:", error.message);

        socket.emit("meeting:error", {
          message: "Could not join the meeting. Please sign in again and retry.",
        });
      }
    });

    // In-call chat: only authenticated meeting participants may send.
    socket.on("meeting:chat", ({ text } = {}) => {
      const code = socket.data.meetingCode;
      const user = socket.data.meetingUser;

      if (!code || !user || typeof text !== "string" || !text.trim()) {
        return;
      }

      const message = {
        id: `${socket.id}-${Date.now()}`,
        senderId: user.uid,
        sender: user.name,
        text: text.trim().slice(0, 4000),
        timestamp: new Date().toISOString(),
      };

      io.to(`meeting:${code}`).emit("meeting:chat-message", message);
    });

    // WebRTC signaling. The destination must belong to the same room.
    const relaySignal = (eventName, payload = {}) => {
      const code = socket.data.meetingCode;
      const user = socket.data.meetingUser;
      const targetSocketId = payload.targetSocketId;

      if (!code || !user || !targetSocketId) return;

      const target = io.sockets.sockets.get(targetSocketId);

      if (
        !target ||
        target.data.meetingCode !== code ||
        !target.data.meetingUser
      ) {
        return;
      }

      target.emit(eventName, {
        fromSocketId: socket.id,
        fromUser: user,
        ...(payload.offer ? { offer: payload.offer } : {}),
        ...(payload.answer ? { answer: payload.answer } : {}),
        ...(payload.candidate
          ? { candidate: payload.candidate }
          : {}),
      });
    };

    socket.on("webrtc:offer", (payload) =>
      relaySignal("webrtc:offer", payload)
    );

    socket.on("webrtc:answer", (payload) =>
      relaySignal("webrtc:answer", payload)
    );

    socket.on("webrtc:ice-candidate", (payload) =>
      relaySignal("webrtc:ice-candidate", payload)
    );

    // Leave the current meeting.
    socket.on("meeting:leave", () => {
      leaveMeeting(socket);
    });

    socket.on("disconnect", () => {
      leaveMeeting(socket);
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

function leaveMeeting(socket) {
  const code = socket.data.meetingCode;
  const user = socket.data.meetingUser;

  if (!code) return;

  const room = `meeting:${code}`;

  socket.to(room).emit("meeting:participant-left", {
    socketId: socket.id,
    uid: user?.uid,
  });

  socket.leave(room);

  delete socket.data.meetingCode;
  delete socket.data.meetingUser;
}

module.exports = setupSocket;