import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, LogOut } from "lucide-react";
import { useAuthStore } from "../Store/AuthStore.js";

const ProfileView = () => {
    const [open, setOpen] = useState(false);
    const { user, logout } = useAuthStore();

    console.log("ProfileView render, user =", user);

    // 🛡️ HARD GUARD — REQUIRED
    if (!user) {
        return (
            <div className="px-4 py-3 border-t text-sm text-gray-400">
                Loading profile…
            </div>
        );
    }

    return (
        <div className="relative flex items-center justify-between px-4 py-3 bg-white border-t">
            {/* Left */}
            <div className="flex items-center gap-3">
                <img
                    src={user?.avatar || "/profile.jpg"}
                    alt="profile"
                    className="w-9 h-9 rounded-full object-cover"
                />
                <p className="font-medium text-gray-800">
                    {user.username}
                </p>
            </div>

            {/* Right */}
            <button
                onClick={() => setOpen((p) => !p)}
                className="p-2 rounded-full hover:bg-gray-100"
            >
                <MoreVertical size={18} />
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-4 bottom-14 w-36 bg-white rounded-xl shadow-lg border z-50"
                    >
                        <button
                            onClick={() => {
                                logout();
                                setOpen(false);
                            }}
                            className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-600 hover:bg-gray-50 rounded-xl"
                        >
                            <LogOut size={16} />
                            Logout
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProfileView;
