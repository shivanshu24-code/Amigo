import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdMic, MdMicOff, MdVideocam, MdVideocamOff, MdCallEnd, MdFlipCameraIos, MdAspectRatio } from 'react-icons/md';
import { useCallStore } from '../../Store/CallStore.js';
import useWebRTC from '../../hooks/useWebRTC.js';

const VideoCall = () => {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    const {
        callStatus,
        currentCall,
        isAudioEnabled,
        isVideoEnabled,
        callStartTime,
        toggleAudio,
        toggleVideo,
        endCall,
    } = useCallStore();

    const { switchCamera } = useWebRTC(localVideoRef, remoteVideoRef);
    const [objectFit, setObjectFit] = useState('cover'); // 'cover' or 'contain'

    const toggleObjectFit = () => {
        setObjectFit(prev => prev === 'cover' ? 'contain' : 'cover');
    };

    const [callDuration, setCallDuration] = useState('00:00');

    // Update call duration
    useEffect(() => {
        if (callStatus !== 'inCall' || !callStartTime) return;

        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            setCallDuration(`${minutes}:${seconds}`);
        }, 1000);

        return () => clearInterval(interval);
    }, [callStatus, callStartTime]);

    // Only show when in call or calling
    if (callStatus !== 'inCall' && callStatus !== 'calling') {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900 z-50 flex flex-col"
        >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 z-10 bg-gradient-to-b from-black/50 to-transparent">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img
                            src={currentCall?.oderAvatar || `https://ui-avatars.com/api/?name=${currentCall?.oderName}&background=random&size=44`}
                            alt={currentCall?.oderName}
                            className="w-11 h-11 rounded-full object-cover border-2 border-white/30"
                        />
                        <div>
                            <h2 className="text-white font-semibold">{currentCall?.oderName}</h2>
                            <p className="text-white/70 text-sm">
                                {callStatus === 'calling' ? 'Calling...' : callDuration}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Video Container */}
            <div className="flex-1 relative">
                {/* Remote Video (Full Screen) */}
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={`absolute inset-0 w-full h-full object-${objectFit} transition-all duration-300 bg-black`}
                />

                {/* Calling/Connecting Overlay */}
                {callStatus === 'calling' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                        <div className="text-center">
                            <div className="relative inline-block">
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                    className="absolute inset-0 bg-indigo-500 rounded-full opacity-30"
                                />
                                <img
                                    src={currentCall?.oderAvatar || `https://ui-avatars.com/api/?name=${currentCall?.oderName}&background=random&size=120`}
                                    alt={currentCall?.oderName}
                                    className="w-32 h-32 rounded-full object-cover border-4 border-white/20 relative z-10"
                                />
                            </div>
                            <h2 className="text-white text-2xl font-semibold mt-6">{currentCall?.oderName}</h2>
                            <p className="text-white/60 mt-2 animate-pulse">Calling...</p>
                        </div>
                    </div>
                )}

                {/* Local Video (Picture-in-Picture) */}
                <motion.div
                    drag
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    dragElastic={0.1}
                    className="absolute bottom-24 right-4 w-32 h-44 md:w-40 md:h-56 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20"
                >
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                    />
                    {!isVideoEnabled && (
                        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                            <MdVideocamOff className="w-8 h-8 text-white/50" />
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
                <div className="flex items-center justify-center gap-3 md:gap-6 flex-wrap">
                    {/* Mute Button */}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleAudio}
                        className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-colors ${isAudioEnabled
                            ? 'bg-white/20 text-white hover:bg-white/30'
                            : 'bg-red-500 text-white'
                            }`}
                    >
                        {isAudioEnabled ? <MdMic className="w-5 h-5 md:w-6 md:h-6" /> : <MdMicOff className="w-5 h-5 md:w-6 md:h-6" />}
                    </motion.button>

                    {/* Video Button */}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleVideo}
                        className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-colors ${isVideoEnabled
                            ? 'bg-white/20 text-white hover:bg-white/30'
                            : 'bg-red-500 text-white'
                            }`}
                    >
                        {isVideoEnabled ? <MdVideocam className="w-5 h-5 md:w-6 md:h-6" /> : <MdVideocamOff className="w-5 h-5 md:w-6 md:h-6" />}
                    </motion.button>

                    {/* Switch Camera Button (Mobile/Tablet friendly) */}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={switchCamera}
                        className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center bg-white/20 text-white hover:bg-white/30 transition-colors"
                        title="Switch Camera"
                    >
                        <MdFlipCameraIos className="w-5 h-5 md:w-6 md:h-6" />
                    </motion.button>

                    {/* Aspect Ratio Toggle */}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleObjectFit}
                        className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center bg-white/20 text-white hover:bg-white/30 transition-colors"
                        title="Toggle View Mode"
                    >
                        <MdAspectRatio className="w-5 h-5 md:w-6 md:h-6" />
                    </motion.button>

                    {/* End Call Button */}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={endCall}
                        className="w-14 h-14 md:w-16 md:h-16 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-red-600 transition-colors"
                    >
                        <MdCallEnd className="w-6 h-6 md:w-8 md:h-8" />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};

export default VideoCall;
