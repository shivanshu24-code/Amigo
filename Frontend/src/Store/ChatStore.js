import { create } from "zustand";
import api from "../Services/Api.js";
import { getSocket } from "../Socket/Socket.js";
import { encryptMessage, decryptMessage, importPublicKey } from "../Utils/CryptoUtils.js";
import { useAuthStore } from "./AuthStore.js";

export const useChatStore = create((set, get) => ({
    /* ===================== STATE ===================== */
    conversations: [],
    currentChat: null,
    messages: [],
    unreadCount: 0,
    loading: false,
    messagesLoading: false,
    error: null,
    isTyping: false,
    typingUserId: null,
    isMobileChatOpen: false, // Track if mobile chat is open

    /* ===================== SET MOBILE CHAT OPEN ===================== */
    setMobileChatOpen: (isOpen) => set({ isMobileChatOpen: isOpen }),

    /* ===================== SET CURRENT CHAT ===================== */
    setCurrentChat: (chatOrFriend) => {
        set({ currentChat: chatOrFriend, messages: [] });
        if (chatOrFriend) {
            if (chatOrFriend.isGroup) {
                // Group: _id is the conversation ID, fetch via /messages/v/:conversationId
                get().fetchMessages(chatOrFriend._id, true);
            } else {
                // 1-on-1: _id is the friend's user ID, fetch via /messages/:friendId
                get().fetchMessages(chatOrFriend._id, false);
            }
        }
    },

    /* ===================== FETCH CONVERSATIONS ===================== */
    fetchConversations: async () => {
        set({ loading: true });
        try {
            const res = await api.get("/chat/conversations");
            set({ conversations: res.data.data, loading: false });
        } catch (err) {
            console.error("Failed to fetch conversations:", err);
        }
    },

    /* ===================== FETCH MESSAGES ===================== */
    fetchMessages: async (id, isGroup = false) => {
        set({ messagesLoading: true, error: null });
        try {
            const url = isGroup
                ? `/chat/messages/v/${id}`
                : `/chat/messages/${id}`;
            const res = await api.get(url);
            let fetchedMessages = res.data.data;

            // Decrypt messages if 1-on-1 and encrypted
            if (!isGroup) {
                const { privateKey } = useAuthStore.getState();
                if (privateKey) {
                    fetchedMessages = await Promise.all(fetchedMessages.map(async (msg) => {
                        if (msg.encryptedKey && msg.encryptionIV && msg.text) {
                            const decrypted = await decryptMessage(msg.text, msg.encryptedKey, msg.encryptionIV, privateKey);
                            return { ...msg, text: decrypted, isEncrypted: true };
                        }
                        return msg;
                    }));
                }
            }

            set({ messages: fetchedMessages, messagesLoading: false });
        } catch (err) {
            set({
                messagesLoading: false,
                error: err.response?.data?.message || "Failed to fetch messages",
            });
        }
    },

    /* ===================== SEND MESSAGE ===================== */
    sendMessage: async (text) => {
        const { currentChat, messages } = get();
        if (!currentChat || !text.trim()) return;

        // Optimistically add message to UI
        const tempId = `temp-${Date.now()}`;
        const optimisticMessage = {
            _id: tempId,
            text: text.trim(),
            sender: { _id: 'me' }, // Will be replaced when API responds
            receiver: currentChat._id,
            createdAt: new Date().toISOString(),
            read: false,
            sending: true,
        };

        set({ messages: [...messages, optimisticMessage] });

        try {
            const payload = { text };
            if (currentChat.isGroup) {
                payload.conversationId = currentChat._id;
            } else {
                // E2EE for 1-on-1
                const friend = currentChat.friend || currentChat;
                if (friend.publicKey) {
                    try {
                        const publicKey = await importPublicKey(friend.publicKey);
                        const encrypted = await encryptMessage(text.trim(), publicKey);

                        payload.text = encrypted.cipherText;
                        payload.encryptedKey = encrypted.encryptedKey;
                        payload.encryptionIV = encrypted.iv;
                    } catch (cryptoErr) {
                        console.error("Encryption failed, sending as plain text:", cryptoErr);
                    }
                }
            }

            // For 1-on-1: send to friend's user ID; for group: send to conversation ID
            const sendToId = currentChat._id;
            const res = await api.post(`/chat/send/${sendToId}`, payload);
            const newMessage = { ...res.data.data, text: text.trim() }; // Keep decrypted text for UI

            // Replace optimistic message with real one
            set((state) => ({
                messages: state.messages.map(msg =>
                    msg._id === tempId ? { ...newMessage, sending: false } : msg
                ),
            }));

            // Update conversation list silently (no loading state)
            get().updateConversationWithMessage(newMessage);

            return true;
        } catch (err) {
            // Remove failed message
            set((state) => ({
                messages: state.messages.filter(msg => msg._id !== tempId),
                error: err.response?.data?.message || "Failed to send message",
            }));
            return false;
        }
    },

    /* ===================== UPDATE CONVERSATION WITH NEW MESSAGE ===================== */
    updateConversationWithMessage: (message) => {
        set((state) => {
            const existingConv = state.conversations.find(
                c => c._id === message.conversationId
            );

            if (existingConv) {
                // Update existing conversation
                return {
                    conversations: state.conversations.map(c =>
                        c._id === existingConv._id
                            ? { ...c, lastMessage: message, updatedAt: message.createdAt }
                            : c
                    ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
                };
            } else {
                // Fetch fresh conversations if new chat
                get().fetchConversations();
                return state;
            }
        });
    },

    /* ===================== RECEIVE NEW MESSAGE ===================== */
    receiveMessage: async (messageData) => {
        const { currentChat } = get();
        let message = messageData.message;

        // Decrypt if encrypted and not group
        if (!messageData.isGroup && message.encryptedKey && message.encryptionIV) {
            const { privateKey } = useAuthStore.getState();
            if (privateKey) {
                const decrypted = await decryptMessage(message.text, message.encryptedKey, message.encryptionIV, privateKey);
                message = { ...message, text: decrypted, isEncrypted: true };
            }
        }

        // Check if message belongs to the current chat
        // For 1-on-1: currentChat has conversationId; for groups: currentChat._id is the conversation ID
        const currentConvId = currentChat?.isGroup ? currentChat._id : currentChat?.conversationId;
        if (currentChat && messageData.conversationId && messageData.conversationId === currentConvId) {
            set((state) => ({
                messages: [...state.messages, message],
            }));
        }

        // Update conversation list silently
        get().updateConversationWithMessage(message);
    },

    /* ===================== MESSAGE SENT CONFIRMATION (Socket) ===================== */
    messageSentConfirmation: (messageData) => {
        // Only add if not already in messages (avoid duplicates from REST API)
        set((state) => {
            const exists = state.messages.some(m => m._id === messageData.message._id);
            if (exists) return state;
            return {
                messages: [...state.messages, messageData.message],
            };
        });
        get().updateConversationWithMessage(messageData.message);
    },

    /* ===================== UPDATE MESSAGE READ STATUS ===================== */
    updateMessageReadStatus: (conversationId) => {
        set((state) => ({
            messages: state.messages.map(msg => ({
                ...msg,
                read: true,
            })),
        }));
    },

    /* ===================== TYPING INDICATORS ===================== */
    sendTyping: () => {
        const { currentChat } = get();
        if (!currentChat) return;

        const socket = getSocket();
        if (socket) {
            socket.emit("typing", { receiverId: currentChat._id });
        }
    },

    stopTyping: () => {
        const { currentChat } = get();
        if (!currentChat) return;

        const socket = getSocket();
        if (socket) {
            socket.emit("stop-typing", { receiverId: currentChat._id });
        }
    },

    setUserTyping: (userId) => {
        const { currentChat } = get();
        if (currentChat && currentChat._id === userId) {
            set({ isTyping: true, typingUserId: userId });
        }
    },

    setUserStopTyping: (userId) => {
        const { currentChat } = get();
        if (currentChat && currentChat._id === userId) {
            set({ isTyping: false, typingUserId: null });
        }
    },

    /* ===================== MARK AS READ ===================== */
    markAsRead: async (conversationId) => {
        try {
            await api.put(`/chat/read/${conversationId}`);
        } catch (err) {
            console.error("Failed to mark as read:", err);
        }
    },

    /* ===================== FETCH UNREAD COUNT ===================== */
    fetchUnreadCount: async () => {
        try {
            const res = await api.get("/chat/unread");
            set({ unreadCount: res.data.unreadCount });
        } catch (err) {
            console.error("Failed to fetch unread count:", err);
        }
    },

    /* ===================== CLEAR CURRENT CHAT ===================== */
    clearCurrentChat: () => {
        set({ currentChat: null, messages: [] });
    },

    /* ===================== DELETE MESSAGE ===================== */
    deleteMessage: async (messageId, deleteForEveryone = false) => {
        try {
            const res = await api.post(`/chat/message/delete/${messageId}`, { deleteForEveryone });

            if (res.data.success) {
                if (deleteForEveryone) {
                    // Update locally for sender (socket will handle other side if integrated)
                    set((state) => ({
                        messages: state.messages.map(m =>
                            m._id === messageId ? { ...m, isDeletedForEveryone: true } : m
                        )
                    }));
                } else {
                    // Remove from view entirely for "delete for me"
                    set((state) => ({
                        messages: state.messages.filter(m => m._id !== messageId)
                    }));
                }
                return true;
            }
            return false;
        } catch (err) {
            console.error("Failed to delete message:", err);
            return false;
        }
    },

    /* ===================== RECEIVE MESSAGE DELETED FOR EVERYONE ===================== */
    receiveDeletedMessageEveryone: (messageId) => {
        set((state) => ({
            messages: state.messages.map(m =>
                m._id === messageId ? { ...m, isDeletedForEveryone: true } : m
            )
        }));
    },

    /* ===================== CREATE GROUP ===================== */
    createGroup: async (name, participants) => {
        set({ loading: true });
        try {
            const res = await api.post("/chat/create-group", { name, participants });
            if (res.data.success) {
                await get().fetchConversations();
                set({ loading: false });
                return res.data.data;
            }
            set({ loading: false });
            return null;
        } catch (err) {
            console.error("Failed to create group:", err);
            set({ loading: false });
            return null;
        }
    },

    /* ===================== SHARED MEDIA ===================== */
    fetchSharedMedia: async (conversationId) => {
        try {
            const res = await api.get(`/chat/media/${conversationId}`);
            return res.data.data || [];
        } catch (err) {
            console.error("Failed to fetch shared media:", err);
            return [];
        }
    },

    /* ===================== LEAVE GROUP ===================== */
    leaveGroup: async (conversationId) => {
        try {
            const res = await api.post(`/chat/leave-group/${conversationId}`);
            if (res.data.success) {
                set({ currentChat: null, messages: [] });
                await get().fetchConversations();
                return true;
            }
            return false;
        } catch (err) {
            console.error("Failed to leave group:", err);
            return false;
        }
    },

    /* ===================== MAKE ADMIN ===================== */
    makeAdmin: async (conversationId, userId) => {
        try {
            const res = await api.post(`/chat/make-admin/${conversationId}/${userId}`);
            if (res.data.success) {
                await get().fetchConversations();
                return true;
            }
            return false;
        } catch (err) {
            console.error("Failed to make admin:", err);
            return false;
        }
    },

    /* ===================== REMOVE ADMIN ===================== */
    removeAdmin: async (conversationId, userId) => {
        try {
            const res = await api.post(`/chat/remove-admin/${conversationId}/${userId}`);
            if (res.data.success) {
                await get().fetchConversations();
                return true;
            }
            return false;
        } catch (err) {
            console.error("Failed to remove admin:", err);
            return false;
        }
    },

    /* ===================== CLEAR CHAT ===================== */
    clearChat: async (conversationId) => {
        try {
            const res = await api.post(`/chat/clear/${conversationId}`);
            if (res.data.success) {
                // If we cleared the currently active chat, empty the messages local state
                const currentConvId = get().currentChat?.isGroup
                    ? get().currentChat._id
                    : get().currentChat?.conversationId;

                if (conversationId === currentConvId || conversationId === get().currentChat?._id) {
                    set({ messages: [] });
                }

                // Refresh conversations to update last message preview if needed
                get().fetchConversations();
                return true;
            }
            return false;
        } catch (err) {
            console.error("Failed to clear chat:", err);
            return false;
        }
    },

    /* ===================== RESET STORE (on logout) ===================== */
    resetStore: () => {
        set({
            conversations: [],
            currentChat: null,
            messages: [],
            unreadCount: 0,
            loading: false,
            messagesLoading: false,
            error: null,
            isTyping: false,
            typingUserId: null,
            isMobileChatOpen: false,
        });
    },
}));
