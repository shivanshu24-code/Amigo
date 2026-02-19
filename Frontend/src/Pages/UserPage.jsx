import React, { useEffect, useState } from "react";
import { useUserStore } from "../Store/UserStore.js";
import { useFriendStore } from "../Store/FriendStore.js";
import { Search, UserPlus, Check, X, Users, MessageCircle, Sparkles, Star, Lock, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../Store/ChatStore.js";
import ShareModal from "../Components/Post/ShareModal.jsx";

const UserPage = () => {
    const navigate = useNavigate();

    // Stores
    const { users, loading, error, currentUserId, fetchUsers } = useUserStore();
    const {
        friends,
        sentRequests,
        receivedRequests,
        fetchAllFriendData,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        getFriendStatus,
        toggleCloseFriend,
        isCloseFriend
    } = useFriendStore();
    const { setCurrentChat, setMobileChatOpen } = useChatStore();

    // Local state
    const [sendingRequest, setSendingRequest] = useState(null);
    const [processingRequest, setProcessingRequest] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [shareProfileId, setShareProfileId] = useState(null);

    useEffect(() => {
        fetchUsers();
        fetchAllFriendData();
    }, []);

    const handleSendRequest = async (userId) => {
        setSendingRequest(userId);
        const result = await sendFriendRequest(userId);
        if (!result.success) {
            alert(result.message || "Failed to send friend request");
        }
        setSendingRequest(null);
    };

    const handleAcceptRequest = async (requestId, senderId) => {
        setProcessingRequest(senderId);
        const result = await acceptFriendRequest(requestId, senderId);
        if (!result.success) {
            alert(result.message || "Failed to accept friend request");
        }
        setProcessingRequest(null);
    };

    const handleRejectRequest = async (requestId, senderId) => {
        setProcessingRequest(senderId);
        const result = await rejectFriendRequest(requestId, senderId);
        if (!result.success) {
            alert(result.message || "Failed to reject friend request");
        }
        setProcessingRequest(null);
    };

    const handleMessageUser = (user) => {
        setCurrentChat(user);
        setMobileChatOpen(true);
        navigate("/chat");
    };

    const handleShareProfile = (user) => {
        setShareProfileId(user._id);
    };

    // Filter users
    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.username || user.email || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
            (user.firstname || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.lastname || "").toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;
        if (user._id === currentUserId) return false;

        if (activeTab === "friends") {
            const status = getFriendStatus(user._id);
            return typeof status === "object" ? status.status === "friends" : status === "friends";
        }
        if (activeTab === "requests") {
            const status = getFriendStatus(user._id);
            const statusVal = typeof status === "object" ? status.status : status;
            return statusVal === "received" || statusVal === "pending";
        }
        return true;
    });

    const getSubtleColor = (index) => {
        const colors = [
            "bg-slate-50 dark:bg-[#141414]",
            "bg-gray-50 dark:bg-[#151515]",
            "bg-zinc-50 dark:bg-[#121212]",
            "bg-stone-50 dark:bg-[#161616]",
        ];
        return colors[index % colors.length];
    };

    const renderUserCard = (user, index) => {
        const statusResult = getFriendStatus(user._id);
        const isLoading = sendingRequest === user._id;
        const isProcessing = processingRequest === user._id;
        const status = typeof statusResult === "object" ? statusResult.status : statusResult;
        const requestId = typeof statusResult === "object" ? statusResult.requestId : null;
        const isFriend = status === "friends";

        return (
            <div
                key={user._id}
                className="group relative bg-white dark:bg-[#0f0f0f] rounded-xl border border-gray-100 dark:border-[#2a2a2a] overflow-hidden hover:border-gray-300 dark:hover:border-[#3a3a3a] transition-all duration-300"
            >
                {/* Subtle Banner */}
                <div className={`h-20 ${getSubtleColor(index)} relative border-b border-gray-50 dark:border-[#222]`}>
                    {user.isVerified && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-[#2a2a2a] rounded-full shadow-sm">
                            <Sparkles className="w-3 h-3 text-blue-500" />
                            <span className="text-[10px] text-gray-600 dark:text-gray-300 font-medium">Verified</span>
                        </div>
                    )}
                </div>

                {/* Avatar */}
                <div className="relative px-5">
                    <div className="absolute -top-10 left-5">
                        <div
                            onClick={() => navigate(`/profile/${user._id}`)}
                            className="w-20 h-20 rounded-xl bg-white dark:bg-[#0e0e0e] p-1 shadow-sm ring-1 ring-gray-100 dark:ring-[#2a2a2a] cursor-pointer hover:ring-gray-300 dark:hover:ring-[#3a3a3a] transition-all"
                        >
                            {user.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.username}
                                    className="w-full h-full object-cover rounded-lg"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-100 dark:bg-[#1b1b1b] rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-300 text-2xl font-bold">
                                    {(user.firstname || user.username || user.email)?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="pt-12 px-5 pb-5">
                    {/* Name & Username */}
                    <div className="flex items-center gap-2">
                        <h3
                            onClick={() => navigate(`/profile/${user._id}`)}
                            className="font-bold text-gray-900 dark:text-gray-100 text-lg cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                            {user.firstname && user.lastname
                                ? `${user.firstname} ${user.lastname}`
                                : user.username || "User"
                            }
                        </h3>
                        {user.isPrivate && <Lock size={14} className="text-gray-400 dark:text-gray-500" />}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username || user.email?.split("@")[0]}</p>
                </div>

                {/* Course/Year */}
                {(user.course || user.year) && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-3 flex items-center gap-2 ml-auto">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        {user.course}{user.year ? ` • ${user.year}` : ""}
                    </p>
                )}

                {/* Bio */}
                {user.bio && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed ml-auto">{user.bio}</p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 py-3 border-t border-gray-50 dark:border-[#222]">
                    <button
                        onClick={() => navigate(`/profile/${user._id}?tab=friends`)}
                        className="text-center min-w-[3rem]"
                    >
                        <p className="font-bold text-gray-900 dark:text-gray-100">{user.friends?.length || 0}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Friends</p>
                    </button>
                    {user.interest && (
                        <div className="flex-1 flex flex-wrap gap-1.5">
                            {user.interest.split(",").slice(0, 2).map((tag, i) => (
                                <span key={i} className="px-2 py-1 text-[10px] bg-gray-50 dark:bg-[#141414] text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-[#2a2a2a] rounded-md">
                                    {tag.trim()}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-2">
                    {isFriend ? (
                        <>
                            <button
                                onClick={() => handleMessageUser(user)}
                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-900 dark:bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-black dark:hover:bg-indigo-500 transition"
                            >
                                <MessageCircle className="w-4 h-4" />
                                Message
                            </button>
                            <button
                                onClick={() => toggleCloseFriend(user._id)}
                                className={`px-3 py-2 rounded-lg transition-all ${isCloseFriend(user._id)
                                    ? "bg-green-100 text-green-600 border border-green-200"
                                    : "bg-gray-100 dark:bg-[#1b1b1b] text-gray-400 dark:text-gray-300 border border-transparent hover:bg-gray-200 dark:hover:bg-[#252525]"
                                    }`}
                                title={isCloseFriend(user._id) ? "Remove from Close Friends" : "Add to Close Friends"}
                            >
                                <Star className={`w-4 h-4 ${isCloseFriend(user._id) ? "fill-green-600" : ""}`} />
                            </button>
                            <button className="px-3 py-2 bg-gray-100 dark:bg-[#1b1b1b] text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-[#252525] transition">
                                <Check className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleShareProfile(user)}
                                className="px-3 py-2 bg-gray-100 dark:bg-[#1b1b1b] text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-[#252525] transition"
                                title="Share profile"
                            >
                                <Share2 className="w-4 h-4" />
                            </button>
                        </>
                    ) : status === "pending" ? (
                        <div className="flex-1 flex gap-2">
                            <button
                                disabled
                                className="flex-1 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 border border-amber-100 dark:border-amber-700/40 rounded-lg text-sm font-medium"
                            >
                                Request Sent
                            </button>
                            <button
                                onClick={() => handleShareProfile(user)}
                                className="px-3 py-2 bg-gray-100 dark:bg-[#1b1b1b] text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-[#252525] transition"
                                title="Share profile"
                            >
                                <Share2 className="w-4 h-4" />
                            </button>
                        </div>
                    ) : status === "received" ? (
                        <div className="flex-1 flex gap-2">
                            <button
                                onClick={() => handleAcceptRequest(requestId, user._id)}
                                disabled={isProcessing}
                                className="flex-1 flex items-center justify-center gap-1 py-2 bg-gray-900 dark:bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-black dark:hover:bg-indigo-500 transition"
                            >
                                Confirm
                            </button>
                            <button
                                onClick={() => handleRejectRequest(requestId, user._id)}
                                disabled={isProcessing}
                                className="px-3 py-2 bg-gray-100 dark:bg-[#1b1b1b] text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-[#252525] transition"
                            >
                                Delete
                            </button>
                            <button
                                onClick={() => handleShareProfile(user)}
                                className="px-3 py-2 bg-gray-100 dark:bg-[#1b1b1b] text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-[#252525] transition"
                                title="Share profile"
                            >
                                <Share2 className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex-1 flex gap-2">
                            <button
                                onClick={() => handleSendRequest(user._id)}
                                disabled={isLoading}
                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-white dark:bg-[#101010] border border-gray-300 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-[#1b1b1b] transition"
                            >
                                <UserPlus className="w-4 h-4" />
                                {isLoading ? "Adding..." : "Add Friend"}
                            </button>
                            <button
                                onClick={() => handleShareProfile(user)}
                                className="px-3 py-2 bg-gray-100 dark:bg-[#1b1b1b] text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-[#252525] transition"
                                title="Share profile"
                            >
                                <Share2 className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
           
        );
    };

return (
    <>
    <div className="w-full h-full bg-white dark:bg-black overflow-auto pb-20 md:pb-0">
        {/* Minimal Header */}
        <div className="bg-white dark:bg-[#0b0b0b] border-b border-gray-100 dark:border-[#222] pt-8 pb-6">
            <div className="max-w-5xl mx-auto px-4 md:px-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">People</h1>
                <p className="text-gray-500 dark:text-gray-400">Connect with students and friends</p>

                {/* Minimal Search Bar */}
                <div className="relative mt-6 max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search by name or username..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-gray-100 rounded-xl border border-transparent dark:border-[#2a2a2a] focus:bg-white dark:focus:bg-[#171717] focus:border-gray-200 dark:focus:border-[#3a3a3a] focus:ring-2 focus:ring-gray-100 dark:focus:ring-white/10 outline-none transition text-sm"
                    />
                </div>
            </div>
        </div>

        {/* Tabs */}
        <div className="sticky top-0 bg-white/95 dark:bg-[#0b0b0b]/95 backdrop-blur-sm z-10 border-b border-gray-100 dark:border-[#222]">
            <div className="max-w-5xl mx-auto px-4 md:px-6">
                <div className="flex gap-6 py-1 overflow-x-auto">
                    {[
                        { id: "all", label: "Everyone", count: users.filter(u => u._id !== currentUserId).length },
                        { id: "friends", label: "Friends", count: friends.length },
                        { id: "requests", label: "Requests", count: receivedRequests.length + sentRequests.length },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 py-3 text-sm font-medium transition border-b-2 whitespace-nowrap ${activeTab === tab.id
                                ? "border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100"
                                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === tab.id ? "bg-gray-100 dark:bg-[#1b1b1b] text-gray-900 dark:text-gray-100" : "bg-gray-100 dark:bg-[#1b1b1b] text-gray-500 dark:text-gray-400"
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
            {loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-[#0f0f0f] rounded-xl border border-gray-100 dark:border-[#2a2a2a] overflow-hidden animate-pulse">
                            {/* Banner Skeleton */}
                            <div className="h-20 bg-gray-100 dark:bg-[#151515]"></div>

                            {/* Avatar Skeleton */}
                            <div className="px-5 relative">
                                <div className="absolute -top-10 left-5 w-20 h-20 bg-gray-200 dark:bg-[#1b1b1b] rounded-xl ring-4 ring-white dark:ring-[#0f0f0f]"></div>
                            </div>

                            {/* Content Skeleton */}
                            <div className="pt-12 px-5 pb-5">
                                {/* Name & Username */}
                                <div className="space-y-2 mb-4">
                                    <div className="h-5 bg-gray-200 dark:bg-[#1f1f1f] rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-100 dark:bg-[#1a1a1a] rounded w-1/2"></div>
                                </div>

                                {/* Bio Lines */}
                                <div className="space-y-2 mb-4">
                                    <div className="h-3 bg-gray-100 dark:bg-[#1a1a1a] rounded w-full"></div>
                                    <div className="h-3 bg-gray-100 dark:bg-[#1a1a1a] rounded w-5/6"></div>
                                </div>

                                {/* Stats */}
                                <div className="py-3 border-t border-gray-50 flex gap-4">
                                    <div className="w-12 h-8 bg-gray-100 dark:bg-[#1a1a1a] rounded"></div>
                                    <div className="flex-1 h-8 bg-gray-100 dark:bg-[#1a1a1a] rounded"></div>
                                </div>

                                {/* Button */}
                                <div className="h-9 bg-gray-200 dark:bg-[#1f1f1f] rounded-lg mt-2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-xl text-sm">
                    <p>{error}</p>
                </div>
            )}

            {!loading && !error && filteredUsers.length === 0 && (
                <div className="text-center py-20">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-[#121212] rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-gray-300 dark:text-gray-500" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {searchQuery ? "No matches found" : "No users yet"}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {searchQuery ? "Try searching with different keywords" : "Start connecting with people!"}
                    </p>
                </div>
            )}

            {!loading && !error && filteredUsers.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers.map((user, index) => renderUserCard(user, index))}
                </div>
            )}
        </div>
    </div>
    {shareProfileId && (
        <ShareModal
            profileId={shareProfileId}
            onClose={() => setShareProfileId(null)}
        />
    )}
    </>
);
};

export default UserPage;
