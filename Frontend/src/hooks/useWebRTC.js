import { useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../Socket/Socket.js';
import { useCallStore } from '../Store/CallStore.js';

// ICE servers configuration with STUN and TURN for better connectivity
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        // Free TURN server for testing (consider using your own in production)
        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
        {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
    ],
    iceCandidatePoolSize: 10,
};

export function useWebRTC(localVideoRef, remoteVideoRef) {
    const peerConnectionRef = useRef(null);
    const localStreamRef = useRef(null);
    const pendingCandidatesRef = useRef([]);
    const isInitializedRef = useRef(false);

    const {
        currentCall,
        callStatus,
        setLocalStream,
        setRemoteStream,
    } = useCallStore();

    // State for camera facing mode
    const facingModeRef = useRef('user');

    // Get local media stream
    const getLocalStream = useCallback(async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera/microphone access requires HTTPS.');
            }

            console.log('🎥 Requesting camera...', facingModeRef.current);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: facingModeRef.current
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                }
            });

            // If we are already streaming, stop old video tracks to release camera
            if (localStreamRef.current) {
                const oldVideoTracks = localStreamRef.current.getVideoTracks();
                oldVideoTracks.forEach(track => {
                    track.stop();
                    localStreamRef.current.removeTrack(track);
                });
                // Add new video track to existing stream object if valid, or just replace stream logic
                // Simpler: Just replace the reference and update state
            }

            localStreamRef.current = stream;
            setLocalStream(stream);

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            return stream;
        } catch (error) {
            console.error('❌ Error accessing media devices:', error);
            throw error;
        }
    }, [localVideoRef, setLocalStream]);

    // Switch Camera Function
    const switchCamera = useCallback(async () => {
        try {
            const currentMode = facingModeRef.current;
            const newMode = currentMode === 'user' ? 'environment' : 'user';

            console.log(`🔄 Switching camera from ${currentMode} to ${newMode}`);

            // 1. Stop existing video tracks FIRST to release camera hardware (Critical for some Android devices)
            if (localStreamRef.current) {
                const oldVideoTracks = localStreamRef.current.getVideoTracks();
                oldVideoTracks.forEach(track => {
                    track.stop();
                    console.log('🛑 Stopped old video track');
                });
            }

            // 2. Get new stream
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: { exact: newMode } // Try 'exact' first
                }
            }).catch(async err => {
                console.warn('⚠️ Exact facingMode failed, trying loose constraint');
                return await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: newMode }
                });
            });

            facingModeRef.current = newMode;
            const newVideoTrack = newStream.getVideoTracks()[0];
            console.log('✅ Got new video track:', newVideoTrack.label);

            // 3. Update local stream reference (keep audio tracks)
            // We need to reconstruct the stream to keep the audio active
            let audioTracks = [];
            if (localStreamRef.current) {
                audioTracks = localStreamRef.current.getAudioTracks();
            } else {
                // Fallback if localStream was null (shouldn't happen in call)
                // You might lose audio here if you don't re-get it, but typically we have it.
                console.warn('⚠️ No local stream found to preserve audio from');
            }

            const combinedStream = new MediaStream([newVideoTrack, ...audioTracks]);

            localStreamRef.current = combinedStream;
            setLocalStream(combinedStream);

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = combinedStream;
            }

            // 4. Replace track in PeerConnection
            if (peerConnectionRef.current) {
                const sender = peerConnectionRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
                if (sender) {
                    console.log('🔄 Replacing video track in peer connection');
                    await sender.replaceTrack(newVideoTrack);
                } else {
                    // If no video sender found (maybe call started audio-only?), valid case to handle
                    // But for now, just log
                    console.warn('⚠️ No video sender found to replace track on');
                }
            }
        } catch (error) {
            console.error('❌ Error switching camera:', error);
            // Attempt to restore 'user' camera if failed?
        }
    }, [localVideoRef, setLocalStream]);

    // Create peer connection
    const createPeerConnection = useCallback((targetId) => {
        console.log('📡 Creating peer connection for target:', targetId);
        const socket = getSocket();
        const pc = new RTCPeerConnection(ICE_SERVERS);

        // Add local tracks to the connection
        if (localStreamRef.current) {
            console.log('📡 Adding local tracks to peer connection');
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current);
            });
        } else {
            console.warn('⚠️ No local stream available when creating peer connection');
        }

        // Handle incoming remote stream
        pc.ontrack = (event) => {
            console.log('📺 Received remote track:', event.track.kind);
            if (remoteVideoRef.current && event.streams[0]) {
                console.log('📺 Setting remote video source');
                remoteVideoRef.current.srcObject = event.streams[0];
                setRemoteStream(event.streams[0]);
            }
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && socket) {
                console.log('🧊 Sending ICE candidate');
                socket.emit('webrtc-ice-candidate', {
                    targetId,
                    candidate: event.candidate,
                });
            }
        };

        // Connection state changes
        pc.onconnectionstatechange = () => {
            console.log('📡 Connection state:', pc.connectionState);
        };

        pc.oniceconnectionstatechange = () => {
            console.log('🧊 ICE connection state:', pc.iceConnectionState);
        };

        pc.onsignalingstatechange = () => {
            console.log('📡 Signaling state:', pc.signalingState);
        };

        return pc;
    }, [remoteVideoRef, setRemoteStream]);

    // Create and send offer (caller)
    const createOffer = useCallback(async (targetId) => {
        try {
            console.log('📤 Creating offer for:', targetId);
            const socket = getSocket();
            peerConnectionRef.current = createPeerConnection(targetId);
            const offer = await peerConnectionRef.current.createOffer();
            await peerConnectionRef.current.setLocalDescription(offer);

            console.log('📤 Sending offer via socket');
            socket.emit('webrtc-offer', {
                receiverId: targetId,
                offer: peerConnectionRef.current.localDescription,
            });
        } catch (error) {
            console.error('❌ Error creating offer:', error);
        }
    }, [createPeerConnection]);

    // Handle incoming offer (receiver)
    const handleOffer = useCallback(async (data) => {
        const { callerId, offer } = data;
        try {
            console.log('📥 Received offer from:', callerId);

            // Make sure we have local stream first
            if (!localStreamRef.current) {
                console.log('📥 Getting local stream before handling offer...');
                await getLocalStream();
            }

            const socket = getSocket();
            peerConnectionRef.current = createPeerConnection(callerId);

            console.log('📥 Setting remote description (offer)');
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));

            // Process any pending ICE candidates
            console.log('🧊 Processing', pendingCandidatesRef.current.length, 'pending ICE candidates');
            for (const candidate of pendingCandidatesRef.current) {
                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
            pendingCandidatesRef.current = [];

            console.log('📥 Creating answer');
            const answer = await peerConnectionRef.current.createAnswer();
            await peerConnectionRef.current.setLocalDescription(answer);

            console.log('📤 Sending answer via socket');
            socket.emit('webrtc-answer', {
                callerId,
                answer: peerConnectionRef.current.localDescription,
            });
        } catch (error) {
            console.error('❌ Error handling offer:', error);
        }
    }, [createPeerConnection, getLocalStream]);

    // Handle incoming answer (caller)
    const handleAnswer = useCallback(async (data) => {
        const { answer } = data;
        try {
            console.log('📥 Received answer');
            if (peerConnectionRef.current) {
                console.log('📥 Setting remote description (answer)');
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));

                // Process any pending ICE candidates
                console.log('🧊 Processing', pendingCandidatesRef.current.length, 'pending ICE candidates');
                for (const candidate of pendingCandidatesRef.current) {
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                }
                pendingCandidatesRef.current = [];
            }
        } catch (error) {
            console.error('❌ Error handling answer:', error);
        }
    }, []);

    // Handle incoming ICE candidate
    const handleIceCandidate = useCallback(async (data) => {
        const { candidate } = data;
        try {
            console.log('🧊 Received ICE candidate');
            if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            } else {
                console.log('🧊 Queuing ICE candidate (no remote description yet)');
                pendingCandidatesRef.current.push(candidate);
            }
        } catch (error) {
            console.error('❌ Error handling ICE candidate:', error);
        }
    }, []);

    // Cleanup
    const cleanup = useCallback(() => {
        console.log('🧹 Cleaning up WebRTC');
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        pendingCandidatesRef.current = [];
        isInitializedRef.current = false;
    }, []);

    // Initialize when call is accepted/in progress
    useEffect(() => {
        if (callStatus !== 'inCall' || !currentCall) {
            return;
        }

        // Prevent double initialization
        if (isInitializedRef.current) {
            console.log('⚠️ WebRTC already initialized, skipping');
            return;
        }
        isInitializedRef.current = true;

        let mounted = true;
        const socket = getSocket();

        console.log('🚀 Initializing WebRTC, isIncoming:', currentCall.isIncoming);

        const init = async () => {
            try {
                // Get local stream first
                await getLocalStream();
                if (!mounted) return;

                // Set up socket event handlers
                console.log('📡 Setting up WebRTC socket listeners');
                socket.on('webrtc-offer', handleOffer);
                socket.on('webrtc-answer', handleAnswer);
                socket.on('webrtc-ice-candidate', handleIceCandidate);

                // If we initiated the call (not incoming), create offer
                // Small delay to ensure receiver is ready
                if (!currentCall.isIncoming) {
                    console.log('📞 Caller: Creating offer after delay...');
                    setTimeout(() => {
                        if (mounted) {
                            createOffer(currentCall.oderId);
                        }
                    }, 1000); // 1 second delay to let receiver set up
                } else {
                    console.log('📞 Receiver: Waiting for offer...');
                }
            } catch (error) {
                console.error('❌ Error initializing WebRTC:', error);
            }
        };

        init();

        return () => {
            mounted = false;
            console.log('📡 Removing WebRTC socket listeners');
            socket.off('webrtc-offer', handleOffer);
            socket.off('webrtc-answer', handleAnswer);
            socket.off('webrtc-ice-candidate', handleIceCandidate);
            cleanup();
        };
    }, [callStatus, currentCall, getLocalStream, createOffer, handleOffer, handleAnswer, handleIceCandidate, cleanup]);

    return {
        cleanup,
        getLocalStream,
        createOffer,
        handleOffer,
        switchCamera,
    };
}

export default useWebRTC;
