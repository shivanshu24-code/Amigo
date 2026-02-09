import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    Image,
    StyleSheet,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    Platform,
    ScrollView,
    useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFriendStore } from '../../store/FriendStore';
import { useChatStore } from '../../store/ChatStore';
import { useAuthStore } from '../../store/AuthStore';
import api from '../../services/api';

// Avatar Component
const Avatar = ({ src, name, size = 80 }) => {
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
        return <Image source={{ uri: src }} style={[styles.avatar, { width: size, height: size, borderRadius: 12 }]} />;
    }

    return (
        <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: 12, backgroundColor: getColorFromName(name) }]}>
            <Text style={[styles.avatarText, { fontSize: size / 3 }]}>{getInitials(name)}</Text>
        </View>
    );
};

const UsersScreen = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [sendingRequest, setSendingRequest] = useState(null);
    const [processingRequest, setProcessingRequest] = useState(null);

    // Determine number of columns based on screen width
    const numColumns = width > 600 ? 2 : 1;
    const cardWidth = width > 600 ? '48%' : '100%';

    const {
        friends,
        sentRequests,
        receivedRequests,
        pendingRequests,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        fetchAllFriendData,
    } = useFriendStore();

    const { setCurrentChat } = useChatStore();
    const { user: currentUser } = useAuthStore();

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/users/allUsers');
            setUsers(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchAllFriendData();
    }, []);

    const handleSendRequest = async (userId) => {
        setSendingRequest(userId);
        await sendFriendRequest(userId);
        setSendingRequest(null);
    };

    const handleAcceptRequest = async (requestId, senderId) => {
        setProcessingRequest(senderId);
        await acceptFriendRequest(requestId, senderId);
        setProcessingRequest(null);
    };

    const handleRejectRequest = async (requestId, senderId) => {
        setProcessingRequest(senderId);
        await rejectFriendRequest(requestId, senderId);
        setProcessingRequest(null);
    };

    const handleMessageUser = (user) => {
        setCurrentChat(user);
        navigation.navigate('Chat');
    };

    const getFriendStatus = (userId) => {
        // Check if already friends
        const isFriend = friends.some(f => (f._id === userId || f === userId));
        if (isFriend) return { status: 'friends' };

        // Check if request was sent
        const isSent = sentRequests.includes(userId);
        if (isSent) return { status: 'pending' };

        // Check if request was received
        const receivedRequest = pendingRequests.find(r => r.sender?._id === userId);
        if (receivedRequest) return { status: 'received', requestId: receivedRequest._id };

        return { status: 'none' };
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.username || user.email || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
            (user.firstname || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.lastname || "").toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;
        if (user._id === currentUser._id) return false;

        if (activeTab === "friends") {
            const status = getFriendStatus(user._id);
            return status.status === "friends";
        }
        if (activeTab === "requests") {
            const status = getFriendStatus(user._id);
            return status.status === "received" || status.status === "pending";
        }
        return true;
    });

    const getSubtleColor = (index) => {
        const colors = [
            '#f8fafc', // slate-50
            '#f9fafb', // gray-50
            '#fafafa', // zinc-50
            '#fafaf9', // stone-50
        ];
        return colors[index % colors.length];
    };

    const renderUserCard = ({ item: user, index }) => {
        const statusResult = getFriendStatus(user._id);
        const isLoading = sendingRequest === user._id;
        const isProcessing = processingRequest === user._id;
        const status = statusResult.status;
        const requestId = statusResult.requestId;
        const isFriend = status === "friends";

        const userName = user.firstname && user.lastname
            ? `${user.firstname} ${user.lastname}`
            : user.username || "User";

        return (
            <View style={[styles.userCard, { width: cardWidth }]}>
                {/* Subtle Banner */}
                <View style={[styles.cardBanner, { backgroundColor: getSubtleColor(index) }]}>
                    {user.isVerified && (
                        <View style={styles.verifiedBadge}>
                            <Ionicons name="sparkles" size={12} color="#3b82f6" />
                            <Text style={styles.verifiedText}>Verified</Text>
                        </View>
                    )}
                </View>

                {/* Avatar */}
                <View style={styles.avatarContainer}>
                    <TouchableOpacity
                        style={styles.avatarWrapper}
                        onPress={() => navigation.navigate('Profile', { userId: user._id })}
                    >
                        <Avatar
                            src={user.avatar}
                            name={userName}
                            size={80}
                        />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.cardContent}>
                    {/* Name & Username */}
                    <View style={styles.nameSection}>
                        <TouchableOpacity onPress={() => navigation.navigate('Profile', { userId: user._id })}>
                            <Text style={styles.userName}>{userName}</Text>
                        </TouchableOpacity>
                        <Text style={styles.userHandle}>@{user.username || user.email?.split("@")[0]}</Text>
                    </View>

                    {/* Course/Year */}
                    {(user.course || user.year) && (
                        <View style={styles.courseSection}>
                            <View style={styles.courseDot} />
                            <Text style={styles.courseText}>
                                {user.course}{user.year ? ` • ${user.year}` : ""}
                            </Text>
                        </View>
                    )}

                    {/* Bio */}
                    {user.bio && (
                        <Text style={styles.bioText} numberOfLines={2}>
                            {user.bio}
                        </Text>
                    )}

                    {/* Stats */}
                    <View style={styles.statsContainer}>
                        <View style={styles.friendsCount}>
                            <Text style={styles.statsNumber}>{user.friends?.length || 0}</Text>
                            <Text style={styles.statsLabel}>FRIENDS</Text>
                        </View>
                        {user.interest && (
                            <View style={styles.interestsContainer}>
                                {user.interest.split(",").slice(0, 2).map((tag, i) => (
                                    <View key={i} style={styles.interestTag}>
                                        <Text style={styles.interestText}>{tag.trim()}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtonsContainer}>
                        {isFriend ? (
                            <>
                                <TouchableOpacity
                                    style={styles.messageButton}
                                    onPress={() => handleMessageUser(user)}
                                >
                                    <Ionicons name="chatbubble-outline" size={16} color="white" />
                                    <Text style={styles.messageButtonText}>Message</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.friendIconButton}>
                                    <Ionicons name="checkmark" size={16} color="#6b7280" />
                                </TouchableOpacity>
                            </>
                        ) : status === "pending" ? (
                            <View style={styles.pendingButton}>
                                <Text style={styles.pendingButtonText}>Request Sent</Text>
                            </View>
                        ) : status === "received" ? (
                            <View style={styles.requestButtonsContainer}>
                                <TouchableOpacity
                                    style={styles.confirmButton}
                                    onPress={() => handleAcceptRequest(requestId, user._id)}
                                    disabled={isProcessing}
                                >
                                    <Text style={styles.confirmButtonText}>Confirm</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => handleRejectRequest(requestId, user._id)}
                                    disabled={isProcessing}
                                >
                                    <Text style={styles.deleteButtonText}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.addFriendButton}
                                onPress={() => handleSendRequest(user._id)}
                                disabled={isLoading}
                            >
                                <Ionicons name="person-add-outline" size={16} color="#374151" />
                                <Text style={styles.addFriendText}>
                                    {isLoading ? "Adding..." : "Add Friend"}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    const renderSkeletonCard = () => (
        <View style={[styles.userCard, { width: cardWidth }]}>
            <View style={[styles.cardBanner, { backgroundColor: '#f3f4f6' }]} />
            <View style={styles.avatarContainer}>
                <View style={[styles.skeletonAvatar, styles.avatarWrapper]} />
            </View>
            <View style={styles.cardContent}>
                <View style={styles.skeletonLine} />
                <View style={[styles.skeletonLine, { width: '60%', marginTop: 8 }]} />
                <View style={[styles.skeletonLine, { width: '100%', marginTop: 16 }]} />
                <View style={[styles.skeletonLine, { width: '80%', marginTop: 4 }]} />
                <View style={styles.statsContainer}>
                    <View style={styles.skeletonStats} />
                    <View style={styles.skeletonStats} />
                </View>
                <View style={styles.skeletonButton} />
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>People</Text>
                <Text style={styles.subtitle}>Connect with students and friends</Text>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search-outline" size={16} color="#9ca3af" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name or username..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#9ca3af"
                    />
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
                    {[
                        { id: "all", label: "Everyone", count: users.filter(u => u._id !== currentUser._id).length },
                        { id: "friends", label: "Friends", count: friends.length },
                        { id: "requests", label: "Requests", count: receivedRequests.length + sentRequests.length },
                    ].map(tab => (
                        <TouchableOpacity
                            key={tab.id}
                            onPress={() => setActiveTab(tab.id)}
                            style={[
                                styles.tab,
                                activeTab === tab.id && styles.activeTab
                            ]}
                        >
                            <Text style={[
                                styles.tabLabel,
                                activeTab === tab.id && styles.activeTabLabel
                            ]}>
                                {tab.label}
                            </Text>
                            {tab.count > 0 && (
                                <View style={[
                                    styles.tabBadge,
                                    activeTab === tab.id && styles.activeTabBadge
                                ]}>
                                    <Text style={[
                                        styles.tabBadgeText,
                                        activeTab === tab.id && styles.activeTabBadgeText
                                    ]}>
                                        {tab.count}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Content */}
            {loading ? (
                <FlatList
                    data={[1, 2, 3, 4, 5, 6]}
                    numColumns={numColumns}
                    key={numColumns} // Important: remount FlatList when numColumns changes
                    keyExtractor={(item) => item.toString()}
                    renderItem={renderSkeletonCard}
                    contentContainerStyle={styles.listContent}
                    columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : null}
                />
            ) : filteredUsers.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconContainer}>
                        <Ionicons name="people-outline" size={32} color="#d1d5db" />
                    </View>
                    <Text style={styles.emptyTitle}>
                        {searchQuery ? "No matches found" : "No users yet"}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                        {searchQuery ? "Try searching with different keywords" : "Start connecting with people!"}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredUsers}
                    numColumns={numColumns}
                    key={numColumns} // Important: remount FlatList when numColumns changes
                    keyExtractor={(item) => item._id}
                    renderItem={renderUserCard}
                    contentContainerStyle={styles.listContent}
                    columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : null}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? 32 : 16,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 24,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 48,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#111827',
    },
    tabsContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    tabsContent: {
        paddingHorizontal: 16,
        gap: 24,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 8,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#111827',
    },
    tabLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280',
    },
    activeTabLabel: {
        color: '#111827',
        fontWeight: '600',
    },
    tabBadge: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    activeTabBadge: {
        backgroundColor: '#f3f4f6',
    },
    tabBadgeText: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
    },
    activeTabBadgeText: {
        color: '#111827',
    },
    listContent: {
        padding: 16,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    userCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f3f4f6',
        overflow: 'hidden',
        marginBottom: 16,
    },
    cardBanner: {
        height: 80,
        borderBottomWidth: 1,
        borderBottomColor: '#f9fafb',
        position: 'relative',
    },
    verifiedBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    verifiedText: {
        fontSize: 10,
        color: '#6b7280',
        fontWeight: '500',
    },
    avatarContainer: {
        paddingHorizontal: 20,
        position: 'relative',
    },
    avatarWrapper: {
        position: 'absolute',
        top: -40,
        left: 20,
        backgroundColor: 'white',
        padding: 4,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f3f4f6',
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
        fontWeight: '700',
    },
    cardContent: {
        paddingTop: 48,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    nameSection: {
        marginBottom: 12,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    userHandle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 2,
    },
    courseSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    courseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#3b82f6',
    },
    courseText: {
        fontSize: 14,
        color: '#4b5563',
        fontWeight: '500',
    },
    bioText: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20,
        marginBottom: 16,
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#f9fafb',
    },
    friendsCount: {
        alignItems: 'center',
        minWidth: 48,
    },
    statsNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    statsLabel: {
        fontSize: 10,
        color: '#9ca3af',
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    interestsContainer: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    interestTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 6,
    },
    interestText: {
        fontSize: 10,
        color: '#4b5563',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    messageButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#111827',
        paddingVertical: 8,
        borderRadius: 8,
    },
    messageButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    friendIconButton: {
        width: 36,
        height: 36,
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pendingButton: {
        flex: 1,
        backgroundColor: '#fffbeb',
        borderWidth: 1,
        borderColor: '#fef3c7',
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    pendingButtonText: {
        color: '#d97706',
        fontSize: 14,
        fontWeight: '600',
    },
    requestButtonsContainer: {
        flex: 1,
        flexDirection: 'row',
        gap: 8,
    },
    confirmButton: {
        flex: 1,
        backgroundColor: '#111827',
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    deleteButton: {
        width: 64,
        backgroundColor: '#f3f4f6',
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButtonText: {
        color: '#6b7280',
        fontSize: 14,
        fontWeight: '600',
    },
    addFriendButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#d1d5db',
        paddingVertical: 8,
        borderRadius: 8,
    },
    addFriendText: {
        color: '#374151',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyIconContainer: {
        width: 64,
        height: 64,
        backgroundColor: '#f9fafb',
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6b7280',
    },
    // Skeleton styles
    skeletonAvatar: {
        backgroundColor: '#e5e7eb',
    },
    skeletonLine: {
        height: 16,
        backgroundColor: '#e5e7eb',
        borderRadius: 4,
        width: '50%',
        marginBottom: 8,
    },
    skeletonStats: {
        width: 48,
        height: 32,
        backgroundColor: '#e5e7eb',
        borderRadius: 4,
    },
    skeletonButton: {
        height: 36,
        backgroundColor: '#e5e7eb',
        borderRadius: 8,
        marginTop: 8,
    },
});

export default UsersScreen;