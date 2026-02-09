import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    SafeAreaView,
    Image,
} from 'react-native';
import { useChatStore } from '../../store/ChatStore';
import { useAuthStore } from '../../store/AuthStore';
import { Ionicons } from '@expo/vector-icons';
import { getSocket } from '../../socket/socket';

const ChatDetailsScreen = ({ navigation }) => {
    const { currentChat, messages, fetchMessages, sendMessage, receiveMessage } = useChatStore();
    const { user } = useAuthStore();
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef(null);

    useEffect(() => {
        if (currentChat) {
            fetchMessages(currentChat._id);
        }
    }, [currentChat]);

    useEffect(() => {
        const socket = getSocket();
        if (socket) {
            socket.on('receive-message', (newMessage) => {
                receiveMessage(newMessage); // Update store
            });
        }

        return () => {
            if (socket) {
                socket.off('receive-message');
            }
        };
    }, []);

    // Auto scroll to bottom when messages change
    // Note: inverted list is better for chat, but let's stick to simple first
    useEffect(() => {
        if (messages.length > 0 && flatListRef.current) {
            setTimeout(() => {
                flatListRef.current.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);


    const handleSend = async () => {
        if (!inputText.trim()) return;

        const text = inputText;
        setInputText(''); // Optimistic clear
        await sendMessage(text);
    };

    const renderMessage = ({ item }) => {
        const isMe = item.sender._id === user._id || item.sender === user._id;

        return (
            <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.theirMessage]}>
                {!isMe && (
                    <Image
                        source={{ uri: currentChat.avatar || 'https://via.placeholder.com/30' }}
                        style={styles.messageAvatar}
                    />
                )}
                <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
                    <Text style={[styles.messageText, isMe ? styles.myText : styles.theirText]}>
                        {item.text}
                    </Text>
                    <Text style={[styles.messageTime, isMe ? styles.myTime : styles.theirTime]}>
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    if (!currentChat) {
        return (
            <View style={styles.center}>
                <Text>No Chat Selected</Text>
            </View>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#1f2937" />
                </TouchableOpacity>

                <Image
                    source={{ uri: currentChat.avatar || 'https://via.placeholder.com/40' }}
                    style={styles.headerAvatar}
                />

                <View style={styles.headerInfo}>
                    <Text style={styles.headerName}>{currentChat.firstname}</Text>
                    <Text style={styles.headerStatus}>Online</Text>
                </View>

                <TouchableOpacity style={styles.headerAction}>
                    <Ionicons name="videocam-outline" size={24} color="#7c3aed" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerAction}>
                    <Ionicons name="call-outline" size={22} color="#7c3aed" />
                </TouchableOpacity>
            </View>

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item._id}
                renderItem={renderMessage}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {/* Input */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Type a message..."
                        placeholderTextColor="#9ca3af"
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                        onPress={handleSend}
                        disabled={!inputText.trim()}
                    >
                        <Ionicons name="send" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        backgroundColor: 'white',
    },
    backButton: {
        marginRight: 10,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    headerInfo: {
        flex: 1,
    },
    headerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    headerStatus: {
        fontSize: 12,
        color: '#10b981',
    },
    headerAction: {
        padding: 8,
        marginLeft: 4,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingBottom: 20
    },
    messageContainer: {
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    messageAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        marginRight: 8,
        marginBottom: 2
    },
    myMessage: {
        justifyContent: 'flex-end',
    },
    theirMessage: {
        justifyContent: 'flex-start',
    },
    bubble: {
        maxWidth: '75%',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    myBubble: {
        backgroundColor: '#7c3aed',
        borderBottomRightRadius: 4,
    },
    theirBubble: {
        backgroundColor: '#f3f4f6',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    myText: {
        color: 'white',
    },
    theirText: {
        color: '#1f2937',
    },
    messageTime: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    myTime: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    theirTime: {
        color: '#9ca3af',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        backgroundColor: 'white',
    },
    input: {
        flex: 1,
        backgroundColor: '#f9fafb',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        color: '#1f2937',
        maxHeight: 100,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#7c3aed',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    sendButtonDisabled: {
        backgroundColor: '#e5e7eb',
    },
});

export default ChatDetailsScreen;
