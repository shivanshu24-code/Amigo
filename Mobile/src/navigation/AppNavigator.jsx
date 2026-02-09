import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { useAuthStore } from '../store/AuthStore';
import { Ionicons } from '@expo/vector-icons';


// Auth Screens (will be created in Phase 4)
import StartScreen from '../screens/auth/StartScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';
import SetPasswordScreen from '../screens/auth/SetPasswordScreen';
import CreateProfileScreen from '../screens/auth/CreateProfileScreen';

import FeedScreen from '../screens/main/FeedScreen';
import ChatScreen from '../screens/main/ChatScreen';
import ChatDetailsScreen from '../screens/main/ChatDetailsScreen';
import UsersScreen from '../screens/main/UsersScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main App Tabs
const MainTabs = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: '#7c3aed',
                tabBarInactiveTintColor: '#9ca3af',
                tabBarStyle: {
                    borderTopWidth: 1,
                    borderTopColor: '#e5e7eb',
                    paddingBottom: 5,
                    paddingTop: 5,
                    height: 60,
                },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Feed') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Users') {
                        iconName = focused ? 'people' : 'people-outline';
                    } else if (route.name === 'Chat') {
                        iconName = focused ? 'chatbubble' : 'chatbubble-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen
                name="Feed"
                component={FeedScreen}
                options={{
                    tabBarLabel: 'Feed',
                }}
            />
            <Tab.Screen
                name="Users"
                component={UsersScreen}
                options={{
                    tabBarLabel: 'People',
                }}
            />
            <Tab.Screen
                name="Chat"
                component={ChatScreen}
                options={{
                    tabBarLabel: 'Chat',
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Profile',
                }}
            />
        </Tab.Navigator>
    );
};

// Root Navigator
const AppNavigator = () => {
    const { isAuthenticated, authChecked, checkAuth } = useAuthStore();

    useEffect(() => {
        if (!authChecked) {
            checkAuth();
        }
    }, [authChecked, checkAuth]);

    // Show loading while checking auth
    if (!authChecked) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
                <Text style={{ fontSize: 18, color: '#4b5563' }}>Loading...</Text>
            </View>
        );
    }

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            {!isAuthenticated ? (
                // Auth Stack
                <>
                    <Stack.Screen name="Start" component={StartScreen} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="SignIn" component={SignInScreen} />
                    <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
                    <Stack.Screen name="SetPassword" component={SetPasswordScreen} />
                    <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
                </>
            ) : (
                // Main App Stack
                <>
                    <Stack.Screen name="MainApp" component={MainTabs} />
                    <Stack.Screen name="ChatDetails" component={ChatDetailsScreen} />
                </>
            )}
        </Stack.Navigator>
    );
};

export default AppNavigator;
