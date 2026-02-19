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
import {
  generateRSAKeyPair,
  exportPublicKey,
  exportPrivateKey,
  importPrivateKey,
  isCryptoSupported
} from "../Utils/CryptoUtils.js";

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
      privateKey: null, // CryptoKey object
      e2eeEnabled: false,

      /* ===================== E2EE KEY MANAGEMENT ===================== */
      setupKeys: async () => {
        if (!isCryptoSupported()) {
          console.warn("E2EE Disabled: Browser context not secure (HTTPS or localhost required).");
          set({ e2eeEnabled: false });
          return;
        }

        const userId = get().user?._id;
        if (!userId) {
          set({ e2eeEnabled: false });
          return;
        }

        const privateKeyStorageKey = `e2ee_private_key_${userId}`;
        const publicKeyStorageKey = `e2ee_public_key_${userId}`;

        let storedPrivateKey = localStorage.getItem(privateKeyStorageKey);
        let storedPublicKey = localStorage.getItem(publicKeyStorageKey);

        // One-time migration support from legacy non-user-scoped keys
        if (!storedPrivateKey) {
          const legacyPrivate = localStorage.getItem("e2ee_private_key");
          if (legacyPrivate) {
            storedPrivateKey = legacyPrivate;
            localStorage.setItem(privateKeyStorageKey, legacyPrivate);
          }
        }
        if (!storedPublicKey) {
          const legacyPublic = localStorage.getItem("e2ee_public_key");
          if (legacyPublic) {
            storedPublicKey = legacyPublic;
            localStorage.setItem(publicKeyStorageKey, legacyPublic);
          }
        }

        try {
          if (storedPrivateKey && storedPublicKey) {
            // Import existing private key
            const key = await importPrivateKey(storedPrivateKey);
            // Ensure server has the matching public key for this user
            await api.put("/profile", { publicKey: storedPublicKey });
            set({ privateKey: key, e2eeEnabled: true });
          } else {
            // Generate new key pair
            const keyPair = await generateRSAKeyPair();
            const privateKeyB64 = await exportPrivateKey(keyPair.privateKey);
            const publicKeyB64 = await exportPublicKey(keyPair.publicKey);

            localStorage.setItem(privateKeyStorageKey, privateKeyB64);
            localStorage.setItem(publicKeyStorageKey, publicKeyB64);
            // Keep legacy keys for backward compatibility with any older code path
            localStorage.setItem("e2ee_private_key", privateKeyB64);
            localStorage.setItem("e2ee_public_key", publicKeyB64);

            // Upload public key to server
            await api.put("/profile", { publicKey: publicKeyB64 });

            set({ privateKey: keyPair.privateKey, e2eeEnabled: true });
          }
        } catch (err) {
          console.error("E2EE Setup Error:", err);
          set({ e2eeEnabled: false });
        }
      },

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
            error: err.response?.data?.message || err.message || "OTP verification failed",
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
          await get().setupKeys();

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
          await get().setupKeys();
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
      /* ===================== UPDATE PRIVACY ===================== */
      updatePrivacy: async (isPrivate) => {
        set({ loading: true, error: null });
        try {
          const res = await api.put("/auth/privacy", { isPrivate });
          if (res.data.success) {
            set((state) => ({
              user: { ...state.user, isPrivate: res.data.isPrivate },
              loading: false
            }));
            return true;
          }
          return false;
        } catch (err) {
          set({
            loading: false,
            error: err.response?.data?.message || err.message,
          });
          return false;
        }
      },
      updateTagsAndMentions: async (settings) => {
        set({ loading: true, error: null });
        try {
          const res = await api.put("/auth/tags-mentions", settings);
          if (res.data.success) {
            set((state) => ({
              user: {
                ...state.user,
                tagInStoryPermission: res.data.tagInStoryPermission,
                mentionPermission: res.data.mentionPermission,
              },
              loading: false,
            }));
            return true;
          }
          set({ loading: false });
          return false;
        } catch (err) {
          set({
            loading: false,
            error: err.response?.data?.message || err.message,
          });
          return false;
        }
      },
      updateReadReceipts: async (readReceiptsEnabled) => {
        set({ loading: true, error: null });
        try {
          const res = await api.put("/auth/read-receipts", { readReceiptsEnabled });
          if (res.data.success) {
            set((state) => ({
              user: {
                ...state.user,
                readReceiptsEnabled: res.data.readReceiptsEnabled,
              },
              loading: false,
            }));
            return true;
          }
          set({ loading: false });
          return false;
        } catch (err) {
          set({
            loading: false,
            error: err.response?.data?.message || err.message,
          });
          return false;
        }
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
