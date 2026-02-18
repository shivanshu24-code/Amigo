import { useEffect, useRef } from "react";
import api from "../Services/Api";
import { useAuthStore } from "../Store/AuthStore";

const useUsageTracker = () => {
    const { isAuthenticated, user } = useAuthStore();
    const startTimeRef = useRef(Date.now());
    const intervalRef = useRef(null);

    const logActivity = async () => {
        const now = Date.now();
        const elapsedSeconds = Math.round((now - startTimeRef.current) / 1000);

        if (elapsedSeconds > 0) {
            console.log(`[UsageTracker] Sending heartbeat: ${elapsedSeconds}s`);
            try {
                await api.post("/usage/log", { seconds: elapsedSeconds });
                startTimeRef.current = now;
            } catch (error) {
                console.error("[UsageTracker] Error:", error);
            }
        }
    };

    useEffect(() => {
        if (!isAuthenticated) return;

        // Reset start time on mount/login
        startTimeRef.current = Date.now();

        // Initial log after 10s for quick feedback
        const initialTimeout = setTimeout(logActivity, 10000);

        // Regular heartbeat every 30s
        intervalRef.current = setInterval(logActivity, 30000);

        return () => {
            clearTimeout(initialTimeout);
            if (intervalRef.current) clearInterval(intervalRef.current);
            logActivity();
        };
    }, [isAuthenticated, user?._id]);
};

export default useUsageTracker;
