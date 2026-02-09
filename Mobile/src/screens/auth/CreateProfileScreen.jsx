import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/AuthStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

const CreateProfileScreen = ({ navigation }) => {
    const [form, setForm] = useState({
        firstname: '',
        lastname: '',
        course: '',
        year: '',
        interests: [],
        bio: '',
        username: '',
    });

    const interestsList = [
        'Coding',
        'Design',
        'Sports',
        'Music',
        'Photography',
        'AI',
        'Startups',
    ];

    const [loading, setLoading] = useState(false);
    const setProfileComplete = useAuthStore((state) => state.setProfileComplete);

    const toggleInterest = (item) => {
        setForm((prev) => ({
            ...prev,
            interests: prev.interests.includes(item)
                ? prev.interests.filter((i) => i !== item)
                : [...prev.interests, item],
        }));
    };

    const handleSubmit = async () => {
        if (loading) return;

        // Validation
        if (!form.firstname || !form.lastname || !form.username) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);

            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert('Error', 'Session expired. Please login again.');
                navigation.navigate('Login');
                return;
            }

            // Create profile (without image upload for now - can add expo-image-picker later)
            const res = await api.post('/profile', {
                firstname: form.firstname,
                lastname: form.lastname,
                username: form.username,
                course: form.course,
                year: form.year,
                bio: form.bio,
                interest: form.interests.join(','),
                avatar: '', // Can add image upload later
            });

            // Update auth store
            setProfileComplete({
                firstname: form.firstname,
                lastname: form.lastname,
                username: form.username,
                avatar: '',
                hasProfile: true,
            });

            Alert.alert('Success!', 'Profile created successfully!');
            // Navigation will be automatic via AppNavigator
        } catch (err) {
            Alert.alert(
                'Error',
                err.response?.data?.message || err.message || 'Failed to create profile'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <LinearGradient
                colors={['#4c1d95', '#7c3aed', '#c026d3']}
                style={styles.gradient}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Logo */}
                    <Text style={styles.logo}>
                        Amigo<Text style={styles.logoDot}>.</Text>
                    </Text>

                    {/* Profile Card */}
                    <View style={styles.card}>
                        <Text style={styles.title}>Create your profile</Text>
                        <Text style={styles.subtitle}>Tell us a bit about yourself</Text>

                        {/* Avatar Placeholder */}
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>📷</Text>
                            </View>
                            <Text style={styles.avatarHint}>Tap to upload (coming soon)</Text>
                        </View>

                        {/* Name Fields */}
                        <View style={styles.row}>
                            <View style={styles.halfInput}>
                                <Text style={styles.label}>FIRST NAME</Text>
                                <TextInput
                                    style={styles.input}
                                    value={form.firstname}
                                    onChangeText={(text) => setForm({ ...form, firstname: text })}
                                    placeholder="John"
                                    placeholderTextColor="#9ca3af"
                                    editable={!loading}
                                />
                            </View>

                            <View style={styles.halfInput}>
                                <Text style={styles.label}>LAST NAME</Text>
                                <TextInput
                                    style={styles.input}
                                    value={form.lastname}
                                    onChangeText={(text) => setForm({ ...form, lastname: text })}
                                    placeholder="Doe"
                                    placeholderTextColor="#9ca3af"
                                    editable={!loading}
                                />
                            </View>
                        </View>

                        {/* Username */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>USERNAME</Text>
                            <TextInput
                                style={styles.input}
                                value={form.username}
                                onChangeText={(text) => setForm({ ...form, username: text })}
                                placeholder="@username"
                                placeholderTextColor="#9ca3af"
                                autoCapitalize="none"
                                editable={!loading}
                            />
                        </View>

                        {/* Course & Year */}
                        <View style={styles.row}>
                            <View style={styles.halfInput}>
                                <Text style={styles.label}>COURSE</Text>
                                <TextInput
                                    style={styles.input}
                                    value={form.course}
                                    onChangeText={(text) => setForm({ ...form, course: text })}
                                    placeholder="CS/IT..."
                                    placeholderTextColor="#9ca3af"
                                    editable={!loading}
                                />
                            </View>

                            <View style={styles.halfInput}>
                                <Text style={styles.label}>YEAR</Text>
                                <TextInput
                                    style={styles.input}
                                    value={form.year}
                                    onChangeText={(text) => setForm({ ...form, year: text })}
                                    placeholder="1st Year"
                                    placeholderTextColor="#9ca3af"
                                    editable={!loading}
                                />
                            </View>
                        </View>

                        {/* Interests */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>INTERESTS</Text>
                            <View style={styles.interestsContainer}>
                                {interestsList.map((item) => (
                                    <TouchableOpacity
                                        key={item}
                                        onPress={() => toggleInterest(item)}
                                        style={[
                                            styles.interestChip,
                                            form.interests.includes(item) && styles.interestChipActive,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.interestText,
                                                form.interests.includes(item) && styles.interestTextActive,
                                            ]}
                                        >
                                            {item}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Bio */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>BIO</Text>
                            <TextInput
                                style={[styles.input, styles.bioInput]}
                                value={form.bio}
                                onChangeText={(text) => setForm({ ...form, bio: text })}
                                placeholder="Tell us something interesting..."
                                placeholderTextColor="#9ca3af"
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                editable={!loading}
                            />
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#ec4899', '#a855f7']}
                                style={styles.submitButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.submitButtonText}>Get Started</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    logo: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 24,
        alignSelf: 'flex-start',
    },
    logoDot: {
        color: '#ec4899',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#f3f4f6',
        borderWidth: 4,
        borderColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    avatarText: {
        fontSize: 40,
    },
    avatarHint: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 8,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    halfInput: {
        flex: 1,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
        color: '#4b5563',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 16,
        color: '#1f2937',
        fontWeight: '500',
    },
    bioInput: {
        height: 96,
        paddingTop: 12,
    },
    interestsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    interestChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#f3f4f6',
    },
    interestChipActive: {
        backgroundColor: '#7c3aed',
    },
    interestText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4b5563',
    },
    interestTextActive: {
        color: 'white',
    },
    submitButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 8,
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default CreateProfileScreen;
