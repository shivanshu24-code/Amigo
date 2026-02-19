import React, { useEffect, useState } from "react";
import { ChevronLeft, MessageSquare, UserX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../Store/AuthStore.js";
import { useFriendStore } from "../Store/FriendStore.js";
import Avatar from "../Components/Avatar.jsx";

const ChatSettingsPage = () => {
    const navigate = useNavigate();
    const { user, loading, updateReadReceipts } = useAuthStore();
    const { blockedUsers, fetchBlockedUsers, unblockUser } = useFriendStore();
    const [readReceiptsEnabled, setReadReceiptsEnabled] = useState(user?.readReceiptsEnabled !== false);

    useEffect(() => {
        setReadReceiptsEnabled(user?.readReceiptsEnabled !== false);
    }, [user?.readReceiptsEnabled]);

    useEffect(() => {
        fetchBlockedUsers();
    }, [fetchBlockedUsers]);

    const handleToggleReadReceipts = async () => {
        const nextValue = !readReceiptsEnabled;
        const success = await updateReadReceipts(nextValue);
        if (success) {
            setReadReceiptsEnabled(nextValue);
        }
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
                    <h1 className="text-xl font-bold text-gray-900">Chat Settings</h1>
                    <p className="text-xs text-gray-500">Manage chat privacy and controls</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-2xl mx-auto space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${readReceiptsEnabled ? "bg-indigo-50 text-indigo-600" : "bg-gray-100 text-gray-500"}`}>
                                    <MessageSquare size={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Read receipts</p>
                                    <p className="text-xs text-gray-500">Show blue ticks when you read messages</p>
                                </div>
                            </div>
                            <button
                                onClick={handleToggleReadReceipts}
                                disabled={loading}
                                className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${readReceiptsEnabled ? "bg-indigo-600" : "bg-gray-300"}`}
                            >
                                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${readReceiptsEnabled ? "translate-x-6" : ""}`} />
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100">
                            <h2 className="text-sm font-bold text-gray-900">Blocked for chats</h2>
                            <p className="text-xs text-gray-500 mt-0.5">People you blocked from messaging</p>
                        </div>

                        <div className="p-3">
                            {blockedUsers.length === 0 ? (
                                <div className="text-center py-10">
                                    <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <UserX className="w-7 h-7 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-900">No blocked users</p>
                                    <p className="text-xs text-gray-500 mt-1">Blocked users will appear here.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {blockedUsers.map((blockedUser) => (
                                        <div key={blockedUser._id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50">
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    src={blockedUser.avatar}
                                                    name={blockedUser.username}
                                                    className="w-10 h-10 rounded-full border border-gray-100"
                                                />
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{blockedUser.username}</p>
                                                    <p className="text-[11px] text-gray-500">{blockedUser.email}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => unblockUser(blockedUser._id)}
                                                className="px-3 py-1.5 rounded-full text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100"
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
            </div>
        </div>
    );
};

export default ChatSettingsPage;
