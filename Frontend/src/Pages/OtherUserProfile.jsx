import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProfileStore } from '../Store/ProfileStore.js';
import { usePostStore } from '../Store/PostStore.js';
import { useFriendStore } from '../Store/FriendStore.js';
import { BadgeCheck, Grid3X3, Bookmark, Heart, ArrowLeft, MessageCircle, Lock } from "lucide-react";

import ProfileSkeleton from '../Components/ProfileSkeleton.jsx';
import Avatar from '../Components/Avatar.jsx';

const OtherUserProfile = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("posts");

    // Stores
    const { profile, isOwner, loading, error: profileError, fetchProfileById } = useProfileStore();
    const { userPosts, fetchUserPosts, error: postError } = usePostStore();
    const {
        friends,
        fetchFriends,
        fetchBlockedUsers,
        getFriendStatus,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        removeFriend,
        blockUser,
        unblockUser,
        isUserBlocked
    } = useFriendStore();

    useEffect(() => {
        if (userId) {
            // If it's my own ID, just go to the main profile page
            const token = localStorage.getItem("token");
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split(".")[1]));
                    if (payload.id === userId) {
                        navigate('/profile', { replace: true });
                        return;
                    }
                } catch (e) {
                    console.error("Token parse error", e);
                }
            }
            fetchProfileById(userId);
            fetchUserPosts(userId);
            fetchFriends();
            fetchBlockedUsers();
        }
    }, [userId, navigate, fetchProfileById, fetchUserPosts, fetchFriends, fetchBlockedUsers]);

    const relationshipStatus = getFriendStatus(userId);
    const [actionLoading, setActionLoading] = useState(false);
    const [blockLoading, setBlockLoading] = useState(false);
    const blocked = isUserBlocked(userId);

    const handleConnect = async () => {
        setActionLoading(true);
        await sendFriendRequest(userId);
        setActionLoading(false);
    };

    const handleRemoveFriend = async () => {
        if (window.confirm("Are you sure you want to remove this friend?")) {
            setActionLoading(true);
            await removeFriend(userId);
            setActionLoading(false);
        }
    };

    const handleBlockToggle = async () => {
        if (!blocked && !window.confirm("Block this user? They will be removed from friends and requests.")) {
            return;
        }
        setBlockLoading(true);
        if (blocked) {
            await unblockUser(userId);
        } else {
            await blockUser(userId);
        }
        setBlockLoading(false);
    };

    const renderActionButtons = () => {
        if (blocked) {
            return (
                <button
                    disabled
                    className="px-6 py-2.5 text-sm font-medium text-gray-500 bg-gray-100 rounded-full cursor-not-allowed"
                >
                    Blocked
                </button>
            );
        }

        if (relationshipStatus === "friends") {
            return (
                <div className="flex gap-2 flex-1">
                    <button
                        onClick={() => navigate('/chat')}
                        className="px-6 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-full transition shadow-sm"
                    >
                        Message
                    </button>
                    <button
                        onClick={handleRemoveFriend}
                        disabled={actionLoading}
                        className="px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition shadow-sm"
                    >
                        {actionLoading ? "..." : "Remove"}
                    </button>
                </div>
            );
        }

        if (relationshipStatus === "pending") {
            return (
                <button disabled className="px-6 py-2.5 text-sm font-medium text-gray-500 bg-gray-100 rounded-full cursor-not-allowed">
                    Request Sent
                </button>
            );
        }

        if (relationshipStatus?.status === "received") {
            return (
                <>
                    <button
                        onClick={() => acceptFriendRequest(relationshipStatus.requestId, userId)}
                        className="flex-1 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-full transition shadow-sm"
                    >
                        Accept
                    </button>
                    <button
                        onClick={() => rejectFriendRequest(relationshipStatus.requestId, userId)}
                        className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition shadow-sm"
                    >
                        Reject
                    </button>
                </>
            );
        }

        // None / Not friends
        return (
            <button
                onClick={handleConnect}
                disabled={actionLoading}
                className="px-6 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-full transition shadow-sm"
            >
                {actionLoading ? "Sending..." : "Connect"}
            </button>
        );
    };

    const tabs = [
        { id: "posts", label: "Posts", icon: Grid3X3 },
        { id: "saved", label: "Saved", icon: Bookmark },
        { id: "liked", label: "Liked", icon: Heart },
    ];

    if (loading) {
        return <ProfileSkeleton />;
    }

    // Handle Profile Load Error
    if (profileError && !profile) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-white p-6 text-center">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <ArrowLeft className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
                <p className="text-gray-500 mb-6 max-w-xs">{profileError}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-2.5 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition shadow-md"
                >
                    Go Back
                </button>
            </div>
        );
    }

    if (!profile) return null;

    const isPrivateAccount = postError && postError.includes("private");

    return (
        <div className="w-full h-full overflow-auto bg-white pb-24 md:pb-0">
            {/* Cover Image */}
            <div className="relative h-32 sm:h-44 md:h-52 overflow-hidden">
                {profile.coverImage ? (
                    <img
                        src={profile.coverImage}
                        alt="cover"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-200 via-pink-200 to-cyan-200">
                        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 200">
                            <path d="M0,100 Q50,50 100,80 T200,60 T300,90 T400,70 L400,200 L0,200 Z" fill="rgba(255,182,193,0.3)" />
                            <path d="M0,120 Q80,80 150,100 T280,80 T400,100 L400,200 L0,200 Z" fill="rgba(173,216,230,0.3)" />
                            <path d="M0,140 Q60,100 120,130 T240,110 T400,140 L400,200 L0,200 Z" fill="rgba(255,218,185,0.3)" />
                        </svg>
                        <div className="absolute top-4 right-8 w-16 md:w-20 h-16 md:h-20 border-2 border-gray-800/10 rounded-full"></div>
                        <div className="absolute top-10 right-20 w-10 md:w-12 h-10 md:h-12 border-2 border-gray-800/10 rounded-full"></div>
                    </div>
                )}

                {/* Back Button (Mobile) */}
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-4 left-4 p-2 bg-black/20 backdrop-blur-md rounded-full text-white md:hidden z-20"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
            </div>

            {/* Profile Section */}
            <div className="relative px-4">
                {/* Mobile Layout */}
                <div className="md:hidden">
                    <div className="flex justify-center -mt-12">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-b from-pink-300 to-pink-100">
                                <Avatar
                                    src={profile.user?.avatar || profile.avatar}
                                    name={`${profile.firstname} ${profile.lastname}`}
                                    className="w-full h-full rounded-full border-4 border-white text-3xl"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center gap-8 mt-3">
                        <div className="text-center">
                            <p className="font-bold text-gray-900">{profile.friends?.length ?? profile.friendsCount ?? 0}</p>
                            <p className="text-xs text-gray-500">Friends</p>
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-gray-900">{userPosts.length || "0"}</p>
                            <p className="text-xs text-gray-500">Posts</p>
                        </div>
                    </div>

                    <div className="text-center mt-4">
                        <div className="flex items-center justify-center gap-2">
                            <h1 className="text-xl font-bold text-gray-900">
                                {profile.firstname
                                    ? `${profile.firstname} ${profile.lastname || ""}`
                                    : (profile.username || profile.email?.split("@")[0] || "User")
                                }
                            </h1>
                            <BadgeCheck className="w-5 h-5 text-blue-500 fill-blue-100" />
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">@{profile.username || profile.user?.username || "username"}</p>
                    </div>

                    {profile.bio && (
                        <p className="mt-3 text-gray-600 text-sm text-center leading-relaxed px-4">
                            {profile.bio}
                        </p>
                    )}

                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                        {profile.course && (
                            <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                                📚 {profile.course}
                            </span>
                        )}
                        {profile.year && (
                            <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                                🎓 {profile.year}
                            </span>
                        )}
                        {(profile.interest || profile.interests || profile.skill)?.split(",").map((skill, index) => (
                            <span
                                key={index}
                                className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-full text-xs"
                            >
                                {skill.trim()}
                            </span>
                        ))}
                    </div>

                    <div className="mt-4 flex  gap-3">
                        {renderActionButtons()}
                        <button
                            onClick={handleBlockToggle}
                            disabled={blockLoading}
                            className={`px-4 py-2.5 text-sm font-medium rounded-full transition shadow-sm ${blocked
                                ? "text-green-700 bg-green-50 hover:bg-green-100"
                                : "text-red-600 bg-red-50 hover:bg-red-100"
                                }`}
                        >
                            {blockLoading ? "..." : blocked ? "Unblock" : "Block"}
                        </button>
                    </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:block">
                    <div className="flex items-end -mt-14">
                        <div className="relative flex-shrink-0">
                            <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-b from-pink-300 to-pink-100">
                                <Avatar
                                    src={profile.user?.avatar || profile.avatar}
                                    name={`${profile.firstname} ${profile.lastname}`}
                                    className="w-full h-full rounded-full border-4 border-white text-4xl"
                                />
                            </div>
                        </div>

                        <div className="flex justify-center gap-8 mt-3">

                            <div className="text-center">
                                <p className="font-bold text-gray-900">{friends.length}</p>
                                <p className="text-xs text-gray-500">Friends</p>
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-gray-900">{userPosts.length || "0"}</p>
                                <p className="text-xs text-gray-500">Posts</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-3">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-gray-900">
                                {profile.firstname} {profile.lastname}
                            </h1>
                            <BadgeCheck className="w-6 h-6 text-blue-500 fill-blue-100" />
                        </div>

                        {profile.bio && (
                            <p className="mt-3 text-gray-600 leading-relaxed max-w-lg">
                                {profile.bio}
                            </p>
                        )}

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            {profile.course && (
                                <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm">
                                    📚 {profile.course}
                                </span>
                            )}
                            {profile.year && (
                                <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm">
                                    🎓 {profile.year}
                                </span>
                            )}
                            {(profile.interest || profile.interests || profile.skill)?.split(",").map((skill, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-full text-sm"
                                >
                                    {skill.trim()}
                                </span>
                            ))}
                        </div>

                        <div className="mt-5 flex gap-3">
                            {renderActionButtons()}
                            <button
                                onClick={handleBlockToggle}
                                disabled={blockLoading}
                                className={`px-4 py-2.5 text-sm font-medium rounded-full transition shadow-sm ${blocked
                                    ? "text-green-700 bg-green-50 hover:bg-green-100"
                                    : "text-red-600 bg-red-50 hover:bg-red-100"
                                    }`}
                            >
                                {blockLoading ? "..." : blocked ? "Unblock" : "Block"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="mt-6 border-t border-gray-100">
                <div className="flex px-4 gap-2 pt-3 overflow-x-auto scrollbar-hide">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition ${activeTab === tab.id
                                    ? "bg-gray-900 text-white shadow-md"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-sm"
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Grid */}
            <div className="p-3 sm:p-4 md:p-6">
                {activeTab === "posts" && (
                    <>
                        {isPrivateAccount ? (
                            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                    <Lock size={40} className="text-gray-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">This Account is Private</h3>
                                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                    Follow this account to see their posts and stories.
                                </p>
                            </div>
                        ) : userPosts.length > 0 ? (
                            <div className="grid grid-cols-3 gap-1 sm:gap-4 md:gap-6">
                                {userPosts.map((post) => (
                                    <div
                                        key={post._id}
                                        className="relative bg-white rounded-lg sm:rounded-2xl overflow-hidden group cursor-pointer border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300"
                                    >
                                        <div className="aspect-square">
                                            {post.media ? (
                                                <img
                                                    src={post.media}
                                                    alt="post"
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50/30 to-purple-50/30">
                                                    <p className="text-xs sm:text-sm text-gray-600 italic text-center line-clamp-4 leading-relaxed">
                                                        "{post.caption}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Premium Hover overlay */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center text-white backdrop-blur-[2px]">
                                            <div className="flex items-center gap-6">
                                                <div className="flex flex-col items-center gap-1 group/stat transition-transform hover:scale-110">
                                                    <Heart className="w-6 h-6 fill-white drop-shadow-lg" />
                                                    <span className="font-bold text-sm">{post.likes?.length || 0}</span>
                                                </div>
                                                <div className="flex flex-col items-center gap-1 group/stat transition-transform hover:scale-110">
                                                    <MessageCircle className="w-6 h-6 fill-white drop-shadow-lg" />
                                                    <span className="font-bold text-sm">{post.comments?.length || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 sm:py-16">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Grid3X3 className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" />
                                </div>
                                <p className="text-gray-500 font-medium">No posts yet</p>
                            </div>
                        )}
                    </>
                )}

                {activeTab === "saved" && (
                    <div className="text-center py-12 sm:py-16">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bookmark className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">No saved posts</p>
                    </div>
                )}

                {activeTab === "liked" && (
                    <div className="text-center py-12 sm:py-16">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">No liked posts</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OtherUserProfile;
