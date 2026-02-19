import { create } from "zustand";
import api from "../Services/Api.js";
import { getSocket } from "../Socket/Socket.js";
import { encryptMessageForRecipients, decryptMessage } from "../Utils/CryptoUtils.js";
import { useAuthStore } from "./AuthStore.js";

const isBase64Like = (value) => {
    if (typeof value !== "string" || !value.length) return false;
    const normalized = value.replace(/\s+/g, "");
    return /^[A-Za-z0-9+/=]+$/.test(normalized) && normalized.length % 4 === 0;
};

const shouldAttemptDecrypt = (text, encryptedKey, iv) => {
    if (!text || !encryptedKey || !iv) return false;
    return isBase64Like(text) && isBase64Like(encryptedKey) && isBase64Like(iv);
};

const getEntityId = (value) => {
    if (!value) return null;
    if (typeof value === "string") return value;
    if (typeof value === "object" && value._id) return String(value._id);
    return null;
};

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
    onlineUsers: [],
    isMobileChatOpen: false, // Track if mobile chat is open
    isBlocked: false, // Track if current chat user is blocked
    hasBlockedUser: false, // Track if current user is blocked by the other person

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
                // Check block status for 1-on-1 chats
                get().getBlockStatus(chatOrFriend._id);
            }
        }
    },

    /* ===================== FETCH CONVERSATIONS ===================== */
    fetchConversations: async () => {
        set({ loading: true });
        try {
            const res = await api.get("/chat/conversations");
            let conversations = res.data.data || [];
            const { privateKey, user } = useAuthStore.getState();
            const currentUserId = user?._id;

            if (privateKey && currentUserId) {
                conversations = await Promise.all(
                    conversations.map(async (conv) => {
                        const last = conv.lastMessage;
                        if (!last?.text || !last?.encryptionIV) return conv;

                        const recipientEncryptedKey =
                            last?.encryptedKeys?.[currentUserId] || last?.encryptedKey;
                        if (!shouldAttemptDecrypt(last?.text, recipientEncryptedKey, last?.encryptionIV)) return conv;

                        const decryptedText = await decryptMessage(
                            last.text,
                            recipientEncryptedKey,
                            last.encryptionIV,
                            privateKey
                        );

                        return {
                            ...conv,
                            lastMessage: {
                                ...last,
                                text: decryptedText,
                                isEncrypted: true,
                            },
                        };
                    })
                );
            }

            set({ conversations, loading: false });
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

            // Decrypt messages for both 1-on-1 and group when encryption payload exists
            const { privateKey, user } = useAuthStore.getState();
            const currentUserId = user?._id;
            if (privateKey && currentUserId) {
                fetchedMessages = await Promise.all(fetchedMessages.map(async (msg) => {
                    const recipientEncryptedKey =
                        msg?.encryptedKeys?.[currentUserId] || msg?.encryptedKey;
                    if (shouldAttemptDecrypt(msg?.text, recipientEncryptedKey, msg?.encryptionIV)) {
                        const decrypted = await decryptMessage(msg.text, recipientEncryptedKey, msg.encryptionIV, privateKey);
                        return { ...msg, text: decrypted, isEncrypted: true };
                    }
                    return msg;
                }));
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
                const { e2eeEnabled } = useAuthStore.getState();
                const participants = currentChat.participants || [];
                const canEncryptGroup =
                    e2eeEnabled &&
                    participants.length > 0 &&
                    participants.every((p) => Boolean(p?.publicKey));

                if (canEncryptGroup) {
                    try {
                        const recipients = participants
                            .filter((p) => p?._id && p?.publicKey)
                            .map((p) => ({ userId: String(p._id), publicKeyB64: p.publicKey }));

                        const encrypted = await encryptMessageForRecipients(text.trim(), recipients);
                        payload.text = encrypted.cipherText;
                        payload.encryptedKeys = encrypted.encryptedKeys;
                        payload.encryptionIV = encrypted.iv;
                    } catch (cryptoErr) {
                        console.error("Group encryption failed, sending as plain text:", cryptoErr);
                    }
                }
            } else {
                // E2EE for 1-on-1
                const friend = currentChat.friend || currentChat;
                const { e2eeEnabled, user } = useAuthStore.getState();
                const currentUserId = user?._id;
                const ownPublicKey =
                    (currentUserId && localStorage.getItem(`e2ee_public_key_${currentUserId}`)) ||
                    localStorage.getItem("e2ee_public_key");

                if (friend.publicKey && ownPublicKey && e2eeEnabled) {
                    try {
                        const recipients = [
                            { userId: String(friend._id), publicKeyB64: friend.publicKey },
                            { userId: String(currentUserId), publicKeyB64: ownPublicKey },
                        ];
                        const encrypted = await encryptMessageForRecipients(text.trim(), recipients);

                        payload.text = encrypted.cipherText;
                        payload.encryptedKeys = encrypted.encryptedKeys;
                        // Legacy fallback for older decrypt path in some places
                        payload.encryptedKey = encrypted.encryptedKeys?.[String(friend._id)];
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

    /* ===================== SEND ATTACHMENT ===================== */
    sendAttachment: async (file) => {
        const { currentChat, messages } = get();
        if (!currentChat || !file) return false;

        const tempId = `temp-file-${Date.now()}`;
        const localUrl = URL.createObjectURL(file);
        const optimisticMessage = {
            _id: tempId,
            sender: { _id: "me" },
            receiver: currentChat._id,
            createdAt: new Date().toISOString(),
            read: false,
            sending: true,
            attachment: {
                url: localUrl,
                fileName: file.name,
                mimeType: file.type,
                fileSize: file.size,
                resourceType: file.type.startsWith("image/")
                    ? "image"
                    : file.type.startsWith("video/")
                        ? "video"
                        : file.type.startsWith("audio/")
                            ? "audio"
                        : "raw",
            },
        };

        set({ messages: [...messages, optimisticMessage] });

        let shouldRevokeLocalUrl = true;
        try {
            const formData = new FormData();
            formData.append("file", file);
            if (currentChat.isGroup) {
                formData.append("conversationId", currentChat._id);
            }

            const sendToId = currentChat._id;
            const res = await api.post(`/chat/send-attachment/${sendToId}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const serverMessage = res.data.data || {};
            const fallbackAttachment = {
                url: localUrl,
                fileName: file.name,
                mimeType: file.type || "application/octet-stream",
                fileSize: file.size,
                resourceType: file.type.startsWith("image/")
                    ? "image"
                    : file.type.startsWith("video/")
                        ? "video"
                        : file.type.startsWith("audio/")
                            ? "audio"
                            : "raw",
            };
            const newMessage = {
                ...serverMessage,
                attachment: serverMessage?.attachment?.url
                    ? serverMessage.attachment
                    : fallbackAttachment,
            };
            // Keep local blob URL alive when server doesn't return a playable URL.
            if (!serverMessage?.attachment?.url) {
                shouldRevokeLocalUrl = false;
            }
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === tempId ? { ...newMessage, sending: false } : msg
                ),
            }));
            get().updateConversationWithMessage(newMessage);
            return true;
        } catch (err) {
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === tempId ? { ...msg, sending: false, failed: true } : msg
                ),
                error: err.response?.data?.message || "Failed to send attachment",
            }));
            return false;
        } finally {
            if (shouldRevokeLocalUrl) {
                setTimeout(() => URL.revokeObjectURL(localUrl), 5000);
            }
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

        // Decrypt if encryption payload exists (works for 1-on-1 and groups)
        const { privateKey, user } = useAuthStore.getState();
        const currentUserId = user?._id;
        const recipientEncryptedKey =
            message?.encryptedKeys?.[currentUserId] || message?.encryptedKey;
        if (privateKey && shouldAttemptDecrypt(message?.text, recipientEncryptedKey, message?.encryptionIV)) {
            const decrypted = await decryptMessage(message.text, recipientEncryptedKey, message.encryptionIV, privateKey);
            message = { ...message, text: decrypted, isEncrypted: true };
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
    updateMessageReadStatus: (conversationId, readBy) => {
        const { user } = useAuthStore.getState();
        const currentUserId = String(user?._id || "");
        const normalizedConversationId = String(conversationId || "");

        if (!normalizedConversationId || !readBy || String(readBy) === currentUserId) return;

        set((state) => ({
            messages: state.messages.map((msg) => {
                const messageConversationId = String(msg?.conversationId || "");
                const senderId = String(getEntityId(msg?.sender) || "");
                const shouldMarkRead =
                    messageConversationId === normalizedConversationId &&
                    senderId === currentUserId;

                return shouldMarkRead ? { ...msg, read: true } : msg;
            }),
            conversations: state.conversations.map((conv) => {
                if (String(conv?._id || "") !== normalizedConversationId) return conv;
                const lastSenderId = String(getEntityId(conv?.lastMessage?.sender) || "");
                if (lastSenderId !== currentUserId || !conv?.lastMessage) return conv;
                return {
                    ...conv,
                    lastMessage: {
                        ...conv.lastMessage,
                        read: true,
                    },
                };
            }),
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

    setOnlineUsers: (userIds = []) => {
        set({ onlineUsers: Array.from(new Set((userIds || []).map((id) => String(id)))) });
    },

    setUserOnline: (userId) => {
        if (!userId) return;
        set((state) => {
            const normalizedId = String(userId);
            if (state.onlineUsers.includes(normalizedId)) return state;
            return { onlineUsers: [...state.onlineUsers, normalizedId] };
        });
    },

    setUserOffline: (userId) => {
        if (!userId) return;
        set((state) => ({
            onlineUsers: state.onlineUsers.filter((id) => id !== String(userId)),
        }));
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

    /* ===================== BLOCK USER ===================== */
    blockUser: async (userId) => {
        try {
            const res = await api.post(`/chat/block/${userId}`);
            if (res.data.success) {
                set({ isBlocked: true });
                return { success: true, message: res.data.message };
            }
            return { success: false, message: res.data.message };
        } catch (err) {
            console.error("Failed to block user:", err);
            return { success: false, message: err.response?.data?.message || "Failed to block user" };
        }
    },

    /* ===================== UNBLOCK USER ===================== */
    unblockUser: async (userId) => {
        try {
            const res = await api.post(`/chat/unblock/${userId}`);
            if (res.data.success) {
                set({ isBlocked: false });
                return { success: true, message: res.data.message };
            }
            return { success: false, message: res.data.message };
        } catch (err) {
            console.error("Failed to unblock user:", err);
            return { success: false, message: err.response?.data?.message || "Failed to unblock user" };
        }
    },

    /* ===================== GET BLOCK STATUS ===================== */
    getBlockStatus: async (userId) => {
        try {
            const res = await api.get(`/chat/block-status/${userId}`);
            if (res.data.success) {
                set({ isBlocked: res.data.isBlocked });
                return res.data.isBlocked;
            }
            return false;
        } catch (err) {
            console.error("Failed to get block status:", err);
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
            onlineUsers: [],
            isMobileChatOpen: false,
            isBlocked: false,
            hasBlockedUser: false,
        });
    },
}));
