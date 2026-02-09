import { create } from "zustand";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const useStoryStore = create((set, get) => ({
    // State
    stories: [],
    loading: false,
    error: null,

    // Viewer state
    viewerOpen: false,
    viewerStories: [],
    startIndex: 0,

    // Viewers modal state
    viewersModalOpen: false,
    currentViewers: [],
    viewersLoading: false,

    // Fetch all stories
    fetchStories: async () => {
        set({ loading: true, error: null });
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/story`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch stories");
            const data = await res.json();
            set({ stories: Array.isArray(data) ? data : [], loading: false });
        } catch (err) {
            console.error("Fetch stories error:", err);
            set({ stories: [], error: err.message, loading: false });
        }
    },

    // Create a story with optional mentions
    createStory: async (formData) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/story`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            if (!res.ok) throw new Error("Failed to create story");
            // Refetch stories
            get().fetchStories();
            return { success: true };
        } catch (err) {
            console.error("Create story error:", err);
            return { success: false, message: err.message };
        }
    },

    // Record that user viewed a story
    recordView: async (storyId) => {
        try {
            const token = localStorage.getItem("token");
            await fetch(`${API_BASE}/story/${storyId}/view`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch (err) {
            console.error("Record view error:", err);
        }
    },

    // Fetch viewers for a story (author only)
    fetchViewers: async (storyId) => {
        set({ viewersLoading: true });
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/story/${storyId}/viewers`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch viewers");
            const data = await res.json();
            set({
                currentViewers: data.viewers || [],
                viewersLoading: false,
                viewersModalOpen: true
            });
            return data;
        } catch (err) {
            console.error("Fetch viewers error:", err);
            set({ viewersLoading: false });
            return { viewers: [] };
        }
    },

    // Close viewers modal
    closeViewersModal: () => {
        set({ viewersModalOpen: false, currentViewers: [] });
    },

    // Delete a story
    deleteStory: async (storyId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/story/${storyId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                set({ viewerOpen: false });
                get().fetchStories();
                return { success: true };
            }
            return { success: false };
        } catch (err) {
            console.error("Delete story error:", err);
            return { success: false };
        }
    },

    // Get stories grouped by user
    getGroupedStories: () => {
        const stories = get().stories;
        return stories.reduce((acc, story) => {
            const userId = story.author._id;
            if (!acc[userId]) {
                acc[userId] = { author: story.author, stories: [] };
            }
            acc[userId].stories.push(story);
            return acc;
        }, {});
    },

    // Viewer controls
    openViewer: (userStories, index = 0) => {
        set({ viewerOpen: true, viewerStories: userStories, startIndex: index });
    },

    closeViewer: () => {
        set({ viewerOpen: false, viewerStories: [], startIndex: 0 });
    },

    // Reset store
    reset: () =>
        set({
            stories: [],
            loading: false,
            error: null,
            viewerOpen: false,
            viewerStories: [],
            startIndex: 0,
            viewersModalOpen: false,
            currentViewers: [],
            viewersLoading: false,
        }),
}));

