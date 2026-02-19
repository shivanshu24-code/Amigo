import React, { useState, useEffect } from "react";
import Story from "../Components/Story.jsx";
import UploadProgress from "../Components/UploadProgress.jsx";
import Post from "../Components/Post.jsx";
import CreatePostModal from "../Components/Post/CreatePostModal.jsx";
import RightPanel from "../Components/RightPanel.jsx";
import { usePostStore } from "../Store/PostStore.js";
import { Sparkles } from "lucide-react";

const Feed = () => {
    const [openCreatePost, setOpenCreatePost] = useState(false);
    const { posts, loading, fetchPosts } = usePostStore();

    useEffect(() => {
        fetchPosts();
    }, []);

    return (
        <div className="flex w-full h-full overflow-hidden bg-white dark:bg-black">
            {/* Main Feed Content */}
            <div className="flex-1 overflow-auto pb-20 md:pb-0">
                <div className="max-w-2xl mx-auto py-4  md:px-0">
                    {/* STORIES */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-50">
                            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-purple-500" />
                                Stories
                            </h3>
                        </div>
                        <div className="px-3 py-3">
                            <Story />
                        </div>
                    </div>

                    {/* UPLOAD PROGRESS */}
                    <div className="mb-6">
                        <UploadProgress />
                    </div>

                    {/* POSTS */}
                    <div className="flex flex-col gap-5">
                        {loading && (
                            <div className="flex flex-col gap-5">
                                {[1, 2].map((n) => (
                                    <div key={n} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
                                        {/* Header */}
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                                <div className="h-3 bg-gray-100 rounded w-1/6"></div>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="w-full h-64 bg-gray-100 rounded-xl mb-4"></div>

                                        {/* Footer Actions */}
                                        <div className="flex items-center justify-between px-2">
                                            <div className="flex gap-4">
                                                <div className="w-8 h-8 bg-gray-100 rounded-full"></div>
                                                <div className="w-8 h-8 bg-gray-100 rounded-full"></div>
                                                <div className="w-8 h-8 bg-gray-100 rounded-full"></div>
                                            </div>
                                            <div className="w-8 h-8 bg-gray-100 rounded-full"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!loading && posts.length === 0 && (
                            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Sparkles className="w-8 h-8 text-gray-300" />
                                </div>
                                <p className="text-gray-600 font-medium">No posts yet</p>
                                <p className="text-sm text-gray-400 mt-1">Be the first to share something!</p>
                            </div>
                        )}

                        {!loading && posts.length > 0 && posts.map((post) => (
                            <Post key={post._id} post={post} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel - Events & News */}
            <RightPanel />

            {/* Create Post Modal */}
            {openCreatePost && (
                <CreatePostModal onClose={() => setOpenCreatePost(false)} />
            )}
        </div>
    );
};

export default Feed;
