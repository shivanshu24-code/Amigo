import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const useFriendStore = create((set, get) => ({
    // State
    friends: [],
    sentRequests: [],
    receivedRequests: [],
    pendingRequests: [],
    loading: false,
    error: null,

    // Fetch all friends
    fetchFriends: async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${API_URL}/friends`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                set({ friends: data.data || [] });
            }
        } catch (err) {
            console.error('Fetch friends error:', err);
        }
    },

    // Fetch sent requests
    fetchSentRequests: async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${API_URL}/friends/sent`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                set({ sentRequests: data.data?.map((r) => r.receiver._id) || [] });
            }
        } catch (err) {
            console.error('Fetch sent requests error:', err);
        }
    },

    // Fetch received requests
    fetchReceivedRequests: async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${API_URL}/friends/requests`, {
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
            console.error('Fetch received requests error:', err);
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

    // Fetch pending requests with full sender data
    fetchPendingRequests: async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${API_URL}/friends/requests`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                set({ pendingRequests: data.data || [] });
            }
        } catch (err) {
            console.error('Fetch pending requests error:', err);
        }
    },

    // Send friend request
    sendFriendRequest: async (userId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${API_URL}/friends/request/${userId}`, {
                method: 'POST',
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
            console.error('Send friend request error:', err);
            return { success: false, message: 'Failed to send request' };
        }
    },

    // Accept friend request
    acceptRequest: async (requestId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${API_URL}/friends/accept/${requestId}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                set((state) => ({
                    pendingRequests: state.pendingRequests.filter((r) => r._id !== requestId),
                }));
                // Refresh friends list
                get().fetchFriends();
                return { success: true };
            }
            return { success: false };
        } catch (err) {
            console.error('Accept request error:', err);
            return { success: false };
        }
    },

    // Reject friend request
    rejectRequest: async (requestId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${API_URL}/friends/reject/${requestId}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                set((state) => ({
                    pendingRequests: state.pendingRequests.filter((r) => r._id !== requestId),
                }));
                return { success: true };
            }
            return { success: false };
        } catch (err) {
            console.error('Reject request error:', err);
            return { success: false };
        }
    },

    // Remove friend
    removeFriend: async (userId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${API_URL}/friends/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                set((state) => ({
                    friends: state.friends.filter((f) => (f._id || f) !== userId),
                }));
                return { success: true };
            }
            return { success: false, message: data.message };
        } catch (err) {
            console.error('Remove friend error:', err);
            return { success: false, message: 'Failed to remove friend' };
        }
    },

    // Get friend status for a user
    getFriendStatus: (userId) => {
        const state = get();
        const isFriend = state.friends.some((f) => f._id === userId || f === userId);
        if (isFriend) return 'friends';
        if (state.sentRequests.includes(userId)) return 'pending';
        const received = state.receivedRequests.find((r) => r.senderId === userId);
        if (received) return { status: 'received', requestId: received.requestId };
        return 'none';
    },

    // Reset store
    reset: () =>
        set({
            friends: [],
            sentRequests: [],
            receivedRequests: [],
            pendingRequests: [],
            loading: false,
            error: null,
        }),
}));
