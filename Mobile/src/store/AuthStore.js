import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    SignupApi,
    LoginApi,
    VerifyOtpApi,
    CheckauthApi,
} from '../services/auth.api.js';
import api from '../services/api.js';
import { connectSocket, disconnectSocket } from '../socket/socket.js';

export const useAuthStore = create((set, get) => ({
    /* ===================== STATE ===================== */
    user: null,
    isAuthenticated: false,
    hasProfile: false,
    loading: false,
    error: null,
    signupEmail: null,
    authChecked: false,

    /* ===================== SIGNUP ===================== */
    signup: async (email) => {
        set({ loading: true, error: null });
        try {
            const data = await SignupApi(email);

            if (!data.success) throw new Error(data.message);

            set({
                signupEmail: email,
                loading: false,
            });

            return true;
        } catch (err) {
            set({
                loading: false,
                error: err.response?.data?.message || err.message,
            });
            return false;
        }
    },

    /* ===================== VERIFY OTP ===================== */
    verifyOtp: async (email, otp) => {
        set({ loading: true, error: null });
        try {
            const data = await VerifyOtpApi(email, otp);
            set({ loading: false });
            return data.success;
        } catch (err) {
            set({
                loading: false,
                error: err.message || 'OTP verification failed',
            });
            return false;
        }
    },

    /* ===================== LOGIN ===================== */
    login: async (identifier, password) => {
        // Clear previous auth data
        await AsyncStorage.removeItem('auth-store');

        set({ loading: true, error: null });

        try {
            const data = await LoginApi(identifier, password);

            if (!data?.token || !data?.user) {
                throw new Error('Invalid login response');
            }

            // Store token in AsyncStorage
            await AsyncStorage.setItem('token', data.token);

            set({
                user: data.user,
                isAuthenticated: true,
                hasProfile: data.user.hasProfile,
                loading: false,
                authChecked: true,
            });

            connectSocket?.(data.user._id);

            return true;
        } catch (err) {
            await AsyncStorage.removeItem('token');
            set({
                loading: false,
                error: err.response?.data?.message || err.message,
                isAuthenticated: false,
            });
            return false;
        }
    },

    /* ===================== CHECK AUTH (ON APP LOAD) ===================== */
    checkAuth: async () => {
        const token = await AsyncStorage.getItem('token');

        if (!token) {
            set({
                user: null,
                isAuthenticated: false,
                authChecked: true,
            });
            return;
        }

        try {
            const res = await CheckauthApi();

            set({
                user: res.user,
                isAuthenticated: true,
                hasProfile: res.user.hasProfile,
                authChecked: true,
            });

            connectSocket?.(res.user._id);
        } catch (err) {
            await AsyncStorage.removeItem('token');
            set({
                user: null,
                isAuthenticated: false,
                authChecked: true,
            });
        }
    },

    /* ===================== PROFILE CREATED ===================== */
    setProfileComplete: (profileData) =>
        set((state) => ({
            user: {
                ...state.user,
                ...profileData,
                hasProfile: true,
            },
            hasProfile: true,
        })),

    /* ===================== UPDATE PROFILE ===================== */
    updateProfile: async (profileData) => {
        set({ loading: true, error: null });
        try {
            const res = await api.put('/profile', profileData);
            const updatedProfile = res.data;

            set((state) => ({
                user: {
                    ...state.user,
                    ...updatedProfile,
                    username: updatedProfile.user?.username || state.user.username,
                    avatar: updatedProfile.avatar || state.user.avatar,
                },
                loading: false,
            }));

            return true;
        } catch (err) {
            set({
                loading: false,
                error: err.response?.data?.message || err.message,
            });
            return false;
        }
    },

    /* ===================== LOGOUT ===================== */
    logout: async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('auth-store');
        disconnectSocket();
        set({
            user: null,
            isAuthenticated: false,
            hasProfile: false,
            authChecked: true,
        });
    },
}));
