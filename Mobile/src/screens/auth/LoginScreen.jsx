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

const LoginScreen = ({ navigation }) => {
    const { login, loading, error } = useAuthStore();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        if (loading) return;

        if (!identifier || !password) {
            Alert.alert('Error', 'Please enter your email/username and password');
            return;
        }

        const ok = await login(identifier, password);
        if (ok) {
            // Navigation will be handled automatically by AppNavigator based on auth state
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

                    {/* Login Card */}
                    <View style={styles.card}>
                        <Text style={styles.title}>Welcome back</Text>
                        <Text style={styles.subtitle}>Sign in to continue</Text>

                        {/* Email Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email or Username</Text>
                            <TextInput
                                style={styles.input}
                                value={identifier}
                                onChangeText={setIdentifier}
                                placeholder="you@example.com"
                                placeholderTextColor="#9ca3af"
                                autoCapitalize="none"
                                keyboardType="email-address"
                                editable={!loading}
                            />
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                style={styles.input}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="••••••••"
                                placeholderTextColor="#9ca3af"
                                secureTextEntry
                                editable={!loading}
                            />
                        </View>

                        {/* Error Message */}
                        {error && (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {/* Login Button */}
                        <TouchableOpacity
                            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#ec4899', '#a855f7']}
                                style={styles.loginButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.loginButtonText}>Sign in</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Sign up link */}
                        <View style={styles.signupContainer}>
                            <Text style={styles.signupText}>New to Amigo? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                                <Text style={styles.signupLink}>Create account</Text>
                            </TouchableOpacity>
                        </View>
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
    loginButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 8,
        marginBottom: 24,
    },
    loginButtonDisabled: {
        opacity: 0.5,
    },
    loginButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loginButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    signupText: {
        color: '#6b7280',
        fontSize: 14,
    },
    signupLink: {
        color: '#7c3aed',
        fontSize: 14,
        fontWeight: '600',
    },
    footer: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 32,
    },
});

export default LoginScreen;
