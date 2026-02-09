import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MediaUploader from "../Components/Post/MediaUploader.jsx";
import PostActions from "../Components/Post/PostActions.jsx";
import PostSubmitButton from "../Components/Post/PostSubmit.jsx";
import { useAuthStore } from "../Store/AuthStore.js";

const CreatePost = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [media, setMedia] = useState(null);
    const [caption, setCaption] = useState("");
    const [visibility, setVisibility] = useState("Connection");
    const [locations, setLocation] = useState("");
    const [aspectRatio, setAspectRatio] = useState("1:1");

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur-xl z-30 shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-all active:scale-95"
                    >
                        <ArrowLeft size={22} strokeWidth={2.5} />
                    </button>
                    <h1 className="text-lg font-bold text-gray-800 tracking-tight">
                        New Post
                    </h1>
                </div>
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                <div className="p-5 pb-28 space-y-5">

                    {/* 👤 User Profile Section */}
                    <div className="flex items-center gap-3 mb-2 animate-in fade-in slide-in-from-top-4 duration-500">
                        <img
                            src={user?.avatar || "/avatar-placeholder.png"}
                            alt={user?.username || "User"}
                            className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm"
                        />
                        <div>
                            <p className="font-semibold text-gray-900 text-sm">{user?.username || "User"}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                <p className="text-xs text-gray-500 font-medium">{visibility} view</p>
                            </div>
                        </div>
                    </div>

                    {/* 📝 Caption Input */}
                    <div className="relative animate-in fade-in slide-in-from-top-6 duration-500 delay-100">
                        <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="What's on your mind? Share with your network..."
                            className="w-full min-h-[120px] text-lg leading-relaxed text-gray-800 placeholder:text-gray-400 border-none outline-none resize-none bg-transparent"
                            autoFocus
                        />
                    </div>

                    {/* 🖼 Media Uploader */}
                    <div className="animate-in fade-in slide-in-from-top-8 duration-500 delay-200">
                        <MediaUploader
                            media={media}
                            setMedia={setMedia}
                            setAspectRatio={setAspectRatio}
                        />
                    </div>

                    {/* ⚙️ Actions Card */}
                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-4 border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Enhance Post</p>
                        </div>
                        <PostActions
                            visibility={visibility}
                            setVisibility={setVisibility}
                            location={locations}
                            setLocation={setLocation}
                            onEmojiSelect={(emoji) => setCaption((prev) => prev + emoji)}
                        />
                    </div>
                </div>
            </div>

            {/* 🚀 Footer (Submit Button) */}
            <div className="p-4 bg-white/95 backdrop-blur-md border-t border-gray-100 sticky bottom-0 z-30 safe-area-bottom shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
                <PostSubmitButton
                    caption={caption}
                    media={media}
                    visibility={visibility}
                    aspectRatio={aspectRatio}
                    onClose={() => navigate('/feed')}
                />
            </div>
        </div>
    );
};

export default CreatePost;