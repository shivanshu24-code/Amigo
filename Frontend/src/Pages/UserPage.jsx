import React, { useEffect, useState } from "react";
import { useUserStore } from "../Store/UserStore.js";
import { useFriendStore } from "../Store/FriendStore.js";
import { Search, UserPlus, Check, X, Users, MessageCircle, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../Store/ChatStore.js";

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
    } = useFriendStore();
    const { setCurrentChat, setMobileChatOpen } = useChatStore();

    // Local state
    const [sendingRequest, setSendingRequest] = useState(null);
    const [processingRequest, setProcessingRequest] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");

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
            "bg-slate-50",
            "bg-gray-50",
            "bg-zinc-50",
            "bg-stone-50",
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
                className="group relative bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-gray-300 transition-all duration-300"
            >
                {/* Subtle Banner */}
                <div className={`h-20 ${getSubtleColor(index)} relative border-b border-gray-50`}>
                    {user.isVerified && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-100 rounded-full shadow-sm">
                            <Sparkles className="w-3 h-3 text-blue-500" />
                            <span className="text-[10px] text-gray-600 font-medium">Verified</span>
                        </div>
                    )}
                </div>

                {/* Avatar */}
                <div className="relative px-5">
                    <div className="absolute -top-10 left-5">
                        <div
                            onClick={() => navigate(`/profile/${user._id}`)}
                            className="w-20 h-20 rounded-xl bg-white p-1 shadow-sm ring-1 ring-gray-100 cursor-pointer hover:ring-gray-300 transition-all"
                        >
                            {user.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.username}
                                    className="w-full h-full object-cover rounded-lg"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-2xl font-bold">
                                    {(user.firstname || user.username || user.email)?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="pt-12 px-5 pb-5">
                    {/* Name & Username */}
                    <div className="mb-3">
                        <h3
                            onClick={() => navigate(`/profile/${user._id}`)}
                            className="font-bold text-gray-900 text-lg cursor-pointer hover:text-blue-600 transition-colors"
                        >
                            {user.firstname && user.lastname
                                ? `${user.firstname} ${user.lastname}`
                                : user.username || "User"
                            }
                        </h3>
                        <p className="text-sm text-gray-500">@{user.username || user.email?.split("@")[0]}</p>
                    </div>

                    {/* Course/Year */}
                    {(user.course || user.year) && (
                        <p className="text-sm text-gray-600 font-medium mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            {user.course}{user.year ? ` • ${user.year}` : ""}
                        </p>
                    )}

                    {/* Bio */}
                    {user.bio && (
                        <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">{user.bio}</p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 py-3 border-t border-gray-50">
                        <div className="text-center min-w-[3rem]">
                            <p className="font-bold text-gray-900">{user.friends?.length || 0}</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Friends</p>
                        </div>
                        {user.interest && (
                            <div className="flex-1 flex flex-wrap gap-1.5">
                                {user.interest.split(",").slice(0, 2).map((tag, i) => (
                                    <span key={i} className="px-2 py-1 text-[10px] bg-gray-50 text-gray-600 border border-gray-100 rounded-md">
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
                                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-900 text-white rounded-lg font-medium text-sm hover:bg-black transition"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    Message
                                </button>
                                <button className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition">
                                    <Check className="w-4 h-4" />
                                </button>
                            </>
                        ) : status === "pending" ? (
                            <button
                                disabled
                                className="flex-1 py-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-sm font-medium"
                            >
                                Request Sent
                            </button>
                        ) : status === "received" ? (
                            <div className="flex-1 flex gap-2">
                                <button
                                    onClick={() => handleAcceptRequest(requestId, user._id)}
                                    disabled={isProcessing}
                                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black transition"
                                >
                                    Confirm
                                </button>
                                <button
                                    onClick={() => handleRejectRequest(requestId, user._id)}
                                    disabled={isProcessing}
                                    className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                                >
                                    Delete
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => handleSendRequest(user._id)}
                                disabled={isLoading}
                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                            >
                                <UserPlus className="w-4 h-4" />
                                {isLoading ? "Adding..." : "Add Friend"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-full bg-white overflow-auto pb-20 md:pb-0">
            {/* Minimal Header */}
            <div className="bg-white border-b border-gray-100 pt-8 pb-6">
                <div className="max-w-5xl mx-auto px-4 md:px-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">People</h1>
                    <p className="text-gray-500">Connect with students and friends</p>

                    {/* Minimal Search Bar */}
                    <div className="relative mt-6 max-w-xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or username..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 text-gray-900 rounded-xl border border-transparent focus:bg-white focus:border-gray-200 focus:ring-2 focus:ring-gray-100 outline-none transition text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 border-b border-gray-100">
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
                                    ? "border-gray-900 text-gray-900"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === tab.id ? "bg-gray-100 text-gray-900" : "bg-gray-100 text-gray-500"
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
                            <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
                                {/* Banner Skeleton */}
                                <div className="h-20 bg-gray-100"></div>

                                {/* Avatar Skeleton */}
                                <div className="px-5 relative">
                                    <div className="absolute -top-10 left-5 w-20 h-20 bg-gray-200 rounded-xl ring-4 ring-white"></div>
                                </div>

                                {/* Content Skeleton */}
                                <div className="pt-12 px-5 pb-5">
                                    {/* Name & Username */}
                                    <div className="space-y-2 mb-4">
                                        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                                    </div>

                                    {/* Bio Lines */}
                                    <div className="space-y-2 mb-4">
                                        <div className="h-3 bg-gray-100 rounded w-full"></div>
                                        <div className="h-3 bg-gray-100 rounded w-5/6"></div>
                                    </div>

                                    {/* Stats */}
                                    <div className="py-3 border-t border-gray-50 flex gap-4">
                                        <div className="w-12 h-8 bg-gray-100 rounded"></div>
                                        <div className="flex-1 h-8 bg-gray-100 rounded"></div>
                                    </div>

                                    {/* Button */}
                                    <div className="h-9 bg-gray-200 rounded-lg mt-2"></div>
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
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 mb-1">
                            {searchQuery ? "No matches found" : "No users yet"}
                        </h3>
                        <p className="text-sm text-gray-500">
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
    );
};

export default UserPage;
