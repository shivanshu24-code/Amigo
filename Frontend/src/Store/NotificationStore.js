import { create } from "zustand";

const MAX_NOTIFICATIONS = 50;

export const useNotificationStore = create((set, get) => ({
  notifications: [],

  addNotification: (notification) => {
    const item = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      read: false,
      ...notification,
    };

    set((state) => ({
      notifications: [item, ...state.notifications].slice(0, MAX_NOTIFICATIONS),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  clearNotifications: () => set({ notifications: [] }),

  reset: () => set({ notifications: [] }),
}));

