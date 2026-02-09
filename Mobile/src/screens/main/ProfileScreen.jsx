import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Platform,
    ActivityIndicator,
    FlatList,
    Dimensions
} from 'react-native';
// import { useProfileStore } from '../../store/ProfileStore'; // Removed unused import
import { useAuthStore } from '../../store/AuthStore';
import { usePostStore } from '../../store/PostStore';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';

// Since I haven't ported ProfileStore, I'll fetch profile data locally or use AuthStore if sufficient
// Web uses ProfileStore to fetch "My Profile" or "Other Profile".
// AuthStore has basic user info.
// Let's assume we want full profile data. I'll implement a simple fetch here.

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const IMAGE_SIZE = width / COLUMN_COUNT;

const ProfileScreen = ({ navigation }) => {
    const { user, logout } = useAuthStore();
    const { userPosts, fetchUserPosts, loading: postsLoading } = usePostStore();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('posts'); // posts, saved, liked

    const fetchProfile = async () => {
        try {
            setLoading(true);
            // Fetch my profile
            const res = await api.get('/profile/me');
            setProfile(res.data.data);

            // Fetch posts
            if (res.data.data?._id) {
                fetchUserPosts(res.data.data._id);
            }
        } catch (err) {
            console.error('Failed to fetch profile', err);
            // Fallback to auth user if API fails (e.g. if profile not created but user exists)
            setProfile(user);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleLogout = async () => {
        await logout();
        // Navigation handled by AppNavigator
    };

    const renderPostItem = ({ item }) => (
        <TouchableOpacity style={styles.postGridItem}>
            {item.media && item.media.length > 0 ? (
                <Image source={{ uri: item.media[0].url }} style={styles.postImage} />
            ) : (
                <View style={styles.textPostPlaceholder}>
                    <Text style={styles.textPostContent} numberOfLines={3}>{item.caption}</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7c3aed" />
            </View>
        );
    }

    if (!profile) return null;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="white" />
            <ScrollView showsVerticalScrollIndicator={false}>

                {/* Cover Image */}
                <View style={styles.coverContainer}>
                    {profile.coverImage ? (
                        <Image source={{ uri: profile.coverImage }} style={styles.coverImage} />
                    ) : (
                        <LinearGradient
                            colors={['#fbcfe8', '#e9d5ff', '#cffafe']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={styles.coverPlaceholder}
                        />
                    )}
                </View>

                {/* Profile Info */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: profile.avatar || 'https://via.placeholder.com/100' }}
                            style={styles.avatar}
                        />
                    </View>

                    <View style={styles.nameContainer}>
                        <Text style={styles.fullname}>{profile.firstname} {profile.lastname}</Text>
                        <Text style={styles.username}>@{profile.username}</Text>
                    </View>

                    {/* Stats */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{profile.friends?.length || 0}</Text>
                            <Text style={styles.statLabel}>Friends</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{userPosts.length}</Text>
                            <Text style={styles.statLabel}>Posts</Text>
                        </View>
                        <TouchableOpacity style={styles.editButton}>
                            <Text style={styles.editButtonText}>Edit Profile</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Bio */}
                    {profile.bio && (
                        <Text style={styles.bio}>{profile.bio}</Text>
                    )}

                    {/* Tags */}
                    <View style={styles.tagsContainer}>
                        {profile.course && (
                            <View style={styles.tag}>
                                <Text style={styles.tagText}>📚 {profile.course}</Text>
                            </View>
                        )}
                        {profile.year && (
                            <View style={styles.tag}>
                                <Text style={styles.tagText}>🎓 {profile.year}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
                        onPress={() => setActiveTab('posts')}
                    >
                        <Ionicons name="grid-outline" size={20} color={activeTab === 'posts' ? '#1f2937' : '#9ca3af'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'saved' && styles.activeTab]}
                        onPress={() => setActiveTab('saved')}
                    >
                        <Ionicons name="bookmark-outline" size={20} color={activeTab === 'saved' ? '#1f2937' : '#9ca3af'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'liked' && styles.activeTab]}
                        onPress={() => setActiveTab('liked')}
                    >
                        <Ionicons name="heart-outline" size={20} color={activeTab === 'liked' ? '#1f2937' : '#9ca3af'} />
                    </TouchableOpacity>
                </View>

                {/* Posts Grid */}
                {activeTab === 'posts' && (
                    <View style={styles.postsGrid}>
                        {userPosts.map((post) => (
                            <View key={post._id} style={styles.gridItemWrapper}>
                                {renderPostItem({ item: post })}
                            </View>
                        ))}
                    </View>
                )}

                {/* Placeholder for others */}
                {activeTab !== 'posts' && (
                    <View style={styles.emptyTab}>
                        <Text style={styles.emptyText}>Nothing here yet</Text>
                    </View>
                )}

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

            </ScrollView>
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
    },
    coverContainer: {
        height: 150,
        width: '100%',
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    coverPlaceholder: {
        width: '100%',
        height: '100%',
    },
    profileHeader: {
        paddingHorizontal: 20,
        marginTop: -40,
        paddingBottom: 20,
    },
    avatarContainer: {
        alignSelf: 'flex-start',
        padding: 3,
        backgroundColor: 'white',
        borderRadius: 50,
    },
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
    },
    nameContainer: {
        marginTop: 10,
    },
    fullname: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    username: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 2,
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
        gap: 24,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
    },
    editButton: {
        marginLeft: 'auto',
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    editButtonText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '600',
    },
    bio: {
        fontSize: 14,
        color: '#4b5563',
        lineHeight: 20,
        marginBottom: 16,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    tagText: {
        fontSize: 12,
        color: '#4b5563',
    },
    tabsContainer: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#f3f4f6',
        marginBottom: 1,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#1f2937',
    },
    postsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    gridItemWrapper: {
        width: IMAGE_SIZE,
        height: IMAGE_SIZE,
        padding: 1,
    },
    postGridItem: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    postImage: {
        width: '100%',
        height: '100%',
    },
    textPostPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        padding: 8,
        backgroundColor: '#f9fafb'
    },
    textPostContent: {
        fontSize: 10,
        color: '#4b5563',
        textAlign: 'center'
    },
    emptyTab: {
        padding: 40,
        alignItems: 'center'
    },
    emptyText: {
        color: '#9ca3af'
    },
    logoutButton: {
        margin: 20,
        backgroundColor: '#fef2f2',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    logoutText: {
        color: '#ef4444',
        fontWeight: '600',
    },
});

export default ProfileScreen;
