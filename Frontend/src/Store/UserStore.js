import { create } from "zustand";
import api from "../Services/Api.js";

export const useUserStore = create((set) => ({
    // State
    users: [],
    loading: false,
    error: null,
    currentUserId: null,

    // Fetch all users
    fetchUsers: async () => {
        set({ loading: true, error: null });
        try {
            const res = await api.get("/users/allUsers");

            // Get current user ID from token safely
            const token = localStorage.getItem("token");
            let userId = null;
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split(".")[1]));
                    userId = payload.id;
                } catch (e) {
                    console.error("Token parse error", e);
                }
            }

            set({
                users: res.data.data || [],
                currentUserId: userId,
                loading: false
            });
        } catch (err) {
            console.error("Fetch users error:", err);
            set({
                error: err.response?.data?.message || err.message,
                loading: false
            });
        }
    },

    // Reset store
    reset: () =>
        set({
            users: [],
            loading: false,
            error: null,
            currentUserId: null,
        }),
}));
