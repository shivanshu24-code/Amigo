import React, { useState, useEffect } from "react";
import { ArrowLeft, Archive, Grid, Layout, Image as ImageIcon, Clock, RotateCcw, Share2, X, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../Services/Api";
import { usePostStore } from "../Store/PostStore";
import { useStoryStore } from "../Store/StoryStore";
import StoryViewer from "../Components/Story/StoryViewer";

const ArchivePage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("posts");
    const [posts, setPosts] = useState([]);
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [deletingItem, setDeletingItem] = useState(false);

    // Viewing state
    const [selectedPost, setSelectedPost] = useState(null);
    const [selectedStoryIndex, setSelectedStoryIndex] = useState(null);

    const { openCreatePostModal } = usePostStore();
    const { deleteStory } = useStoryStore();

    useEffect(() => {
        fetchArchive();
    }, [activeTab]);

    const fetchArchive = async () => {
        setLoading(true);
        try {
            if (activeTab === "posts") {
                const res = await api.get("/post/archived");
                setPosts(res.data);
            } else {
                const res = await api.get("/story/archived");
                setStories(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch archive:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnarchive = async (id, type) => {
        try {
            if (type === "post") {
                await api.put(`/post/${id}/unarchive`);
                setPosts(posts.filter(p => p._id !== id));
                setSelectedPost(null);
            } else {
                await api.put(`/story/unarchive/${id}`);
                setStories(stories.filter(s => s._id !== id));
                setSelectedStoryIndex(null);
            }
        } catch (error) {
            console.error("Failed to unarchive:", error);
        }
    };

    const handleDelete = async (id, type) => {
        setPendingDelete({ id, type });
    };

    const handleConfirmDelete = async () => {
        if (!pendingDelete?.id || !pendingDelete?.type || deletingItem) return;
        const { id, type } = pendingDelete;
        setDeletingItem(true);
        try {
            if (type === "post") {
                await api.delete(`/post/${id}`);
                setPosts(posts.filter(p => p._id !== id));
                setSelectedPost(null);
            } else {
                await api.delete(`/story/story/${id}`);
                setStories(stories.filter(s => s._id !== id));
                setSelectedStoryIndex(null);
            }
        } catch (error) {
            console.error("Failed to delete:", error);
        } finally {
            setDeletingItem(false);
            setPendingDelete(null);
        }
    };

    const { openCreateStoryModal } = useStoryStore();

    const handleReshare = (item) => {
        // Close viewers first
        setSelectedPost(null);
        setSelectedStoryIndex(null);

        // Check if item is a story (stories have createdAt and media, posts usually have author/caption)
        // A better check: items from stories array vs items from posts array
        const isStory = stories.some(s => s._id === item._id);

        if (isStory) {
            openCreateStoryModal({
                media: item.media,
                caption: item.caption,
                isArchived: false // Default to false for resharing
            });
        } else {
            // Open create post modal with pre-filled data
            openCreatePostModal({
                media: item.media,
                caption: item.caption,
                aspectRatio: item.aspectRatio || "1:1",
                visibility: item.visibility || "Connection"
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-30 px-4 py-4 flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <div className="flex items-center gap-2">
                    <Archive size={20} className="text-violet-600" />
                    <h1 className="text-lg font-bold text-gray-900">Archive</h1>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-100 px-4 flex gap-8">
                <button
                    onClick={() => setActiveTab("posts")}
                    className={`py-4 text-sm font-semibold transition-all relative ${activeTab === "posts" ? "text-violet-600" : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Grid size={16} />
                        <span>Posts</span>
                    </div>
                    {activeTab === "posts" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("stories")}
                    className={`py-4 text-sm font-semibold transition-all relative ${activeTab === "stories" ? "text-violet-600" : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Layout size={16} />
                        <span>Stories</span>
                    </div>
                    {activeTab === "stories" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-full" />
                    )}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 max-w-2xl mx-auto w-full">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-10 h-10 border-4 border-violet-100 border-t-violet-600 rounded-full animate-spin" />
                        <p className="text-gray-500 text-sm animate-pulse">Fetching your archive...</p>
                    </div>
                ) : (
                    <>
                        {activeTab === "posts" ? (
                            posts.length === 0 ? (
                                <EmptyState icon={ImageIcon} title="No Archived Posts" description="Posts you archive will appear here" />
                            ) : (
                                <div className="grid grid-cols-3 gap-1 md:gap-4">
                                    {posts.map(post => (
                                        <div
                                            key={post._id}
                                            onClick={() => setSelectedPost(post)}
                                            className="aspect-square bg-gray-200 rounded-lg overflow-hidden group relative cursor-pointer"
                                        >
                                            <img
                                                src={post.media}
                                                alt={post.caption}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Archive size={20} className="text-white" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : (
                            stories.length === 0 ? (
                                <EmptyState icon={Clock} title="No Archived Stories" description="Stories you archive will appear here" />
                            ) : (
                                <div className="grid grid-cols-3 gap-2 md:gap-4">
                                    {stories.map((story, index) => (
                                        <div
                                            key={story._id}
                                            onClick={() => setSelectedStoryIndex(index)}
                                            className="aspect-[9/16] bg-gray-200 rounded-xl overflow-hidden group relative border border-gray-100 shadow-sm cursor-pointer"
                                        >
                                            <img
                                                src={story.media}
                                                alt="Archived story"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute bottom-2 left-2 right-2 bg-black/40 backdrop-blur-sm rounded-lg p-1.5 text-[10px] text-white text-center">
                                                {new Date(story.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </>
                )}
            </div>

            {/* Post Viewer Modal (Redesigned - Subtle UI) */}
            {selectedPost && (
                <div className="fixed inset-0 bg-black/98 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    {/* Close Area */}
                    <div className="absolute inset-0" onClick={() => setSelectedPost(null)} />

                    <button
                        onClick={() => setSelectedPost(null)}
                        className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-[110]"
                    >
                        <X size={28} />
                    </button>

                    <div className="relative max-w-lg w-full bg-transparent overflow-hidden z-[105] flex flex-col gap-4">
                        {/* Media Container */}
                        <div className="relative rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10 group">
                            <img
                                src={selectedPost.media}
                                className="w-full h-auto max-h-[70vh] object-contain"
                                alt="archived"
                            />

                            {/* Info Overlay (Subtle) */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-12">
                                <div className="flex items-center gap-3 mb-3">
                                    <img src={selectedPost.author?.avatar} className="w-8 h-8 rounded-full border border-white/20" />
                                    <span className="text-white text-sm font-semibold">{selectedPost.author?.username}</span>
                                    <span className="text-white/40 text-[10px]">•</span>
                                    <span className="text-white/60 text-xs">{new Date(selectedPost.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-white/90 text-sm leading-relaxed">{selectedPost.caption || "No caption"}</p>
                            </div>
                        </div>

                        {/* Actions (Subtle Buttons) */}
                        <div className="flex gap-3 px-2">
                            <button
                                onClick={() => handleDelete(selectedPost._id, "post")}
                                className="flex items-center justify-center gap-2 py-3.5 px-4 bg-red-500/10 backdrop-blur-xl text-red-500 rounded-2xl font-bold border border-red-500/20 hover:bg-red-500/20 transition-all active:scale-[0.98]"
                                title="Delete Permanently"
                            >
                                <Trash2 size={18} />
                            </button>
                            <button
                                onClick={() => handleUnarchive(selectedPost._id, "post")}
                                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 bg-white/10 backdrop-blur-xl text-white rounded-2xl font-bold border border-white/10 hover:bg-white/20 transition-all active:scale-[0.98]"
                            >
                                <RotateCcw size={18} />
                                <span className="text-sm">Unarchive</span>
                            </button>
                            <button
                                onClick={() => {
                                    handleReshare(selectedPost);
                                    setSelectedPost(null);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 bg-violet-600 text-white rounded-2xl font-bold shadow-lg shadow-violet-900/40 hover:bg-violet-500 transition-all active:scale-[0.98]"
                            >
                                <Share2 size={18} />
                                <span className="text-sm">Edit & Share</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Story Viewer Modal Integration */}
            {selectedStoryIndex !== null && (
                <div className="fixed inset-0 z-[100]">
                    <StoryViewer
                        stories={stories}
                        startIndex={selectedStoryIndex}
                        onClose={() => setSelectedStoryIndex(null)}
                    />
                    {/* Refined Action Overlay for Stories (Bottom Right to avoid views overlap) */}
                    <div className="fixed bottom-6 right-4 z-[101] flex gap-2">
                        <button
                            onClick={() => handleDelete(stories[selectedStoryIndex]._id, "story")}
                            className="w-10 h-10 flex items-center justify-center bg-red-500/10 backdrop-blur-xl border border-red-500/20 text-red-500 rounded-full hover:bg-red-500/20 transition-all active:scale-95"
                            title="Delete Permanently"
                        >
                            <Trash2 size={18} />
                        </button>
                        <button
                            onClick={() => handleUnarchive(stories[selectedStoryIndex]._id, "story")}
                            className="bg-white/10 backdrop-blur-xl border border-white/10 text-white px-4 py-2 rounded-full font-bold hover:bg-white/20 transition-all active:scale-95 text-xs flex items-center gap-2"
                        >
                            <RotateCcw size={14} />
                            Unarchive
                        </button>
                        <button
                            onClick={() => handleReshare(stories[selectedStoryIndex])}
                            className="bg-violet-600 text-white px-4 py-2 rounded-full font-bold shadow-lg shadow-violet-900/40 hover:bg-violet-500 transition-all active:scale-95 text-xs flex items-center gap-2"
                        >
                            <Share2 size={14} />
                            Edit & Share
                        </button>
                    </div>
                </div>
            )}

            {pendingDelete && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => !deletingItem && setPendingDelete(null)}
                    />
                    <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 p-5">
                        <h3 className="text-base font-semibold text-gray-900">
                            Delete {pendingDelete.type}?
                        </h3>
                        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                            Do you really want to permanently delete this {pendingDelete.type}?
                        </p>
                        <div className="mt-4 flex items-center justify-end gap-2">
                            <button
                                onClick={() => setPendingDelete(null)}
                                disabled={deletingItem}
                                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={deletingItem}
                                className="px-3 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                            >
                                {deletingItem ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const EmptyState = ({ icon: Icon, title, description }) => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
            <Icon size={32} className="text-gray-300" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
    </div>
);

export default ArchivePage;
