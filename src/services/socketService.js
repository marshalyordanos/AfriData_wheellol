import { io } from "socket.io-client";

const SOCKET_URL = "http://134.209.59.98:4004";

class SocketService {
  socket = null;

  connect(userId, onConnect, onDisconnect) {
    if (!userId) {
      console.log("⚠️ No user ID provided to connect socket");
      return;
    }

    if (this.socket?.connected) {
      console.log("⚡️ Socket already connected:", this.socket.id);
      return;
    }

    console.log("🔌 Creating socket for user:", userId);

    this.socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      // auth: { token: userId }, // optional for JWT
    });

    this.socket.on("connect", () => {
      console.log("✅ Socket connected:", this.socket.id);
      this.socket.emit("register", userId);
      onConnect && onConnect();
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
      onDisconnect && onDisconnect();
    });

    // this.socket.on("connect_error", (err) => {
    //   console.log("⚠️ Socket connection error:", JSON.stringify(err, null, 2));
    // });///////////
  }

  disconnect() {
    if (this.socket) {
      console.log("🔌 Socket disconnected manually");
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinBooking(bookingId) {
    this.socket?.emit("join_booking", bookingId);
  }

  emit(event, data) {
    this.socket?.emit(event, data);
  }

  on(event, callback) {
    this.socket?.on(event, callback);
  }

  off(event) {
    this.socket?.off(event);
  }
}

export default new SocketService();
