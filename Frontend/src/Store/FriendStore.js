import { create } from "zustand";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const useFriendStore = create((set, get) => ({
    // State
    friends: [],
    sentRequests: [], // Array of user IDs
    receivedRequests: [], // Array of { senderId, requestId }
    pendingRequests: [], // Full request objects with sender data for navbar
    loading: false,
    error: null,

    // Fetch all friends
    fetchFriends: async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/friends`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                // Store full friend objects for chat functionality
                set({ friends: data.data || [] });
            }
        } catch (err) {
            console.error("Fetch friends error:", err);
        }
    },

    // Fetch sent requests
    fetchSentRequests: async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/friends/sent`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                set({ sentRequests: data.data?.map((r) => r.receiver._id) || [] });
            }
        } catch (err) {
            console.error("Fetch sent requests error:", err);
        }
    },

    // Fetch received requests
    fetchReceivedRequests: async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/friends/requests`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                set({
                    receivedRequests:
                        data.data?.map((r) => ({
                            senderId: r.sender._id,
                            requestId: r._id,
                        })) || [],
                });
            }
        } catch (err) {
            console.error("Fetch received requests error:", err);
        }
    },

    // Fetch all friend data at once
    fetchAllFriendData: async () => {
        set({ loading: true });
        await Promise.all([
            get().fetchFriends(),
            get().fetchSentRequests(),
            get().fetchReceivedRequests(),
        ]);
        set({ loading: false });
    },

    // Fetch pending requests with full sender data (for navbar)
    fetchPendingRequests: async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/friends/requests`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                set({ pendingRequests: data.data || [] });
            }
        } catch (err) {
            console.error("Fetch pending requests error:", err);
        }
    },

    // Accept request (simplified for navbar)
    acceptRequest: async (requestId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/friends/accept/${requestId}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                set((state) => ({
                    pendingRequests: state.pendingRequests.filter(r => r._id !== requestId),
                }));
                return { success: true };
            }
            return { success: false };
        } catch (err) {
            console.error("Accept request error:", err);
            return { success: false };
        }
    },

    // Reject request (simplified for navbar)
    rejectRequest: async (requestId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/friends/reject/${requestId}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                set((state) => ({
                    pendingRequests: state.pendingRequests.filter(r => r._id !== requestId),
                }));
                return { success: true };
            }
            return { success: false };
        } catch (err) {
            console.error("Reject request error:", err);
            return { success: false };
        }
    },

    // Send friend request
    sendFriendRequest: async (userId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/friends/request/${userId}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                set((state) => ({
                    sentRequests: [...state.sentRequests, userId],
                }));
                return { success: true };
            }
            return { success: false, message: data.message };
        } catch (err) {
            console.error("Send friend request error:", err);
            return { success: false, message: "Failed to send request" };
        }
    },

    // Accept friend request
    acceptFriendRequest: async (requestId, senderId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/friends/accept/${requestId}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                set((state) => ({
                    receivedRequests: state.receivedRequests.filter(
                        (r) => r.senderId !== senderId
                    ),
                    friends: [...state.friends, senderId],
                }));
                return { success: true };
            }
            return { success: false, message: data.message };
        } catch (err) {
            console.error("Accept friend request error:", err);
            return { success: false, message: "Failed to accept request" };
        }
    },

    // Reject friend request
    rejectFriendRequest: async (requestId, senderId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/friends/reject/${requestId}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                set((state) => ({
                    receivedRequests: state.receivedRequests.filter(
                        (r) => r.senderId !== senderId
                    ),
                }));
                return { success: true };
            }
            return { success: false, message: data.message };
        } catch (err) {
            console.error("Reject friend request error:", err);
            return { success: false, message: "Failed to reject request" };
        }
    },

    // Remove friend
    removeFriend: async (userId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/friends/${userId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                set((state) => ({
                    // Filter out the removed friend (handling both object and ID forms)
                    friends: state.friends.filter(
                        (f) => (f._id || f) !== userId
                    ),
                }));
                return { success: true };
            }
            return { success: false, message: data.message };
        } catch (err) {
            console.error("Remove friend error:", err);
            return { success: false, message: "Failed to remove friend" };
        }
    },

    // Get friend status for a user
    getFriendStatus: (userId) => {
        const state = get();
        // Check if userId is in friends array (now contains full objects)
        const isFriend = state.friends.some(f => f._id === userId || f === userId);
        if (isFriend) return "friends";
        if (state.sentRequests.includes(userId)) return "pending";
        const received = state.receivedRequests.find((r) => r.senderId === userId);
        if (received) return { status: "received", requestId: received.requestId };
        return "none";
    },

    // Reset store
    reset: () =>
        set({
            friends: [],
            sentRequests: [],
            receivedRequests: [],
            loading: false,
            error: null,
        }),
}));
