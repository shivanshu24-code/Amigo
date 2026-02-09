import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, SafeAreaView, StatusBar, Platform, TouchableOpacity, Image, Modal, TouchableWithoutFeedback } from 'react-native';
import { usePostStore } from '../../store/PostStore';
import { useFriendStore } from '../../store/FriendStore';
import Post from '../../components/Post';
import Story from '../../components/Story';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Navbar from '../../components/Navbar';

const FeedScreen = ({ navigation }) => {
    const { posts, loading, fetchPosts, error } = usePostStore();
    const { pendingRequests, fetchPendingRequests, acceptRequest, rejectRequest } = useFriendStore();
    const [refreshing, setRefreshing] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        fetchPosts();
        fetchPendingRequests();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchPosts(), fetchPendingRequests()]);
        setRefreshing(false);
    };

    const handleAcceptRequest = async (requestId) => {
        await acceptRequest(requestId);
        // fetchPendingRequests is handled in store but we can force refresh if needed
    };

    const handleRejectRequest = async (requestId) => {
        await rejectRequest(requestId);
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
            <TouchableWithoutFeedback onPress={() => setShowNotifications(false)}>
                <View style={styles.dropdownOverlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.dropdownContainer}>
                            <View style={styles.dropdownHeader}>
                                <Text style={styles.dropdownTitle}>Notifications</Text>
                            </View>

                            {/* Friend Requests */}
                            <View style={styles.sectionHeader}>
                                <Ionicons name="person-add-outline" size={14} color="#6b7280" />
                                <Text style={styles.sectionTitle}>FRIEND REQUESTS</Text>
                            </View>

                            {pendingRequests && pendingRequests.length > 0 ? (
                                pendingRequests.map((req) => (
                                    <View key={req._id} style={styles.notificationItem}>
                                        <Image
                                            source={{ uri: req.sender?.avatar || 'https://via.placeholder.com/40' }}
                                            style={styles.notifAvatar}
                                        />
                                        <View style={styles.notifContent}>
                                            <Text style={styles.notifText}>
                                                <Text style={styles.boldText}>{req.sender?.firstname} {req.sender?.lastname}</Text>
                                                <Text> wants to connect</Text>
                                            </Text>
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

                            {/* Recent Notifications */}
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>RECENT</Text>
                            </View>
                            {recentNotifications.map((notif) => (
                                <View key={notif.id} style={styles.notificationItem}>
                                    <View style={styles.iconPlaceholder}>
                                        <Ionicons name="notifications" size={16} color="#7c3aed" />
                                    </View>
                                    <View style={styles.notifContent}>
                                        <Text style={styles.notifText}>{notif.text}</Text>
                                        <Text style={styles.timeText}>{notif.time}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        );
    };

    const renderHeader = () => (
        <>
            <Story />
            {/* Separator */}
            <View style={{ height: 8, backgroundColor: '#f3f4f6' }} />
        </>
    );

    const renderEmpty = () => (
        !loading && (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No posts yet</Text>
                <Text style={styles.emptySubText}>Be the first to share something!</Text>
            </View>
        )
    );

    if (loading && posts.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7c3aed" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#white" />

            {/* Header matching Frontend Navbar */}
            <Navbar/>

            <FlatList
                data={posts}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => <Post post={item} />}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmpty}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7c3aed']} />
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
            {renderNotificationsDropdown()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    topHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        backgroundColor: 'white',
    },
    logo: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    logoDot: {
        color: '#ec4899',
    },
    headerIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconButton: {
        padding: 4,
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#ef4444',
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'white',
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    listContent: {
        paddingBottom: 20,
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
    dropdownOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        elevation: 1000,
        justifyContent: 'flex-start', // Align to top
    },
    dropdownContainer: {
        position: 'absolute',
        top: Platform.OS === 'android' ? StatusBar.currentHeight + 60 : 100,
        right: 16,
        width: 300,
        backgroundColor: 'white',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#f3f4f6',
        paddingBottom: 8,
    },
    dropdownHeader: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    dropdownTitle: {
        fontWeight: '600',
        fontSize: 16,
        color: '#1f2937',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#f9fafb',
        gap: 6,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#6b7280',
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 12,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    notifAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
    },
    notifContent: {
        flex: 1,
    },
    notifText: {
        fontSize: 13,
        color: '#374151',
    },
    boldText: {
        fontWeight: '600',
        color: '#1f2937',
    },
    timeText: {
        fontSize: 11,
        color: '#9ca3af',
        marginTop: 2,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 6,
    },
    actionBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
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
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f3e8ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    emptyStateText: {
        padding: 16,
        textAlign: 'center',
        color: '#9ca3af',
        fontSize: 13,
    },
});

export default FeedScreen;
