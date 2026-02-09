# Amigo Mobile - React Native App

A React Native mobile application built with Expo and NativeWind, mirroring the Amigo web frontend.

## 🚀 Phase 1 Complete! 

**What's Working:**
- ✅ React Native with Expo SDK 52
- ✅ NativeWind (Tailwind CSS for React Native)
- ✅ React Navigation (Stack & Bottom Tabs)
- ✅ Basic app structure with auth flow
- ✅ Gradient splash/start screen
- ✅ Minimal Zustand auth store

## 📱 Quick Start

### Prerequisites
- Node.js 18+ installed
- iOS Simulator (Mac only) or Android Emulator installed
- Expo Go app on your physical device (optional)

### Installation & Running

1. **Navigate to Mobile folder:**
```bash
cd /Users/naitik/Documents/Amigo/Mobile
```

2. **Install dependencies (already done):**
```bash
npm install
```

3. **Start the app:**
```bash
npx expo start
```

4. **Choose how to run:**
   - Press `i` for iOS Simulator (Mac only)
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app on your phone

### What to Test in Phase 1

1. **App Opens**: Purple gradient splash screen appears
2. **Navigation Works**: 
   - Tap "Create Account" → Goes to SignIn placeholder
   - Tap "Sign In" → Goes to Login placeholder
   - Both show "Will be built in Phase 4" message
3. **No Errors**: Check terminal for any errors
4. **NativeWind Works**: Styles should be applied (purple buttons, white text)

### Expected Behavior

- Opens to purple gradient Start screen with "Amigo" title
- Bottom text shows "Phase 1 Complete - Base App Running! 🎉"
- Navigation between screens works smoothly
- Clean terminal output (warnings about deprecated packages are normal)

## 🔧 Testing on Physical Device

If testing on a physical device on your local network:

1. **Find your computer's IP address:**
```bash
# On macOS
ifconfig | grep "inet " | grep -v 127.0.0.1
```

2. **Update `.env` file:**
```bash
EXPO_PUBLIC_API_URL=http://YOUR_IP:3000/api
EXPO_PUBLIC_SOCKET_URL=http://YOUR_IP:3000
```

3. **Restart Expo:**
```bash
npx expo start
```

## 📂 Project Structure

```
Mobile/
├── App.js                 # Root component
├── app.json              # Expo configuration
├── package.json          # Dependencies
├── tailwind.config.js    # NativeWind config
├── global.css            # Tailwind imports
├── .env                  # Environment variables
└── src/
    ├── navigation/
    │   └── AppNavigator.jsx    # Navigation setup
    ├── screens/
    │   └── auth/
    │       ├── StartScreen.jsx           # ✅ Implemented
    │       ├── LoginScreen.jsx           # Placeholder
    │       ├── SignInScreen.jsx          # Placeholder
    │       ├── VerificationScreen.jsx    # Placeholder
    │       ├── SetPasswordScreen.jsx     # Placeholder
    │       └── CreateProfileScreen.jsx   # Placeholder
    └── store/
        └── AuthStore.js              # Minimal auth store
```

## 🎯 Next Steps (Phase 2)

Once Phase 1 is tested and approved:
- Implement full Zustand stores (AuthStore, ChatStore, CallStore, etc.)
- Add API integration with axios
- Set up Socket.io client
- Add AsyncStorage persistence

## 🐛 Troubleshooting

**Metro bundler won't start:**
```bash
npx expo start --clear
```

**Dependencies issue:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**iOS Simulator not opening:**
```bash
# Make sure Xcode Command Line Tools are installed
xcode-select --install
```

**Android Emulator not opening:**
- Make sure Android Studio is installed
- AVD Manager has at least one virtual device created

## 📝 Notes

- This is Phase 1 of 6 phases
- Screens are placeholders until Phase 4
- Backend should be running on `http://localhost:3000` for later phases
- Some npm warnings about deprecated packages are normal
