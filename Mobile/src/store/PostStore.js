import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const usePostStore = create((set, get) => ({
    // State
    posts: [],
    userPosts: [],
    loading: false,
    error: null,

    // Fetch posts for a specific user
    fetchUserPosts: async (userId) => {
        set({ loading: true, error: null });
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${API_URL}/post/user/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch user posts');
            const data = await res.json();
            set({ userPosts: data, loading: false });
        } catch (err) {
            console.error('Fetch user posts error:', err);
            set({ error: err.message, loading: false });
        }
    },

    // Fetch all posts (feed)
    fetchPosts: async () => {
        set({ loading: true, error: null });
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${API_URL}/post`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch posts');
            const data = await res.json();
            set({ posts: data, loading: false });
        } catch (err) {
            console.error('Fetch posts error:', err);
            set({ error: err.message, loading: false });
        }
    },

    // Create a new post
    createPost: async (formData) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${API_URL}/post`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            if (!res.ok) throw new Error('Failed to create post');
            const newPost = await res.json();
            set((state) => ({ posts: [newPost, ...state.posts] }));
            return { success: true, data: newPost };
        } catch (err) {
            console.error('Create post error:', err);
            return { success: false, message: err.message };
        }
    },

    // Delete a post
    deletePost: async (postId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${API_URL}/post/${postId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                set((state) => ({
                    posts: state.posts.filter((p) => p._id !== postId),
                }));
                return { success: true };
            }
            return { success: false, message: 'Failed to delete post' };
        } catch (err) {
            console.error('Delete post error:', err);
            return { success: false, message: err.message };
        }
    },

    // Like/unlike a post
    likePost: async (postId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${API_URL}/like/${postId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                // Refetch posts to get updated like count
                get().fetchPosts();
                return { success: true };
            }
            return { success: false };
        } catch (err) {
            console.error('Like post error:', err);
            return { success: false };
        }
    },

    // Add a comment to a post
    addComment: async (postId, text, parentComment = null) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${API_URL}/comment/${postId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ text, parentComment }),
            });
            if (!res.ok) throw new Error('Failed to add comment');
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
            console.error('Add comment error:', err);
            return { success: false, message: err.message };
        }
    },

    // Reset store
    reset: () => set({ posts: [], userPosts: [], loading: false, error: null }),
}));
