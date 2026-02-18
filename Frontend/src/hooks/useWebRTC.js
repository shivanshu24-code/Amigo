import { useEffect, useRef, useCallback } from "react";
import { getSocket } from "../Socket/Socket.js";
import { useCallStore } from "../Store/CallStore.js";

const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject",
        },
        {
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject",
            credential: "openrelayproject",
        },
    ],
    iceCandidatePoolSize: 10,
};

export function useWebRTC(localVideoRef, remoteVideoRef, options = {}) {
    const { audioOnly = false } = options;

    const peerConnectionRef = useRef(null);
    const localStreamRef = useRef(null);
    const pendingCandidatesRef = useRef([]);
    const isInitializedRef = useRef(false);

    const { currentCall, callStatus, setLocalStream, setRemoteStream } = useCallStore();

    const facingModeRef = useRef("user");

    const getLocalStream = useCallback(async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Camera/microphone access requires HTTPS.");
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: audioOnly
                    ? false
                    : {
                          width: { ideal: 1280 },
                          height: { ideal: 720 },
                          facingMode: facingModeRef.current,
                      },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });

            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => track.stop());
            }

            localStreamRef.current = stream;
            setLocalStream(stream);

            if (localVideoRef?.current) {
                localVideoRef.current.srcObject = stream;
            }

            return stream;
        } catch (error) {
            console.error("Error accessing media devices:", error);
            throw error;
        }
    }, [audioOnly, localVideoRef, setLocalStream]);

    const switchCamera = useCallback(async () => {
        if (audioOnly) return;

        try {
            const currentMode = facingModeRef.current;
            const newMode = currentMode === "user" ? "environment" : "user";

            if (localStreamRef.current) {
                localStreamRef.current.getVideoTracks().forEach((track) => track.stop());
            }

            const newStream = await navigator.mediaDevices
                .getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: { exact: newMode },
                    },
                })
                .catch(async () => {
                    return navigator.mediaDevices.getUserMedia({
                        video: { facingMode: newMode },
                    });
                });

            facingModeRef.current = newMode;
            const newVideoTrack = newStream.getVideoTracks()[0];

            const audioTracks = localStreamRef.current ? localStreamRef.current.getAudioTracks() : [];
            const combinedStream = new MediaStream([newVideoTrack, ...audioTracks]);

            localStreamRef.current = combinedStream;
            setLocalStream(combinedStream);

            if (localVideoRef?.current) {
                localVideoRef.current.srcObject = combinedStream;
            }

            if (peerConnectionRef.current) {
                const sender = peerConnectionRef.current
                    .getSenders()
                    .find((s) => s.track && s.track.kind === "video");
                if (sender) {
                    await sender.replaceTrack(newVideoTrack);
                }
            }
        } catch (error) {
            console.error("Error switching camera:", error);
        }
    }, [audioOnly, localVideoRef, setLocalStream]);

    const createPeerConnection = useCallback(
        (targetId) => {
            const socket = getSocket();
            const pc = new RTCPeerConnection(ICE_SERVERS);

            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => {
                    pc.addTrack(track, localStreamRef.current);
                });
            }

            pc.ontrack = (event) => {
                if (remoteVideoRef.current && event.streams[0]) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                    setRemoteStream(event.streams[0]);
                }
            };

            pc.onicecandidate = (event) => {
                if (event.candidate && socket) {
                    socket.emit("webrtc-ice-candidate", {
                        targetId,
                        candidate: event.candidate,
                    });
                }
            };

            return pc;
        },
        [remoteVideoRef, setRemoteStream]
    );

    const createOffer = useCallback(
        async (targetId) => {
            try {
                const socket = getSocket();
                peerConnectionRef.current = createPeerConnection(targetId);
                const offer = await peerConnectionRef.current.createOffer();
                await peerConnectionRef.current.setLocalDescription(offer);

                socket.emit("webrtc-offer", {
                    receiverId: targetId,
                    offer: peerConnectionRef.current.localDescription,
                });
            } catch (error) {
                console.error("Error creating offer:", error);
            }
        },
        [createPeerConnection]
    );

    const handleOffer = useCallback(
        async (data) => {
            const { callerId, offer } = data;
            try {
                if (!localStreamRef.current) {
                    await getLocalStream();
                }

                const socket = getSocket();
                peerConnectionRef.current = createPeerConnection(callerId);

                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));

                for (const candidate of pendingCandidatesRef.current) {
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                }
                pendingCandidatesRef.current = [];

                const answer = await peerConnectionRef.current.createAnswer();
                await peerConnectionRef.current.setLocalDescription(answer);

                socket.emit("webrtc-answer", {
                    callerId,
                    answer: peerConnectionRef.current.localDescription,
                });
            } catch (error) {
                console.error("Error handling offer:", error);
            }
        },
        [createPeerConnection, getLocalStream]
    );

    const handleAnswer = useCallback(async (data) => {
        const { answer } = data;
        try {
            if (peerConnectionRef.current) {
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));

                for (const candidate of pendingCandidatesRef.current) {
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                }
                pendingCandidatesRef.current = [];
            }
        } catch (error) {
            console.error("Error handling answer:", error);
        }
    }, []);

    const handleIceCandidate = useCallback(async (data) => {
        const { candidate } = data;
        try {
            if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            } else {
                pendingCandidatesRef.current.push(candidate);
            }
        } catch (error) {
            console.error("Error handling ICE candidate:", error);
        }
    }, []);

    const cleanup = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
            localStreamRef.current = null;
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        pendingCandidatesRef.current = [];
        isInitializedRef.current = false;
    }, []);

    useEffect(() => {
        if (callStatus !== "inCall" || !currentCall) return;
        if (isInitializedRef.current) return;

        isInitializedRef.current = true;
        let mounted = true;
        const socket = getSocket();

        const init = async () => {
            try {
                await getLocalStream();
                if (!mounted) return;

                socket.on("webrtc-offer", handleOffer);
                socket.on("webrtc-answer", handleAnswer);
                socket.on("webrtc-ice-candidate", handleIceCandidate);

                if (!currentCall.isIncoming) {
                    setTimeout(() => {
                        if (mounted) {
                            createOffer(currentCall.oderId);
                        }
                    }, 1000);
                }
            } catch (error) {
                console.error("Error initializing WebRTC:", error);
            }
        };

        init();

        return () => {
            mounted = false;
            socket.off("webrtc-offer", handleOffer);
            socket.off("webrtc-answer", handleAnswer);
            socket.off("webrtc-ice-candidate", handleIceCandidate);
            cleanup();
        };
    }, [
        callStatus,
        currentCall,
        getLocalStream,
        createOffer,
        handleOffer,
        handleAnswer,
        handleIceCandidate,
        cleanup,
    ]);

    return {
        cleanup,
        getLocalStream,
        createOffer,
        handleOffer,
        switchCamera,
    };
}

export default useWebRTC;
