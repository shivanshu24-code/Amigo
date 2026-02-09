import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { UserPlus, ArrowLeft, Lock, AlertCircle } from "lucide-react";
import api from "../Services/Api.js";
import Post from "../Components/Post.jsx";
import { useAuthStore } from "../Store/AuthStore.js";

const SharedPost = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();

    const [loading, setLoading] = useState(true);
    const [postData, setPostData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSharedPost = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/post/shared/${postId}`);
                setPostData(res.data);
            } catch (err) {
                console.error("Failed to fetch shared post:", err);
                setError(err.response?.data?.message || "Failed to load post");
            } finally {
                setLoading(false);
            }
        };

        fetchSharedPost();
    }, [postId]);

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200" />
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                </div>
            </div>
        );
    }

    // Error state
    if (error && !postData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">
                        Post Not Found
                    </h2>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button
                        onClick={() => navigate("/feed")}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Back to Feed
                    </button>
                </div>
            </div>
        );
    }

    // Not authenticated for non-public post
    if (postData?.reason === "not_authenticated") {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-amber-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">
                        Login Required
                    </h2>
                    <p className="text-gray-500 mb-2">
                        This post is from <span className="font-medium text-gray-700">@{postData.author?.username}</span>
                    </p>
                    <p className="text-gray-500 mb-6">
                        Please log in to view this post
                    </p>
                    <div className="flex flex-col gap-3">
                        <Link
                            to="/login"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:opacity-90 transition-opacity font-medium"
                        >
                            Log In
                        </Link>
                        <Link
                            to="/signin"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Create Account
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Not a friend
    if (postData?.canView === false && postData?.reason === "not_friend") {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="relative mb-6">
                        {postData.author?.avatar ? (
                            <img
                                src={postData.author.avatar}
                                alt={postData.author.username}
                                className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-white shadow-lg"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full mx-auto bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                {postData.author?.username?.[0]?.toUpperCase() || "?"}
                            </div>
                        )}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-medium">
                            Private Post
                        </div>
                    </div>

                    <h2 className="text-xl font-semibold text-gray-800 mb-2">
                        Follow to View
                    </h2>
                    <p className="text-gray-500 mb-6">
                        You need to be friends with{" "}
                        <span className="font-medium text-gray-700">@{postData.author?.username}</span>{" "}
                        to view this post
                    </p>

                    <div className="flex flex-col gap-3">
                        <Link
                            to={`/profile/${postData.author?._id}`}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:opacity-90 transition-opacity font-medium"
                        >
                            <UserPlus size={18} />
                            View Profile & Connect
                        </Link>
                        <button
                            onClick={() => navigate("/feed")}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            <ArrowLeft size={18} />
                            Back to Feed
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Can view the post
    if (postData?.canView && postData?.post) {
        return (
            <div className="min-h-screen bg-gray-50 py-8 px-4">
                <div className="max-w-xl mx-auto">
                    {/* Back button */}
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span>Back</span>
                    </button>

                    {/* Post */}
                    <Post post={postData.post} />
                </div>
            </div>
        );
    }

    return null;
};

export default SharedPost;
