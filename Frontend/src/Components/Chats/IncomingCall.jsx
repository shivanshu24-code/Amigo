import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdCall, MdCallEnd } from 'react-icons/md';
import { useCallStore } from '../../Store/CallStore.js';

const IncomingCall = () => {
    const { callStatus, currentCall, acceptCall, rejectCall } = useCallStore();
    const audioRef = useRef(null);

    // Play ringtone when ringing
    useEffect(() => {
        if (callStatus === 'ringing') {
            // Create audio element for ringtone
            audioRef.current = new Audio('/ringtone.mp3');
            audioRef.current.loop = true;
            audioRef.current.play().catch(e => console.log('Audio play failed:', e));

            return () => {
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current = null;
                }
            };
        }
    }, [callStatus]);

    if (callStatus !== 'ringing' || !currentCall?.isIncoming) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4"
                >
                    {/* Caller Avatar */}
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="absolute inset-0 bg-green-400 rounded-full opacity-30"
                            />
                            <img
                                src={currentCall.oderAvatar || `https://ui-avatars.com/api/?name=${currentCall.oderName}&background=random&size=120`}
                                alt={currentCall.oderName}
                                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg relative z-10"
                            />
                        </div>

                        {/* Caller Name */}
                        <h2 className="text-2xl font-bold text-gray-900 mt-4">
                            {currentCall.oderName}
                        </h2>

                        {/* Call Status */}
                        <p className="text-gray-500 mt-1 animate-pulse">
                            {currentCall?.callType === "voice" ? "Incoming voice call..." : "Incoming video call..."}
                        </p>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-8 mt-8">
                            {/* Decline Button */}
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={rejectCall}
                                className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-red-600 transition-colors"
                            >
                                <MdCallEnd className="w-8 h-8" />
                            </motion.button>

                            {/* Accept Button */}
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={acceptCall}
                                className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-green-600 transition-colors"
                            >
                                <MdCall className="w-8 h-8" />
                            </motion.button>
                        </div>

                        {/* Labels */}
                        <div className="flex items-center gap-12 mt-3 text-sm text-gray-500">
                            <span>Decline</span>
                            <span>Accept</span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default IncomingCall;
