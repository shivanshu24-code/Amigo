import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar, Image, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFriendStore } from '../store/FriendStore';
import { useChatStore } from '../store/ChatStore';
import { useAuthStore } from '../store/AuthStore';

const Avatar = ({ src, name, size = 40 }) => {
    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const getColorFromName = (name) => {
        if (!name) return '#9ca3af';
        const colors = [
            '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
            '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#6366f1'
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    if (src) {
        return <Image source={{ uri: src }} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} />;
    }

    return (
        <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2, backgroundColor: getColorFromName(name) }]}>
            <Text style={[styles.avatarText, { fontSize: size / 2.5 }]}>{getInitials(name)}</Text>
        </View>
    );
};

const Navbar = () => {
    const navigation = useNavigation();
    const { pendingRequests, fetchPendingRequests, acceptRequest, rejectRequest } = useFriendStore();
    const { conversations, fetchConversations, setCurrentChat, loading } = useChatStore();
    const { user, logout } = useAuthStore();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showChats, setShowChats] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    // Fetch data when dropdowns open
    useEffect(() => {
        fetchPendingRequests(); // Fetch immediately for badge
    }, []);

    useEffect(() => {
        if (showChats) {
            fetchConversations();
        }
    }, [showChats]);

    useEffect(() => {
        if (showNotifications) {
            fetchPendingRequests();
        }
    }, [showNotifications]);

    const handleAcceptRequest = async (requestId) => {
        await acceptRequest(requestId);
        fetchPendingRequests();
    };

    const handleRejectRequest = async (requestId) => {
        await rejectRequest(requestId);
        fetchPendingRequests();
    };

    const handleChatClick = (friend) => {
        setCurrentChat(friend);
        setShowChats(false);
        navigation.navigate('Chat');
    };

    const handleLogout = () => {
        logout();
        navigation.navigate('Login');
    };

    const closeAllDropdowns = () => {
        setShowNotifications(false);
        setShowChats(false);
        setShowProfileMenu(false);
    };

    // Mock notifications
    const recentNotifications = [
        { id: 1, text: "Rahul liked your post", time: "2m ago" },
        { id: 2, text: "Megha commented on your photo", time: "1h ago" },
        { id: 3, text: "New story from Arjun", time: "3h ago" },
    ];

    const renderNotificationsDropdown = () => {
        if (!showNotifications) return null;

        return (
            <TouchableWithoutFeedback onPress={closeAllDropdowns}>
                <View style={styles.dropdownOverlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.dropdownContainer}>
                            <View style={styles.dropdownHeader}>
                                <Text style={styles.dropdownTitle}>Notifications</Text>
                            </View>

                            <ScrollView style={{ maxHeight: 400 }}>
                                {/* Friend Requests Section */}
                                <View style={styles.sectionDivider}>
                                    <View style={styles.sectionHeader}>
                                        <Ionicons name="person-add-outline" size={14} color="#6b7280" />
                                        <Text style={styles.sectionTitle}>FRIEND REQUESTS</Text>
                                    </View>

                                    {pendingRequests && pendingRequests.length > 0 ? (
                                        pendingRequests.map((req) => (
                                            <View key={req._id} style={styles.notificationItem}>
                                                <Avatar
                                                    src={req.sender?.avatar}
                                                    name={req.sender?.firstname ? `${req.sender?.firstname} ${req.sender?.lastname}` : req.sender?.username}
                                                    size={40}
                                                />
                                                <View style={styles.notifContent}>
                                                    <Text style={styles.notifName} numberOfLines={1}>
                                                        {req.sender?.firstname} {req.sender?.lastname}
                                                    </Text>
                                                    <Text style={styles.notifSubtext}>wants to connect</Text>
                                                </View>
                                                <View style={styles.actionButtons}>
                                                    <TouchableOpacity
                                                        style={[styles.actionBtn, styles.acceptBtn]}
                                                        onPress={() => handleAcceptRequest(req._id)}
                                                    >
                                                        <Ionicons name="checkmark" size={16} color="white" />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={[styles.actionBtn, styles.rejectBtn]}
                                                        onPress={() => handleRejectRequest(req._id)}
                                                    >
                                                        <Ionicons name="close" size={16} color="#4b5563" />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        ))
                                    ) : (
                                        <Text style={styles.emptyStateText}>No pending requests</Text>
                                    )}
                                </View>

                                {/* Recent Notifications Section */}
                                <View>
                                    <View style={styles.sectionHeader}>
                                        <Text style={styles.sectionTitle}>RECENT</Text>
                                    </View>
                                    {recentNotifications.map((notif) => (
                                        <TouchableOpacity key={notif.id} style={styles.notificationItem}>
                                            <View style={styles.iconPlaceholder}>
                                                <Ionicons name="notifications" size={20} color="#7c3aed" />
                                            </View>
                                            <View style={styles.notifContent}>
                                                <Text style={styles.notifText}>{notif.text}</Text>
                                                <Text style={styles.timeText}>{notif.time}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        );
    };

    const renderChatsDropdown = () => {
        if (!showChats) return null;

        return (
            <TouchableWithoutFeedback onPress={closeAllDropdowns}>
                <View style={styles.dropdownOverlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.dropdownContainer}>
                            <View style={[styles.dropdownHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                                <Text style={styles.dropdownTitle}>Recent Chats</Text>
                                <TouchableOpacity onPress={() => { closeAllDropdowns(); navigation.navigate('Chat'); }}>
                                    <Text style={styles.viewAllText}>View All</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={{ maxHeight: 400 }}>
                                {loading ? (
                                    // Skeleton Loading
                                    [1, 2, 3].map((n) => (
                                        <View key={n} style={styles.notificationItem}>
                                            <View style={styles.skeletonAvatar} />
                                            <View style={styles.notifContent}>
                                                <View style={styles.skeletonLine} />
                                                <View style={[styles.skeletonLine, { width: '70%', marginTop: 4 }]} />
                                            </View>
                                        </View>
                                    ))
                                ) : conversations && conversations.length > 0 ? (
                                    conversations.slice(0, 5).map((convo) => (
                                        <TouchableOpacity
                                            key={convo._id || convo.friend?._id}
                                            style={styles.notificationItem}
                                            onPress={() => handleChatClick(convo.friend)}
                                        >
                                            <View style={{ position: 'relative' }}>
                                                <Avatar
                                                    src={convo.friend?.avatar}
                                                    name={convo.friend?.username}
                                                    size={48}
                                                />
                                                <View style={styles.onlineStatus} />
                                            </View>

                                            <View style={styles.notifContent}>
                                                <Text style={styles.notifName} numberOfLines={1}>
                                                    {convo.friend?.username || 'Unknown'}
                                                </Text>
                                                <Text style={styles.notifSubtext} numberOfLines={1}>
                                                    {convo.lastMessage?.content || "Start a conversation"}
                                                </Text>
                                            </View>
                                            <Text style={styles.timeText}>
                                                {convo.lastMessage?.createdAt
                                                    ? new Date(convo.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                    : ""}
                                            </Text>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <View style={styles.emptyState}>
                                        <Ionicons name="chatbubble-outline" size={40} color="#d1d5db" style={{ marginBottom: 8 }} />
                                        <Text style={styles.emptyStateText}>No conversations yet</Text>
                                        <TouchableOpacity onPress={() => { closeAllDropdowns(); navigation.navigate('Users'); }}>
                                            <Text style={styles.viewAllText}>Find friends to chat</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </ScrollView>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        );
    };

    const renderProfileDropdown = () => {
        if (!showProfileMenu) return null;

        return (
            <TouchableWithoutFeedback onPress={closeAllDropdowns}>
                <View style={styles.dropdownOverlay}>
                    <TouchableWithoutFeedback>
                        <View style={[styles.dropdownContainer, { width: 240 }]}>
                            <View style={[styles.dropdownHeader, styles.profileHeader]}>
                                <Text style={styles.profileName} numberOfLines={1}>
                                    {user?.firstname} {user?.lastname}
                                </Text>
                                <Text style={styles.profileUsername} numberOfLines={1}>
                                    @{user?.username || "username"}
                                </Text>
                            </View>

                            <View style={styles.menuItems}>
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={() => { closeAllDropdowns(); navigation.navigate('Profile'); }}
                                >
                                    <Ionicons name="person-outline" size={16} color="#374151" />
                                    <Text style={styles.menuItemText}>Profile</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem}>
                                    <Ionicons name="settings-outline" size={16} color="#374151" />
                                    <Text style={styles.menuItemText}>Settings</Text>
                                </TouchableOpacity>

                                <View style={styles.menuDivider} />

                                <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
                                    <Ionicons name="log-out-outline" size={16} color="#dc2626" />
                                    <Text style={styles.logoutText}>Logout</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        );
    };

    return (
        <View style={{ zIndex: 2000 }}>
            <View style={styles.topHeader}>
                <TouchableOpacity onPress={() => navigation.navigate('Feed')}>
                    <Text style={styles.logo}>Amigo</Text>
                </TouchableOpacity>

                <View style={styles.headerIcons}>
                    {/* Notifications */}
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => {
                            setShowChats(false);
                            setShowProfileMenu(false);
                            setShowNotifications(!showNotifications);
                        }}
                    >
                        <View>
                            <Ionicons name="notifications-outline" size={24} color="#374151" />
                            {pendingRequests?.length > 0 && (
                                <View style={[styles.badge, { backgroundColor: '#ef4444' }]}>
                                    <Text style={styles.badgeText}>{pendingRequests.length}</Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>

                    {/* Chats */}
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => {
                            setShowNotifications(false);
                            setShowProfileMenu(false);
                            setShowChats(!showChats);
                        }}
                    >
                        <View>
                            <Ionicons name="chatbubble-ellipses-outline" size={24} color="#374151" />
                            {conversations?.length > 0 && (
                                <View style={[styles.badge, { backgroundColor: '#3b82f6' }]}>
                                    <Text style={styles.badgeText}>
                                        {conversations.length > 9 ? "9+" : conversations.length}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>

                    {/* Profile */}
                    <TouchableOpacity
                        onPress={() => {
                            setShowNotifications(false);
                            setShowChats(false);
                            setShowProfileMenu(!showProfileMenu);
                        }}
                    >
                        <View style={styles.profileButton}>
                            <Avatar
                                src={user?.avatar}
                                name={user?.firstname ? `${user.firstname} ${user.lastname}` : user?.username}
                                size={40}
                            />
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Dropdowns */}
            {renderNotificationsDropdown()}
            {renderChatsDropdown()}
            {renderProfileDropdown()}
        </View>
    );
};

const styles = StyleSheet.create({
    topHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        backgroundColor: 'white',
    },
    logo: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000000',
    },
    headerIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    iconButton: {
        padding: 4,
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 5,
        borderWidth: 2,
        borderColor: 'white',
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    profileButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
    },
    dropdownOverlay: {
        position: 'absolute',
        top: Platform.OS === 'android' ? StatusBar.currentHeight + 60 : 60,
        left: 0,
        right: 0,
        // bottom: -1000,
        backgroundColor: 'rgba(0,0,0,0.4)',
        zIndex: 1000,
    },
    dropdownContainer: {
        position: 'absolute',
        top: -22,
        right: 16,
        width: 320,
        backgroundColor: 'white',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 15,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        overflow: 'hidden',
    },
    dropdownHeader: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    dropdownTitle: {
        fontWeight: '600',
        fontSize: 16,
        color: '#1f2937',
    },
    sectionDivider: {
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#f9fafb',
        gap: 8,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '700',
        color: '#6b7280',
        letterSpacing: 0.5,
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 12,
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        resizeMode: 'cover',
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: 'white',
        fontWeight: '600',
    },
    notifContent: {
        flex: 1,
        minWidth: 0,
    },
    notifName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    notifSubtext: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    notifText: {
        fontSize: 13,
        color: '#1f2937',
    },
    timeText: {
        fontSize: 11,
        color: '#9ca3af',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    acceptBtn: {
        backgroundColor: '#7c3aed',
    },
    rejectBtn: {
        backgroundColor: '#e5e7eb',
    },
    iconPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ede9fe',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyStateText: {
        padding: 12,
        textAlign: 'center',
        color: '#6b7280',
        fontSize: 13,
    },
    emptyState: {
        padding: 32,
        alignItems: 'center',
    },
    viewAllText: {
        color: '#7c3aed',
        fontSize: 12,
        fontWeight: '600',
    },
    onlineStatus: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#10b981',
        borderWidth: 2,
        borderColor: 'white',
    },
    skeletonAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#e5e7eb',
    },
    skeletonLine: {
        height: 12,
        backgroundColor: '#e5e7eb',
        borderRadius: 6,
        width: '60%',
    },
    profileHeader: {
        backgroundColor: '#f9fafb',
    },
    profileName: {
        fontWeight: '600',
        fontSize: 15,
        color: '#111827',
    },
    profileUsername: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    menuItems: {
        padding: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
    },
    menuItemText: {
        fontSize: 14,
        color: '#374151',
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#e5e7eb',
        marginVertical: 4,
    },
    logoutItem: {
        backgroundColor: 'transparent',
    },
    logoutText: {
        fontSize: 14,
        color: '#dc2626',
    },
});

export default Navbar;