import React, { useEffect } from "react";
import { ChevronLeft, UserX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFriendStore } from "../Store/FriendStore.js";
import Avatar from "../Components/Avatar.jsx";

const BlockedPage = () => {
    const navigate = useNavigate();
    const { blockedUsers, fetchBlockedUsers, unblockUser } = useFriendStore();

    useEffect(() => {
        fetchBlockedUsers();
    }, [fetchBlockedUsers]);

    const handleUnblock = async (userId) => {
        await unblockUser(userId);
    };

    return (
        <div className="h-full bg-white flex flex-col">
            <div className="flex items-center gap-4 px-4 py-4 border-b border-gray-100">
                <button
                    onClick={() => navigate("/settings")}
                    className="p-2 hover:bg-gray-50 rounded-full transition-colors"
                >
                    <ChevronLeft size={24} className="text-gray-600" />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Blocked</h1>
                    <p className="text-xs text-gray-500">People you have blocked</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-2xl mx-auto">
                    {blockedUsers.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <UserX className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">No blocked users</h3>
                            <p className="text-sm text-gray-500">Users you block will appear here.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {blockedUsers.map((user) => (
                                <div
                                    key={user._id}
                                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar
                                            src={user.avatar}
                                            name={user.username}
                                            className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                                        />
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{user.username}</p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleUnblock(user._id)}
                                        className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition"
                                    >
                                        Unblock
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BlockedPage;
