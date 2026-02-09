import React, { useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { useChatStore } from '../../store/ChatStore';
import { useAuthStore } from '../../store/AuthStore';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const ChatScreen = ({ navigation }) => {
    const { conversations, fetchConversations, loading, setCurrentChat } = useChatStore();
    const { user } = useAuthStore();

    useEffect(() => {
        fetchConversations();
    }, []);

    const handleChatPress = (conversation) => {
        // Get the friend object from the conversation
        // Structure: conversation.friend (if expanded) or we derive it
        // The web store handles this, but let's check local structure
        // mobile ChatStore fetchConversations sets conversations directly

        // In ChatStore.js logic:
        // set({ conversations: res.data.data, loading: false });
        // Assuming backend returns array of conversation objects with participants

        const friend = conversation.friend; // Usually structured this way in the backend response if tailored for frontend

        setCurrentChat(friend);
        navigation.navigate('ChatDetails');
    };

    const renderItem = ({ item }) => {
        const friend = item.friend;
        const lastMessage = item.lastMessage;
        const isUnread = lastMessage && !lastMessage.read && lastMessage.sender !== user._id;

        return (
            <TouchableOpacity
                style={styles.chatItem}
                onPress={() => handleChatPress(item)}
            >
                <Image
                    source={{ uri: friend.avatar || 'https://via.placeholder.com/50' }}
                    style={styles.avatar}
                />
                <View style={styles.chatInfo}>
                    <View style={styles.topRow}>
                        <Text style={styles.username}>
                            {friend.firstname} {friend.lastname}
                        </Text>
                        {lastMessage && (
                            <Text style={styles.time}>{dayjs(lastMessage.createdAt).fromNow(true)}</Text>
                        )}
                    </View>

                    <View style={styles.bottomRow}>
                        <Text style={[styles.lastMessage, isUnread && styles.unreadMessage]} numberOfLines={1}>
                            {lastMessage ? (
                                <>
                                    {lastMessage.sender === user._id && 'You: '}
                                    {lastMessage.text}
                                </>
                            ) : (
                                'Start a conversation'
                            )}
                        </Text>
                        {isUnread && <View style={styles.unreadDot} />}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading && conversations.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7c3aed" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Messages</Text>
                <TouchableOpacity>
                    <Ionicons name="create-outline" size={24} color="#1f2937" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={conversations}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No conversations yet</Text>
                        <Text style={styles.emptySubText}>Start chatting with your friends!</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60, // Safe area filler roughly
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    listContent: {
        paddingVertical: 10,
    },
    chatItem: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 12,
        alignItems: 'center',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        marginRight: 16,
        backgroundColor: '#f3f4f6',
    },
    chatInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    username: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
    },
    time: {
        fontSize: 12,
        color: '#9ca3af',
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    lastMessage: {
        fontSize: 14,
        color: '#6b7280',
        flex: 1,
        marginRight: 8,
    },
    unreadMessage: {
        color: '#1f2937',
        fontWeight: '600',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#7c3aed',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#4b5563',
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: '#9ca3af',
    },
});

export default ChatScreen;
