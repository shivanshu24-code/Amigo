import { create } from "zustand";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const usePostStore = create((set, get) => ({
    // State
    posts: [],
    userPosts: [],
    savedPostsList: [],
    loading: false,
    loading: false,
    error: null,
    showCreatePostModal: false, // For global create post modal
    initialPostData: null, // For editing/resharing

    // Toggle create post modal
    openCreatePostModal: (data = null) => set({ showCreatePostModal: true, initialPostData: data }),
    closeCreatePostModal: () => set({ showCreatePostModal: false, initialPostData: null }),

    // Fetch posts for a specific user
    fetchUserPosts: async (userId) => {
        set({ loading: true, error: null });
        try {
            const token = localStorage.getItem("token");
            // Use the fixed backend route
            const res = await fetch(`${API_BASE}/post/user/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to fetch user posts");
            }
            const data = await res.json();
            set({ userPosts: data, loading: false });
        } catch (err) {
            console.error("Fetch user posts error:", err);
            set({ error: err.message, loading: false });
        }
    },

    // Fetch all posts
    fetchPosts: async () => {
        set({ loading: true, error: null });
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/post`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch posts");
            const data = await res.json();
            set({ posts: data, loading: false });
        } catch (err) {
            console.error("Fetch posts error:", err);
            set({ error: err.message, loading: false });
        }
    },

    // Create a new post
    createPost: async (formData) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/post`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            if (!res.ok) throw new Error("Failed to create post");
            const newPost = await res.json();
            set((state) => ({ posts: [newPost, ...state.posts] }));
            return { success: true, data: newPost };
        } catch (err) {
            console.error("Create post error:", err);
            return { success: false, message: err.message };
        }
    },

    // Delete a post
    deletePost: async (postId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/post/${postId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                set((state) => ({
                    posts: state.posts.filter((p) => p._id !== postId),
                    userPosts: state.userPosts.filter((p) => p._id !== postId),
                    savedPostsList: state.savedPostsList.filter((p) => p._id !== postId),
                }));
                return { success: true };
            }
            return { success: false, message: "Failed to delete post" };
        } catch (err) {
            console.error("Delete post error:", err);
            return { success: false, message: err.message };
        }
    },

    // Like/unlike a post
    likePost: async (postId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/like/${postId}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                // Refetch posts to get updated like count
                get().fetchPosts();
                return { success: true };
            }
            return { success: false };
        } catch (err) {
            console.error("Like post error:", err);
            return { success: false };
        }
    },

    // Fetch comments for a post
    fetchComments: async (postId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/comment/${postId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch comments");
            const comments = await res.json();

            // Update the post's comments in state
            set((state) => ({
                posts: state.posts.map((post) =>
                    post._id === postId ? { ...post, comments } : post
                ),
            }));
            return { success: true, data: comments };
        } catch (err) {
            console.error("Fetch comments error:", err);
            return { success: false, message: err.message };
        }
    },

    // Add a comment to a post
    addComment: async (postId, text, parentComment = null) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/comment/${postId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ text, parentComment }),
            });
            if (!res.ok) throw new Error("Failed to add comment");
            const newComment = await res.json();

            // Update state with new comment
            set((state) => ({
                posts: state.posts.map((post) =>
                    post._id === postId
                        ? { ...post, comments: [...(post.comments || []), newComment] }
                        : post
                ),
            }));
            return { success: true, data: newComment };
        } catch (err) {
            console.error("Add comment error:", err);
            return { success: false, message: err.message };
        }
    },

    // Pin a comment
    pinComment: async (postId, commentId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/comment/pin/${commentId}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to pin comment");

            // Refetch comments to get updated state
            await get().fetchComments(postId);
            return { success: true };
        } catch (err) {
            console.error("Pin comment error:", err);
            return { success: false, message: err.message };
        }
    },

    // React to a comment
    reactToComment: async (postId, commentId, emoji) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/comment/react/${commentId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ emoji }),
            });
            if (!res.ok) throw new Error("Failed to react to comment");

            // Refetch comments to get updated reactions
            await get().fetchComments(postId);
            return { success: true };
        } catch (err) {
            console.error("React to comment error:", err);
            return { success: false, message: err.message };
        }
    },

    // Delete a comment
    deleteComment: async (postId, commentId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/comment/${commentId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to delete comment");

            // Refetch comments to update the tree and counts
            await get().fetchComments(postId);
            return { success: true };
        } catch (err) {
            console.error("Delete comment error:", err);
            return { success: false, message: err.message };
        }
    },

    // Save/unsave a post
    savePost: async (postId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/post/save/${postId}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                return { success: true, saved: data.saved, message: data.message };
            }
            return { success: false, message: "Failed to toggle save" };
        } catch (err) {
            console.error("Save post error:", err);
            return { success: false, message: err.message };
        }
    },

    // Fetch saved posts
    fetchSavedPosts: async () => {
        set({ loading: true });
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/post/saved`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch saved posts");
            const data = await res.json();
            set({ savedPostsList: data, loading: false });
        } catch (err) {
            console.error("Fetch saved posts error:", err);
            set({ loading: false });
        }
    },

    // Reset store
    reset: () => set({ posts: [], savedPostsList: [], loading: false, error: null }),
}));
