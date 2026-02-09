import io from 'socket.io-client';

// Get Socket URL from environment or use default
const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000';

let socket = null;

export const getSocket = () => socket;

export const connectSocket = (userId) => {
    if (socket?.connected) {
        console.log('Socket already connected');
        return socket;
    }

    console.log('Connecting socket for user:', userId);

    socket = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
        console.log('✅ Socket connected:', socket.id);
        if (userId) {
            socket.emit('register', userId);
        }
    });

    socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
    });

    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        console.log('Disconnecting socket');
        socket.disconnect();
        socket = null;
    }
};

export default {
    getSocket,
    connectSocket,
    disconnectSocket,
};
