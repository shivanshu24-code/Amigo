import { create } from "zustand";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const useProfileStore = create((set, get) => ({
    // State
    profile: null,
    loading: false,
    error: null,
    isOwner: false,

    // Fetch current user's profile
    fetchMyProfile: async () => {
        set({ loading: true, error: null });
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/profile/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch profile");
            const data = await res.json();
            set({ profile: data, isOwner: true, loading: false });
            return data;
        } catch (err) {
            console.error("Fetch profile error:", err);
            set({ error: err.message, loading: false });
            return null;
        }
    },

    // Fetch profile by user ID
    fetchProfileById: async (userId) => {
        set({ loading: true, error: null });
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/profile/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch profile");
            const data = await res.json();

            // Check if viewing own profile
            const payload = JSON.parse(atob(token.split(".")[1]));
            const isOwner = payload.id === userId;

            set({ profile: data, isOwner, loading: false });
        } catch (err) {
            console.error("Fetch profile error:", err);
            set({ error: err.message, loading: false });
        }
    },

    // Update profile
    updateProfile: async (formData) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/profile`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            if (!res.ok) throw new Error("Failed to update profile");
            const data = await res.json();
            set({ profile: data });
            return { success: true, data };
        } catch (err) {
            console.error("Update profile error:", err);
            return { success: false, message: err.message };
        }
    },

    // Reset store
    reset: () =>
        set({
            profile: null,
            loading: false,
            error: null,
            isOwner: false,
        }),
}));
