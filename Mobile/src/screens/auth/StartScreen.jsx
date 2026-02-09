import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const StartScreen = ({ navigation }) => {
    return (
        <LinearGradient
            colors={['#7c3aed', '#a78bfa', '#c4b5fd']}
            style={styles.gradient}
        >
            <View style={styles.container}>
                <Text style={styles.title}>Amigo</Text>
                <Text style={styles.subtitle}>Connect with friends</Text>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('SignIn')}
                        style={styles.primaryButton}
                    >
                        <Text style={styles.primaryButtonText}>
                            Create Account
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('Login')}
                        style={styles.secondaryButton}
                    >
                        <Text style={styles.secondaryButtonText}>
                            Sign In
                        </Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.phaseText}>
                    Phase 1 Complete - Base App Running! 🎉
                </Text>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 60,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 48,
    },
    buttonContainer: {
        width: '100%',
        gap: 16,
    },
    primaryButton: {
        backgroundColor: 'white',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    primaryButtonText: {
        color: '#7c3aed',
        textAlign: 'center',
        fontWeight: '600',
        fontSize: 18,
    },
    secondaryButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 2,
        borderColor: 'white',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    secondaryButtonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: '600',
        fontSize: 18,
    },
    phaseText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 14,
        marginTop: 48,
    },
});

export default StartScreen;
