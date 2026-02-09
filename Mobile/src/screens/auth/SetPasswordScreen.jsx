import React, { useState, useEffect } from 'react';
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
import { SetPasswordApi } from '../../services/auth.api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SetPasswordScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadEmail();
    }, []);

    const loadEmail = async () => {
        const savedEmail = await AsyncStorage.getItem('signupEmail');
        if (!savedEmail) {
            Alert.alert('Error', 'Email not found. Please start over.');
            navigation.navigate('SignIn');
        } else {
            setEmail(savedEmail);
        }
    };

    const handleSubmit = async () => {
        setError('');

        if (!password || !confirmPassword) {
            setError('All fields are required');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            setLoading(true);
            const data = await SetPasswordApi(email, password);

            // Store JWT
            await AsyncStorage.setItem('token', data.token);

            // Cleanup
            await AsyncStorage.removeItem('signupEmail');

            Alert.alert('Success!', 'Password set successfully');
            navigation.navigate('CreateProfile');
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to set password');
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
                >
                    {/* Logo */}
                    <Text style={styles.logo}>
                        Amigo<Text style={styles.logoDot}>.</Text>
                    </Text>

                    {/* Set Password Card */}
                    <View style={styles.card}>
                        <Text style={styles.title}>Set Password</Text>
                        <Text style={styles.subtitle}>
                            Create a strong password to secure your account
                        </Text>

                        {/* Password Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>New Password</Text>
                            <View style={styles.passwordInput}>
                                <TextInput
                                    style={styles.input}
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="Enter password"
                                    placeholderTextColor="#9ca3af"
                                    secureTextEntry={!showPassword}
                                    editable={!loading}
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Confirm Password Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Confirm Password</Text>
                            <TextInput
                                style={styles.input}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Re-enter password"
                                placeholderTextColor="#9ca3af"
                                secureTextEntry={!showPassword}
                                editable={!loading}
                            />
                        </View>

                        {/* Error Message */}
                        {error && (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {/* Continue Button */}
                        <TouchableOpacity
                            style={[styles.continueButton, loading && styles.continueButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#ec4899', '#a855f7']}
                                style={styles.continueButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.continueButtonText}>Continue</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <Text style={styles.footer}>© 2024 Amigo. Made with ❤️</Text>
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
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    logo: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 40,
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
        marginBottom: 32,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: '#4b5563',
        marginBottom: 8,
    },
    passwordInput: {
        position: 'relative',
    },
    input: {
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1f2937',
    },
    eyeButton: {
        position: 'absolute',
        right: 12,
        top: 12,
    },
    eyeIcon: {
        fontSize: 20,
    },
    errorContainer: {
        backgroundColor: '#fef2f2',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 14,
        textAlign: 'center',
    },
    continueButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 8,
    },
    continueButtonDisabled: {
        opacity: 0.5,
    },
    continueButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    continueButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    footer: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 32,
    },
});

export default SetPasswordScreen;
