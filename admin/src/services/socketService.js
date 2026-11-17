import { io } from "socket.io-client";
import api from "../api/api";
import TokenService from "../api/token.service";

// Socket server (notify-hub). Set VITE_SOCKET_URL to override.
// Local API (localhost:3000) → local notify-hub on :4004, otherwise production.
const isLocalApi = /localhost|127\.0\.0\.1/.test(api.defaults.baseURL || "");
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (isLocalApi ? "http://localhost:4004" : "https://socket.wheellol.com");
// const SOCKET_URL = "https://socket.wheellol.com";

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
      reconnectionDelayMax: 10000,
      // Fresh token on every (re)connect → server joins the user's room itself
      auth: (cb) => cb({ token: TokenService.getLocalAccessToken() }),
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

  off(event, callback) {
    if (callback) this.socket?.off(event, callback);
    else this.socket?.off(event);
  }
}

export default new SocketService();
