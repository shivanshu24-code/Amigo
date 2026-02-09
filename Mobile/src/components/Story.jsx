import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/AuthStore';
const Story = () => {
    const { user } = useAuthStore();

    // For now, we only show the current user's story placeholder since backend story logic isn't fully implemented yet
    const stories = [
        {
            id: 'me',
            name: 'Your Story',
            avatar: user?.avatar,
            isSelf: true
        }
    ];

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
        >
            {stories.map((story) => (
                <TouchableOpacity key={story.id} style={styles.storyItem}>
                    <LinearGradient
                        colors={['#ec4899', '#8b5cf6']}
                        style={story.isSelf ? styles.noBorder : styles.storyBorder}
                    >
                        <View style={styles.imageContainer}>
                            <Image
                                source={{
                                    uri: story.avatar || 'https://via.placeholder.com/60',
                                }}
                                style={styles.avatar}
                            />
                            {story.isSelf && (
                                <View style={styles.addIcon}>
                                    <Text style={styles.plusText}>+</Text>
                                </View>
                            )}
                        </View>
                    </LinearGradient>
                    <Text style={styles.username} numberOfLines={1}>
                        {story.name}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        backgroundColor: 'white',
        maxHeight: 110,
    },
    contentContainer: {
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    storyItem: {
        alignItems: 'center',
        marginRight: 16,
        width: 70,
    },
    storyBorder: {
        width: 68,
        height: 68,
        borderRadius: 34,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 2,
    },
    noBorder: {
        width: 68,
        height: 68,
        borderRadius: 34,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 0,
        backgroundColor: 'white',
    },
    imageContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'white',
        padding: 2, // Inner border
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 32,
    },
    username: {
        fontSize: 11,
        color: '#1f2937',
        marginTop: 4,
        textAlign: 'center',
    },
    addIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#3b82f6',
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    plusText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: -2,
    },
});

export default Story;
