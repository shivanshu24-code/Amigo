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

const OTPVerificationScreen = ({ navigation }) => {
    const { verifyOtp, loading } = useAuthStore();
    const [otp, setOtp] = useState('');

    const handleVerify = async () => {
        if (!otp || otp.length !== 6) {
            Alert.alert('Error', 'Please enter a valid 6-digit OTP');
            return;
        }

        const email = await AsyncStorage.getItem('signupEmail');
        if (!email) {
            Alert.alert('Error', 'Email not found. Please start over.');
            navigation.navigate('SignIn');
            return;
        }

        const success = await verifyOtp(email, otp);
        if (success) {
            navigation.navigate('SetPassword');
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

                    {/* OTP Card */}
                    <View style={styles.card}>
                        <Text style={styles.title}>Verify your email</Text>
                        <Text style={styles.subtitle}>
                            Enter the 6-digit code we sent to your email
                        </Text>

                        {/* OTP Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>OTP Code</Text>
                            <TextInput
                                style={styles.input}
                                value={otp}
                                onChangeText={setOtp}
                                placeholder="000000"
                                placeholderTextColor="#9ca3af"
                                keyboardType="number-pad"
                                maxLength={6}
                                editable={!loading}
                            />
                        </View>

                        {/* Verify Button */}
                        <TouchableOpacity
                            style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
                            onPress={handleVerify}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#ec4899', '#a855f7']}
                                style={styles.verifyButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.verifyButtonText}>Verify</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Resend link */}
                        <View style={styles.resendContainer}>
                            <Text style={styles.resendText}>Didn't receive code? </Text>
                            <TouchableOpacity>
                                <Text style={styles.resendLink}>Resend</Text>
                            </TouchableOpacity>
                        </View>
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
        fontSize: 24,
        color: '#1f2937',
        textAlign: 'center',
        letterSpacing: 8,
    },
    verifyButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 8,
        marginBottom: 24,
    },
    verifyButtonDisabled: {
        opacity: 0.5,
    },
    verifyButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    verifyButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    resendText: {
        color: '#6b7280',
        fontSize: 14,
    },
    resendLink: {
        color: '#7c3aed',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default OTPVerificationScreen;
