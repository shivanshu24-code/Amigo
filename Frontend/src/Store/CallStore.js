import { create } from "zustand";
import { getSocket } from "../Socket/Socket.js";
import { useAuthStore } from "./AuthStore.js";



export const useCallStore = create((set, get) => ({
    /* ===================== STATE ===================== */
    callStatus: 'idle', // 'idle' | 'calling' | 'ringing' | 'inCall' | 'ended'
    currentCall: null, // { oderId, oderName, oderAvatar, isIncoming }
    localStream: null,
    remoteStream: null,
    isAudioEnabled: true,
    isVideoEnabled: true,
    callStartTime: null,
    error: null,


    /* ===================== INITIATE CALL ===================== */
    initiateCall: (friend) => {
        console.log('📞 Initiating call to friend:', friend);

        const socket = getSocket();
        console.log('📞 Socket:', socket ? 'connected' : 'not connected');

        if (!socket || !friend) {
            console.error('📞 Cannot initiate call - socket or friend missing');
            return;
        }

        set({
            callStatus: 'calling',
            currentCall: {
                oderId: friend._id,
                oderName: friend.username,
                oderAvatar: friend.avatar,
                isIncoming: false,
            },
            error: null,
        });

        // Get caller info from auth-store
        const user = useAuthStore.getState().user || {};
        console.log('📞 Caller user:', user);

        socket.emit('initiate-call', {
            receiverId: friend._id,
            callerName: user.username || user.firstname || 'User',
            callerAvatar: user.avatar || '',
        });

        console.log('📞 Emitted initiate-call event');
    },

    /* ===================== RECEIVE INCOMING CALL ===================== */
    receiveIncomingCall: (data) => {
        console.log('📞 Received incoming call:', data);
        const { callerId, callerName, callerAvatar } = data;

        set({
            callStatus: 'ringing',
            currentCall: {
                oderId: callerId,
                oderName: callerName,
                oderAvatar: callerAvatar,
                isIncoming: true,
            },
            error: null,
        });

        console.log('📞 Call status set to ringing');
    },

    /* ===================== ACCEPT CALL ===================== */
    acceptCall: () => {
        const { currentCall } = get();
        if (!currentCall) return;

        const socket = getSocket();
        if (!socket) return;

        // Get user info from auth-store
        const user = useAuthStore.getState().user || {};

        socket.emit('accept-call', {
            callerId: currentCall.oderId,
            receiverName: user.username || user.firstname || 'User',
            receiverAvatar: user.avatar || '',
        });

        set({
            callStatus: 'inCall',
            callStartTime: Date.now(),
        });
    },

    /* ===================== CALL ACCEPTED ===================== */
    callAccepted: (data) => {
        set({
            callStatus: 'inCall',
            callStartTime: Date.now(),
        });
    },

    /* ===================== REJECT CALL ===================== */
    rejectCall: () => {
        const { currentCall } = get();
        if (!currentCall) return;

        const socket = getSocket();
        if (!socket) return;

        socket.emit('reject-call', {
            callerId: currentCall.oderId,
        });

        set({
            callStatus: 'idle',
            currentCall: null,
            error: null,
        });
    },

    /* ===================== CALL REJECTED ===================== */
    callRejected: () => {
        set({
            callStatus: 'idle',
            currentCall: null,
            error: 'Call was declined',
        });

        // Clear error after 3 seconds
        setTimeout(() => {
            set({ error: null });
        }, 3000);
    },

    /* ===================== END CALL ===================== */
    endCall: () => {
        const { currentCall, localStream } = get();

        const socket = getSocket();
        if (socket && currentCall) {
            socket.emit('end-call', {
                oderId: currentCall.oderId,
            });
        }

        // Stop local stream
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }

        set({
            callStatus: 'idle',
            currentCall: null,
            localStream: null,
            remoteStream: null,
            isAudioEnabled: true,
            isVideoEnabled: true,
            callStartTime: null,
        });
    },

    /* ===================== CALL ENDED BY PEER ===================== */
    callEnded: () => {
        const { localStream } = get();

        // Stop local stream
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }

        set({
            callStatus: 'idle',
            currentCall: null,
            localStream: null,
            remoteStream: null,
            isAudioEnabled: true,
            isVideoEnabled: true,
            callStartTime: null,
        });
    },

    /* ===================== CALL ERROR ===================== */
    callError: (message) => {
        const { localStream } = get();

        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }

        set({
            callStatus: 'idle',
            currentCall: null,
            localStream: null,
            remoteStream: null,
            error: message,
        });

        setTimeout(() => {
            set({ error: null });
        }, 3000);
    },

    /* ===================== CALL BUSY ===================== */
    callBusy: () => {
        set({
            callStatus: 'idle',
            currentCall: null,
            error: 'User is busy on another call',
        });

        setTimeout(() => {
            set({ error: null });
        }, 3000);
    },

    /* ===================== SET STREAMS ===================== */
    setLocalStream: (stream) => set({ localStream: stream }),
    setRemoteStream: (stream) => set({ remoteStream: stream }),

    /* ===================== TOGGLE AUDIO ===================== */
    toggleAudio: () => {
        const { localStream, isAudioEnabled } = get();
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !isAudioEnabled;
                set({ isAudioEnabled: !isAudioEnabled });
            }
        }
    },

    /* ===================== TOGGLE VIDEO ===================== */
    toggleVideo: () => {
        const { localStream, isVideoEnabled } = get();
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !isVideoEnabled;
                set({ isVideoEnabled: !isVideoEnabled });
            }
        }
    },

    /* ===================== CALL RINGING ===================== */
    callRinging: () => {
        set({ callStatus: 'calling' });
    },

    /* ===================== RESET STORE ===================== */
    reset: () => {
        const { localStream } = get();
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        set({
            callStatus: 'idle',
            currentCall: null,
            localStream: null,
            remoteStream: null,
            isAudioEnabled: true,
            isVideoEnabled: true,
            callStartTime: null,
            error: null,
        });
    },
}));
