import { io } from "socket.io-client";
import { usePostStore } from "../Store/PostStore.js";
import { useFriendStore } from "../Store/FriendStore.js";
import { useChatStore } from "../Store/ChatStore.js";
import { useCallStore } from "../Store/CallStore.js";

let socket = null;

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

export const connectSocket = (userId) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("🟢 Socket connected:", socket.id);

      // Register user with server
      if (userId) {
        socket.emit("register", userId);
        console.log("📝 Registered user:", userId);
      }
    });

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected");
    });

    // Listen for new likes
    socket.on("new-like", (data) => {
      console.log("❤️ New like notification:", data);
      // You can show a toast notification here
      // For now, just log it
    });

    // Listen for new comments
    socket.on("new-comment", (data) => {
      console.log("💬 New comment notification:", data);
      // Optionally update the post's comments in store
      const { fetchComments } = usePostStore.getState();
      if (data.postId) {
        fetchComments(data.postId);
      }
    });

    // Listen for friend requests
    socket.on("friend-request", (data) => {
      console.log("👋 New friend request:", data);
      // Update friend store with new request
      const { fetchReceivedRequests } = useFriendStore.getState();
      fetchReceivedRequests();
    });

    // Listen for accepted friend requests
    socket.on("friend-accepted", (data) => {
      console.log("✅ Friend request accepted:", data);
      // Update friend store
      const { fetchFriends, fetchSentRequests } = useFriendStore.getState();
      fetchFriends();
      fetchSentRequests();
    });

    // Listen for new chat messages
    socket.on("new-message", (data) => {
      console.log("💬 New message received:", data);
      const { receiveMessage } = useChatStore.getState();
      receiveMessage(data);
    });

    // Listen for message sent confirmation (via socket)
    socket.on("message-sent", (data) => {
      console.log("✅ Message sent:", data);
      const { messageSentConfirmation } = useChatStore.getState();
      messageSentConfirmation(data);
    });

    // Listen for typing indicators
    socket.on("user-typing", (data) => {
      const { setUserTyping } = useChatStore.getState();
      setUserTyping(data.userId);
    });

    socket.on("user-stop-typing", (data) => {
      const { setUserStopTyping } = useChatStore.getState();
      setUserStopTyping(data.userId);
    });

    // Listen for messages read notification
    socket.on("messages-read", (data) => {
      console.log("👁️ Messages read:", data);
      const { updateMessageReadStatus } = useChatStore.getState();
      updateMessageReadStatus(data.conversationId);
    });

    // Listen for message deletion for everyone
    socket.on("message-deleted-everyone", (data) => {
      console.log("🗑️ Message deleted for everyone:", data);
      const { receiveDeletedMessageEveryone } = useChatStore.getState();
      receiveDeletedMessageEveryone(data.messageId);
    });

    // ===================== VIDEO CALL EVENTS =====================

    // Incoming call
    socket.on("incoming-call", (data) => {
      console.log("📞 Incoming call:", data);
      const { receiveIncomingCall } = useCallStore.getState();
      receiveIncomingCall(data);
    });

    // Call ringing (for caller)
    socket.on("call-ringing", (data) => {
      console.log("🔔 Call ringing:", data);
      const { callRinging } = useCallStore.getState();
      callRinging();
    });

    // Call accepted
    socket.on("call-accepted", (data) => {
      console.log("✅ Call accepted:", data);
      const { callAccepted } = useCallStore.getState();
      callAccepted(data);
    });

    // Call rejected
    socket.on("call-rejected", (data) => {
      console.log("❌ Call rejected:", data);
      const { callRejected } = useCallStore.getState();
      callRejected();
    });

    // Call ended
    socket.on("call-ended", (data) => {
      console.log("📴 Call ended:", data);
      const { callEnded } = useCallStore.getState();
      callEnded();
    });

    // Call error
    socket.on("call-error", (data) => {
      console.log("⚠️ Call error:", data);
      const { callError } = useCallStore.getState();
      callError(data.message);
    });

    // Call busy
    socket.on("call-busy", (data) => {
      console.log("📵 User busy:", data);
      const { callBusy } = useCallStore.getState();
      callBusy();
    });

    socket.connect();
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
