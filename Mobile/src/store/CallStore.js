import { create } from 'zustand';
import { getSocket } from '../socket/socket.js';

export const useCallStore = create((set, get) => ({
    /* ===================== STATE ===================== */
    callStatus: 'idle', // idle | calling | ringing | inCall | ended
    currentCall: null, // { receiverId, receiverName, receiverAvatar, isIncoming }
    localStream: null,
    remoteStream: null,
    isAudioMuted: false,
    isVideoMuted: false,
    error: null,

    /* ===================== INITIATE CALL ===================== */
    initiateCall: (friend) => {
        const socket = getSocket();
        if (!socket) {
            set({ error: 'Socket not connected' });
            return;
        }

        set({
            callStatus: 'calling',
            currentCall: {
                receiverId: friend._id,
                receiverName: friend.username,
                receiverAvatar: friend.avatar,
                isIncoming: false,
            },
            error: null,
        });

        socket.emit('initiate-call', {
            receiverId: friend._id,
            callerName: friend.username,
            callerAvatar: friend.avatar,
        });
    },

    /* ===================== RECEIVE INCOMING CALL ===================== */
    receiveIncomingCall: (data) => {
        const { callerId, callerName, callerAvatar } = data;

        set({
            callStatus: 'ringing',
            currentCall: {
                receiverId: callerId,
                receiverName: callerName,
                receiverAvatar: callerAvatar, isIncoming: true,
            },
        });
    },

    /* ===================== ACCEPT CALL ===================== */
    acceptCall: () => {
        const socket = getSocket();
        const { currentCall } = get();

        if (!socket || !currentCall) return;

        socket.emit('accept-call', {
            callerId: currentCall.receiverId,
        });

        set({ callStatus: 'inCall' });
    },

    /* ===================== REJECT CALL ===================== */
    rejectCall: () => {
        const socket = getSocket();
        const { currentCall } = get();

        if (!socket || !currentCall) return;

        socket.emit('reject-call', {
            callerId: currentCall.receiverId,
        });

        get().endCall();
    },

    /* ===================== END CALL ===================== */
    endCall: () => {
        const socket = getSocket();
        const { currentCall, localStream, remoteStream } = get();

        if (socket && currentCall) {
            socket.emit('end-call', {
                receiverId: currentCall.receiverId,
            });
        }

        // Stop all media tracks
        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
        }
        if (remoteStream) {
            remoteStream.getTracks().forEach((track) => track.stop());
        }

        set({
            callStatus: 'idle',
            currentCall: null,
            localStream: null,
            remoteStream: null,
            isAudioMuted: false,
            isVideoMuted: false,
            error: null,
        });
    },

    /* ===================== TOGGLE AUDIO ===================== */
    toggleAudio: () => {
        const { localStream, isAudioMuted } = get();
        if (localStream) {
            localStream.getAudioTracks().forEach((track) => {
                track.enabled = isAudioMuted;
            });
            set({ isAudioMuted: !isAudioMuted });
        }
    },

    /* ===================== TOGGLE VIDEO ===================== */
    toggleVideo: () => {
        const { localStream, isVideoMuted } = get();
        if (localStream) {
            localStream.getVideoTracks().forEach((track) => {
                track.enabled = isVideoMuted;
            });
            set({ isVideoMuted: !isVideoMuted });
        }
    },

    /* ===================== SET STREAMS ===================== */
    setLocalStream: (stream) => set({ localStream: stream }),
    setRemoteStream: (stream) => set({ remoteStream: stream }),

    /* ===================== HANDLE CALL REJECTED ===================== */
    handleCallRejected: () => {
        set({
            callStatus: 'ended',
            error: 'Call was rejected',
        });
        setTimeout(() => {
            get().endCall();
        }, 2000);
    },

    /* ===================== HANDLE CALL ACCEPTED ===================== */
    handleCallAccepted: () => {
        set({ callStatus: 'inCall' });
    },
}));
