import React, { useEffect, useState } from "react";
import { useStoryStore } from "../Store/StoryStore.js";
import { useFriendStore } from "../Store/FriendStore.js";
import { Eye, EyeOff, ChevronLeft, UserX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Avatar from "../Components/Avatar.jsx";

const StorySettingsPage = () => {
    const navigate = useNavigate();
    const { hiddenStoryUsers, fetchHiddenStoryUsers, toggleHideStoryFromUser, settingsLoading } = useStoryStore();
    const { friends, fetchFriends } = useFriendStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("hide");

    useEffect(() => {
        fetchHiddenStoryUsers();
        fetchFriends();
    }, []);

    const handleToggle = async (userId) => {
        await toggleHideStoryFromUser(userId);
    };

    const isUserHidden = (userId) => {
        return hiddenStoryUsers.some(u => (u._id || u) === userId);
    };

    const hiddenUserIds = hiddenStoryUsers.map(u => u._id || u);

    // Filter friends based on search
    const filteredFriends = friends.filter(friend => {
        const fullName = friend.firstname && friend.lastname 
            ? `${friend.firstname} ${friend.lastname}` 
            : friend.username;
        return fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
               friend.username.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className="h-full bg-white flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 px-4 py-4 border-b border-gray-100">
                <button
                    onClick={() => navigate("/settings")}
                    className="p-2 hover:bg-gray-50 rounded-full transition-colors"
                >
                    <ChevronLeft size={24} className="text-gray-600" />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Story Settings</h1>
                    <p className="text-xs text-gray-500">Control who sees your stories</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-4 bg-white sticky top-0 z-10">
                <button
                    onClick={() => setActiveTab("hide")}
                    className={`flex-1 py-4 text-sm font-semibold border-b-2 transition-all ${
                        activeTab === "hide"
                            ? "text-gray-900 border-gray-900"
                            : "text-gray-500 border-transparent hover:text-gray-700"
                    }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <EyeOff size={16} />
                        Hide From
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab("visible")}
                    className={`flex-1 py-4 text-sm font-semibold border-b-2 transition-all ${
                        activeTab === "visible"
                            ? "text-gray-900 border-gray-900"
                            : "text-gray-500 border-transparent hover:text-gray-700"
                    }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <Eye size={16} />
                        Visible
                    </div>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {activeTab === "hide" ? (
                    <div className="max-w-2xl mx-auto">
                        {/* Info Box */}
                        <div className="bg-purple-50 rounded-2xl p-4 mb-4 border border-purple-100">
                            <p className="text-xs text-purple-700 leading-relaxed">
                                Your stories won't be visible to the users you hide them from. They won't be notified about this.
                            </p>
                        </div>

                        {/* Search */}
                        <div className="mb-6">
                            <input
                                type="text"
                                placeholder="Search friends..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:border-gray-400 text-sm"
                            />
                        </div>

                        {settingsLoading ? (
                            <div className="flex items-center justify-center h-40">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            </div>
                        ) : filteredFriends.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <UserX className="w-10 h-10 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">No friends found</h3>
                                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                    You don't have any friends to hide stories from yet.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">
                                    Select friends to hide your stories from
                                </p>
                                {filteredFriends.map((friend) => (
                                    <div
                                        key={friend._id}
                                        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar
                                                src={friend.avatar}
                                                name={friend.firstname ? `${friend.firstname} ${friend.lastname}` : friend.username}
                                                className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                                            />
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">
                                                    {friend.firstname && friend.lastname
                                                        ? `${friend.firstname} ${friend.lastname}`
                                                        : friend.username
                                                    }
                                                </p>
                                                <p className="text-xs text-gray-500">@{friend.username}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleToggle(friend._id)}
                                            className={`p-2 rounded-xl transition-all shadow-sm border ${
                                                isUserHidden(friend._id)
                                                    ? "bg-purple-100 text-purple-600 border-purple-200 hover:bg-purple-200"
                                                    : "text-gray-400 hover:bg-gray-100 border-transparent hover:border-gray-200"
                                            }`}
                                            title={isUserHidden(friend._id) ? "Stories visible" : "Stories hidden"}
                                        >
                                            {isUserHidden(friend._id) ? (
                                                <EyeOff size={18} />
                                            ) : (
                                                <Eye size={18} />
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="max-w-2xl mx-auto">
                        {/* Info Box */}
                        <div className="bg-green-50 rounded-2xl p-4 mb-4 border border-green-100">
                            <p className="text-xs text-green-700 leading-relaxed">
                                These are all your friends who can see your stories. Stories are visible to all friends by default.
                            </p>
                        </div>

                        {/* Search */}
                        <div className="mb-6">
                            <input
                                type="text"
                                placeholder="Search friends..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:border-gray-400 text-sm"
                            />
                        </div>

                        {settingsLoading ? (
                            <div className="flex items-center justify-center h-40">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            </div>
                        ) : filteredFriends.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <UserX className="w-10 h-10 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">No friends found</h3>
                                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                    You don't have any friends yet.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">
                                    {filteredFriends.length} {filteredFriends.length === 1 ? "Friend" : "Friends"}
                                </p>
                                {filteredFriends.map((friend) => (
                                    <div
                                        key={friend._id}
                                        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar
                                                src={friend.avatar}
                                                name={friend.firstname ? `${friend.firstname} ${friend.lastname}` : friend.username}
                                                className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                                            />
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">
                                                    {friend.firstname && friend.lastname
                                                        ? `${friend.firstname} ${friend.lastname}`
                                                        : friend.username
                                                    }
                                                </p>
                                                <p className="text-xs text-gray-500">@{friend.username}</p>
                                            </div>
                                        </div>
                                        <div className="p-2 text-green-600">
                                            <Eye size={18} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StorySettingsPage;
