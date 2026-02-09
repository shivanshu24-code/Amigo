import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get API URL from environment or use default
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_URL,
});

// Request interceptor to add auth token
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        console.log(`[API REQUEST] ${config.method.toUpperCase()} ${config.baseURL}${config.url}`, config.data ? JSON.stringify(config.data).substring(0, 100) : '');

        return config;
    },
    (error) => {
        console.error('[API SETUP ERROR]', error);
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        console.log(`[API RESPONSE] ${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        if (error.response) {
            console.error(`[API ERROR] ${error.response.status} ${error.config.url}:`, error.response.data);
        } else if (error.request) {
            console.error('[API ERROR] No response received:', error.request);
        } else {
            console.error('[API ERROR] Request setup failed:', error.message);
        }
        return Promise.reject(error);
    }
);

export default api;
