import { useState } from "react";
import { Pin, Heart, MoreHorizontal, Reply } from "lucide-react";
import { timeAgo } from "../../Utils/Comment.js";
import CaptionInput from "./CaptionInput.jsx";
import { usePostStore } from "../../Store/PostStore.js";
import { useAuthStore } from "../../Store/AuthStore.js";

const CommentItem = ({
  comment,
  postId,
  postAuthorId,
  isOwner,
  onPin,
  depth = 0
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replying, setReplying] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(false); // UI only for now, can sync with store later
  const { reactToComment, deleteComment } = usePostStore();
  const userId = useAuthStore((s) => s.user?._id);

  const replyCount = comment.replies?.length || 0;

  // Authorization: Comment author OR Post author
  const canDelete = isOwner || userId === postAuthorId;

  const handleLike = async () => {
    setIsLiked(!isLiked);
    // Assuming '❤️' as default reaction
    await reactToComment(postId, comment._id, "❤️");
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      await deleteComment(postId, comment._id);
    }
  };

  return (
    <div className="group animate-in fade-in slide-in-from-left-2 duration-300">
      <div
        className={`flex gap-3 py-2 px-1 rounded-2xl transition-all ${comment.pinned ? "bg-amber-50/50" : "hover:bg-gray-50/50"
          }`}
        style={{ marginLeft: depth > 0 ? depth * 20 : 0 }}
      >
        {/* Avatar */}
        <div className="shrink-0 pt-1">
          {comment.author?.avatar ? (
            <img
              src={comment.author.avatar}
              alt={comment.author.username}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-100 shadow-sm"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
              {comment.author?.username?.[0]?.toUpperCase() || "A"}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-gray-900">
                  {comment.author?.username}
                </span>
                <span className="text-[10px] text-gray-400 font-medium">
                  {timeAgo(comment.createdAt)}
                </span>
                {comment.pinned && (
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-md text-[9px] font-bold uppercase tracking-wider">
                    <Pin size={8} className="fill-amber-700" />
                    Pinned
                  </div>
                )}
              </div>
              <p className="text-[13px] text-gray-700 mt-0.5 leading-relaxed break-words">
                {comment.text}
              </p>
            </div>

            {/* Like Button */}
            <button
              onClick={handleLike}
              className={`shrink-0 p-1.5 rounded-full transition-all ${isLiked ? "text-rose-500" : "text-gray-300 hover:text-gray-400 hover:bg-gray-100"
                }`}
            >
              <Heart size={14} className={isLiked ? "fill-rose-500" : ""} />
            </button>
          </div>

          {/* Action Footer */}
          <div className="flex items-center gap-4 mt-1.5">
            <button
              onClick={() => setReplying(!replying)}
              className="text-[11px] font-bold text-gray-400 hover:text-indigo-600 transition-colors flex items-center gap-1"
            >
              <Reply size={12} />
              Reply
            </button>

            {userId === postAuthorId && (
              <button
                onClick={() => onPin(comment._id)}
                className={`text-[11px] font-bold transition-colors flex items-center gap-1 ${comment.pinned ? "text-amber-600" : "text-gray-400 hover:text-amber-600"
                  }`}
              >
                <Pin size={12} />
                {comment.pinned ? "Unpin" : "Pin"}
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity hover:text-gray-600"
              >
                <MoreHorizontal size={14} />
              </button>

              {showMenu && (
                <div className="absolute bottom-0 left-0 mt-1 w-24 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10 animate-in fade-in zoom-in-95 duration-100">
                  {canDelete && (
                    <button
                      onClick={handleDelete}
                      className="w-full text-left px-3 py-1.5 text-[11px] text-rose-600 hover:bg-rose-50 transition-colors font-medium"
                    >
                      Delete
                    </button>
                  )}
                  <button
                    onClick={() => setShowMenu(false)}
                    className="w-full text-left px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reply Input */}
      {replying && (
        <div className="mt-2" style={{ marginLeft: (depth + 1) * 20 }}>
          <CaptionInput
            postId={postId}
            parentComment={comment._id}
            onCommentAdded={() => {
              setReplying(false);
              setShowReplies(true);
            }}
          />
        </div>
      )}

      {/* Replies Toggle */}
      {replyCount > 0 && (
        <div className="mt-1" style={{ marginLeft: (depth + 1) * 20 }}>
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center gap-2 text-[11px] font-bold text-gray-400 hover:text-gray-600 py-1 transition-colors"
          >
            <div className="w-6 h-[1px] bg-gray-200" />
            {showReplies ? "Hide replies" : `View ${replyCount} ${replyCount === 1 ? "reply" : "replies"}`}
          </button>
        </div>
      )}

      {/* Replies Container */}
      {showReplies && replyCount > 0 && (
        <div className="mt-1 border-l-2 border-gray-50 ml-5 pl-1">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              postId={postId}
              postAuthorId={postAuthorId}
              onPin={onPin}
              isOwner={reply.author?._id === userId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
