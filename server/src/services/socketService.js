const setupSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("join_conversation", (conversationId) => {
      if (!conversationId) return;

      socket.join(`conversation:${conversationId}`);

      console.log(
        `Socket ${socket.id} joined conversation:${conversationId}`
      );
    });

    socket.on("leave_conversation", (conversationId) => {
      if (!conversationId) return;

      socket.leave(`conversation:${conversationId}`);

      console.log(
        `Socket ${socket.id} left conversation:${conversationId}`
      );
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = setupSocket;