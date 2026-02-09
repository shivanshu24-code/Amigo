import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import { useState } from "react";
import ShareModal from "./ShareModal.jsx";
import LikeButton from "../Button/LikeButton.jsx";

const PostEngagement = ({
    postId,
    liked,
    likesCount,
    onLike,
    commentsCount,
    onCommentClick,
    saved,
    onSave
}) => {
    const [showShare, setShowShare] = useState(false);

    return (
        <>
            <div className="flex items-center justify-between">
                {/* Left Actions */}
                <div className="flex items-center gap-1">
                    {/* ❤️ Like */}
                    <LikeButton
                        liked={liked}
                        likesCount={likesCount}
                        onToggle={onLike}
                    />

                    {/* 💬 Comments */}
                    <button
                        onClick={onCommentClick}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition"
                    >
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">{commentsCount}</span>
                    </button>

                    {/* 🔁 Share */}
                    <button
                        onClick={() => setShowShare(true)}
                        className="p-2 rounded-full hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition"
                    >
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>

                {/* Right - Bookmark */}
                <button
                    onClick={onSave}
                    className={`p-2 rounded-full hover:bg-gray-50 transition ${saved ? "text-purple-600" : "text-gray-600 hover:text-gray-900"
                        }`}
                >
                    <Bookmark className={`w-5 h-5 ${saved ? "fill-current" : ""}`} />
                </button>
            </div>

            {showShare && (
                <ShareModal postId={postId} onClose={() => setShowShare(false)} />
            )}
        </>
    );
};

export default PostEngagement;

