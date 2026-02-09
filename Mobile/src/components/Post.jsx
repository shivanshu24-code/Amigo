import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/AuthStore';
import api from '../services/api';

const { width } = Dimensions.get('window');

const Post = ({ post }) => {
    const [isLiked, setIsLiked] = useState(post.likes.includes(useAuthStore.getState().user?._id));
    const [likeCount, setLikeCount] = useState(post.likes.length);
    const [imageHeight, setImageHeight] = useState(300);

    const handleLike = async () => {
        const originalLiked = isLiked;
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);

        try {
            await api.post(`/post/${post._id}/like`);
        } catch (err) {
            console.error('Like failed:', err);
            // Revert
            setIsLiked(originalLiked);
            setLikeCount(post.likes.length);
        }
    };

    const formattedTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(); // Simple formatting
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Image
                    source={{ uri: post.author?.avatar || 'https://via.placeholder.com/40' }}
                    style={styles.avatar}
                />
                <View style={styles.headerText}>
                    <Text style={styles.username}>{post.author?.username || 'Unknown User'}</Text>
                    <Text style={styles.time}>{formattedTime(post.createdAt)}</Text>
                </View>
                <TouchableOpacity>
                    <Ionicons name="ellipsis-horizontal" size={20} color="#6b7280" />
                </TouchableOpacity>
            </View>

            {/* Caption */}
            {post.caption && (
                <Text style={styles.caption}>{post.caption}</Text>
            )}

            {/* Media */}
            {post.media && (
                <View style={styles.mediaContainer}>
                    <Image
                        source={{ uri: typeof post.media === 'string' ? post.media : post.media[0]?.url }}
                        style={[styles.media, { height: imageHeight }]}
                        resizeMode="cover"
                        onLoad={(e) => {
                            const { width: imgW, height: imgH } = e.nativeEvent.source;
                            const ratio = imgH / imgW;
                            setImageHeight(width * ratio);
                        }}
                    />
                </View>
            )}

            {/* Engagement */}
            <View style={styles.actionContainer}>
                <View style={styles.leftActions}>
                    <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
                        <Ionicons
                            name={isLiked ? "heart" : "heart-outline"}
                            size={26}
                            color={isLiked ? "#ec4899" : "#1f2937"}
                        />
                        {likeCount > 0 && <Text style={styles.actionText}>{likeCount}</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="chatbubble-outline" size={24} color="#1f2937" />
                        {post.comments && post.comments.length > 0 && (
                            <Text style={styles.actionText}>{post.comments.length}</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="paper-plane-outline" size={24} color="#1f2937" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity>
                    <Ionicons name="bookmark-outline" size={24} color="#1f2937" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        marginBottom: 16,
        borderRadius: 0, // Flat design for feed
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#f3f4f6',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: '#e5e7eb',
    },
    headerText: {
        flex: 1,
    },
    username: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#1f2937',
    },
    time: {
        fontSize: 12,
        color: '#6b7280',
    },
    caption: {
        paddingHorizontal: 12,
        paddingBottom: 12,
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
    },
    mediaContainer: {
        width: '100%',
        backgroundColor: '#f3f4f6',
    },
    media: {
        width: '100%',
    },
    actionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 12,
        alignItems: 'center',
    },
    leftActions: {
        flexDirection: 'row',
        gap: 16,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
});

export default Post;
