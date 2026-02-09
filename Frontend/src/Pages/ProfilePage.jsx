import { useEffect, useState } from "react";
import { useProfileStore } from "../Store/ProfileStore.js";
import { usePostStore } from "../Store/PostStore.js";
import { useFriendStore } from "../Store/FriendStore.js";
import { BadgeCheck, Settings, Grid3X3, Bookmark, Heart, Edit3, Trash2, MessageCircle } from "lucide-react";
import EditProfileModal from "../Components/EditProfileModal.jsx";
import ProfileSkeleton from "../Components/ProfileSkeleton.jsx";
import PostGridSkeleton from "../Components/PostGridSkeleton.jsx";
import Avatar from "../Components/Avatar.jsx";

const ProfilePage = () => {
    const [activeTab, setActiveTab] = useState("posts");
    const [showEditModal, setShowEditModal] = useState(false);

    // Use ProfileStore
    const { profile, isOwner, loading, fetchMyProfile } = useProfileStore();
    const { userPosts, fetchUserPosts, savedPostsList, loading: postLoading, deletePost } = usePostStore();
    const { friends, fetchFriends } = useFriendStore();

    useEffect(() => {
        fetchMyProfile().then(p => {
            if (p?.userId || p?._id) {
                fetchUserPosts(p.userId || p._id);
            }
        });
        fetchFriends();
    }, []);

    useEffect(() => {
        if (activeTab === "saved") {
            usePostStore.getState().fetchSavedPosts();
        }
    }, [activeTab]);

    if (loading || !profile) {
        return <ProfileSkeleton />;
    }

    const tabs = [
        { id: "posts", label: "Posts", icon: Grid3X3 },
        { id: "saved", label: "Saved", icon: Bookmark },
        { id: "liked", label: "Liked", icon: Heart },
    ];

    const handleDeletePost = async (e, postId) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this post?")) {
            await deletePost(postId);
        }
    };

    return (
        <div className="w-full h-full overflow-auto bg-white pb-24 md:pb-0">
            <EditProfileModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                initialData={profile}
                onUpdateSuccess={fetchMyProfile}
            />

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
                        {/* Abstract wavy pattern */}
                        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 200">
                            <path d="M0,100 Q50,50 100,80 T200,60 T300,90 T400,70 L400,200 L0,200 Z" fill="rgba(255,182,193,0.3)" />
                            <path d="M0,120 Q80,80 150,100 T280,80 T400,100 L400,200 L0,200 Z" fill="rgba(173,216,230,0.3)" />
                            <path d="M0,140 Q60,100 120,130 T240,110 T400,140 L400,200 L0,200 Z" fill="rgba(255,218,185,0.3)" />
                        </svg>
                        {/* Decorative circles */}
                        <div className="absolute top-4 right-8 w-16 md:w-20 h-16 md:h-20 border-2 border-gray-800/10 rounded-full"></div>
                        <div className="absolute top-10 right-20 w-10 md:w-12 h-10 md:h-12 border-2 border-gray-800/10 rounded-full"></div>
                    </div>
                )}

                {/* Edit Cover Button (owner only) */}
                {isOwner && (
                    <button className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition">
                        <Edit3 className="w-4 h-4 text-gray-600" />
                    </button>
                )}
            </div>

            {/* Profile Section */}
            <div className="relative px-4">
                {/* Mobile Layout: Stack vertically */}
                <div className="md:hidden">
                    {/* Avatar - Centered on mobile */}
                    <div className="flex justify-center -mt-12">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-b from-pink-300 to-pink-100">
                                <Avatar
                                    src={profile?.avatar}
                                    name={`${profile.firstname} ${profile.lastname}`}
                                    className="w-full h-full rounded-full border-4 border-white text-3xl"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Stats Row - Centered */}
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

                    {/* Name - Centered */}
                    <div className="text-center mt-4">
                        <div className="flex items-center justify-center gap-2">
                            <h1 className="text-xl font-bold text-gray-900">
                                {profile.firstname} {profile.lastname}
                            </h1>
                            <BadgeCheck className="w-5 h-5 text-blue-500 fill-blue-100" />
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">@{profile.username}</p>
                    </div>

                    {/* Bio - Centered */}
                    {profile.bio && (
                        <p className="mt-3 text-gray-600 text-sm text-center leading-relaxed px-4">
                            {profile.bio}
                        </p>
                    )}

                    {/* Tags */}
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
                        {profile.interest?.split(",").slice(0, 2).map((skill, index) => (
                            <span
                                key={index}
                                className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-full text-xs"
                            >
                                {skill.trim()}
                            </span>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 flex gap-3">
                        {isOwner ? (
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition"
                            >
                                Edit Profile
                            </button>
                        ) : (
                            <>
                                <button className="flex-1 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-full transition">
                                    Connect
                                </button>
                                <button className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition">
                                    Message
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Desktop Layout: Horizontal */}
                <div className="hidden md:block">
                    <div className="flex items-end -mt-14">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-b from-pink-300 to-pink-100">
                                <Avatar
                                    src={profile?.avatar}
                                    name={`${profile.firstname} ${profile.lastname}`}
                                    className="w-full h-full rounded-full border-4 border-white text-4xl"
                                />
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-6 ml-4 mb-4">
                            <div>
                                <span className="font-bold text-gray-900 text-lg">{friends.length}</span>
                                <span className="text-gray-500 ml-1">Friends</span>
                            </div>
                            <div>
                                <span className="font-bold text-gray-900 text-lg">{userPosts.length}</span>
                                <span className="text-gray-500 ml-1">Posts</span>
                            </div>
                        </div>

                        {/* Edit Button */}
                        {isOwner && (
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="ml-auto mb-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition"
                            >
                                Edit Profile
                            </button>
                        )}
                    </div>

                    {/* Name & Bio */}
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
                            {profile.interest?.split(",").slice(0, 3).map((skill, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-full text-sm"
                                >
                                    {skill.trim()}
                                </span>
                            ))}
                        </div>

                        {!isOwner && (
                            <button className="mt-5 px-8 py-3 bg-purple-600 text-white font-medium rounded-full hover:bg-purple-700 transition">
                                Connect
                            </button>
                        )}
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
                                    ? "bg-gray-900 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
                        {userPosts.length > 0 ? (
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
                                            <div className="flex items-center gap-6 mb-2">
                                                <div className="flex flex-col items-center gap-1 group/stat transition-transform hover:scale-110">
                                                    <Heart className="w-6 h-6 fill-white drop-shadow-lg" />
                                                    <span className="font-bold text-sm">{post.likes?.length || 0}</span>
                                                </div>
                                                <div className="flex flex-col items-center gap-1 group/stat transition-transform hover:scale-110">
                                                    <MessageCircle className="w-6 h-6 fill-white drop-shadow-lg" />
                                                    <span className="font-bold text-sm">{post.comments?.length || 0}</span>
                                                </div>
                                            </div>

                                            {isOwner && (
                                                <button
                                                    onClick={(e) => handleDeletePost(e, post._id)}
                                                    className="absolute top-2 right-2 p-2 bg-red-500/20 hover:bg-red-500 text-white rounded-full backdrop-blur-md transition-all duration-200 border border-white/20 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 sm:py-16">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Grid3X3 className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                                </div>
                                <p className="text-gray-600 font-medium">No posts yet</p>
                                {isOwner && (
                                    <p className="text-sm text-gray-400 mt-1">Share your first moment!</p>
                                )}
                            </div>
                        )}
                    </>
                )}

                {activeTab === "saved" && (
                    <>
                        {postLoading ? (
                            <PostGridSkeleton count={3} />
                        ) : savedPostsList?.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                                {savedPostsList.map((post) => (
                                    <div
                                        key={post._id}
                                        className="relative bg-white rounded-xl sm:rounded-2xl overflow-hidden group cursor-pointer border border-gray-100 hover:shadow-lg transition"
                                    >
                                        <div className="aspect-square sm:aspect-[4/5]">
                                            {post.media ? (
                                                <img
                                                    src={post.media}
                                                    alt="post"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center p-3 bg-gradient-to-br from-gray-50 to-gray-100">
                                                    <p className="text-xs sm:text-sm text-gray-500 text-center line-clamp-3">
                                                        {post.caption}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 sm:py-16">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Bookmark className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                                </div>
                                <p className="text-gray-600 font-medium">No saved posts</p>
                                <p className="text-sm text-gray-400 mt-1">Posts you save will appear here</p>
                            </div>
                        )}
                    </>
                )}

                {activeTab === "liked" && (
                    <div className="text-center py-12 sm:py-16">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                        </div>
                        <p className="text-gray-600 font-medium">No liked posts</p>
                        <p className="text-sm text-gray-400 mt-1">Posts you like will appear here</p>
                    </div>
                )}
            </div>
        </div >
    );
};

export default ProfilePage;
