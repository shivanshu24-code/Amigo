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

const SignInScreen = ({ navigation }) => {
    const { signup, loading, error } = useAuthStore();
    const [email, setEmail] = useState('');

    const handleSignup = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email');
            return;
        }

        const ok = await signup(email);
        if (ok) {
            await AsyncStorage.setItem('signupEmail', email);
            navigation.navigate('OTPVerification');
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

                    {/* Sign Up Card */}
                    <View style={styles.card}>
                        <Text style={styles.title}>Create account</Text>
                        <Text style={styles.subtitle}>Sign up to get started</Text>

                        {/* Email Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="you@example.com"
                                placeholderTextColor="#9ca3af"
                                autoCapitalize="none"
                                keyboardType="email-address"
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
                            style={[styles.signupButton, loading && styles.signupButtonDisabled]}
                            onPress={handleSignup}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#ec4899', '#a855f7']}
                                style={styles.signupButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.signupButtonText}>Continue</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Login link */}
                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.loginLink}>Sign in</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Footer */}
                    <Text style={styles.footer}>
                        Email ID required — Join to connect with friends
                    </Text>
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
    signupButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 8,
        marginBottom: 24,
    },
    signupButtonDisabled: {
        opacity: 0.5,
    },
    signupButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    signupButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginText: {
        color: '#6b7280',
        fontSize: 14,
    },
    loginLink: {
        color: '#7c3aed',
        fontSize: 14,
        fontWeight: '600',
    },
    footer: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 32,
    },
});

export default SignInScreen;
