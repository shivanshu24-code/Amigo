import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  SignupApi,
  LoginApi,
  VerifyOtpApi,
  CheckauthApi,
} from "../Services/Auth.api.js";
import api from "../Services/Api.js";
import { connectSocket, disconnectSocket } from "../Socket/Socket.js";

export const useAuthStore = create(
  persist(
    (set, get) => ({
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
            error: err.message || "OTP verification failed",
          });
          return false;
        }
      },

      /* ===================== LOGIN ===================== */
      login: async (identifier, password) => {
        localStorage.removeItem("auth-store")

        set({ loading: true, error: null });

        try {
          const data = await LoginApi(identifier, password);

          if (!data?.token || !data?.user) {
            throw new Error("Invalid login response");
          }

          localStorage.setItem("token", data.token);

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
          localStorage.removeItem("token");
          set({
            loading: false,
            error: err.response?.data?.message || err.message,
            isAuthenticated: false,
          });
          return false;
        }
      },

      /* ===================== CHECK AUTH (ON REFRESH) ===================== */
      checkAuth: async () => {
        const token = localStorage.getItem("token");

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
          localStorage.removeItem("token");
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
          // api is interceptor instance from ../Services/Api.js
          // check Profile.route.js: router.put("/profile", protect, updateProfile)
          // so url is /profile (relative to baseURL)
          // Api.js likely puts /api base? user said /api/profile in index.js
          const res = await api.put("/profile", profileData);

          // res.data is the updated profile document, populated with user
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
      logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("auth-store");
        disconnectSocket();
        set({
          user: null,
          isAuthenticated: false,
          hasProfile: false,
          authChecked: true,
        });
      },
    }),
    {
      name: "auth-store",
       partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
