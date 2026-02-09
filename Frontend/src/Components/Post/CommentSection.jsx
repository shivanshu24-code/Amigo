import { useEffect, useState } from "react";
import CommentItem from "./CommentItem.jsx";
import CaptionInput from "./CaptionInput.jsx";
import { usePostStore } from "../../Store/PostStore.js";
import { useAuthStore } from "../../Store/AuthStore.js";
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

const CommentSection = ({ postId, postAuthorId, comments, setComments }) => {
  const [show, setShow] = useState(false);
  const userId = useAuthStore((s) => s.user?._id);
  const safeComments = Array.isArray(comments) ? comments : [];

  const { fetchComments, pinComment } = usePostStore();

  useEffect(() => {
    if (show) {
      fetchComments(postId).then((result) => {
        if (result.success) {
          setComments(result.data);
        }
      });
    }
  }, [show, postId]);

  const handlePin = async (commentId) => {
    await pinComment(postId, commentId);
    const result = await fetchComments(postId);
    if (result.success) {
      setComments(result.data);
    }
  };

  return (
    <div className="mt-2 pt-2 border-t border-gray-50">
      {/* View Toggle */}
      <button
        onClick={() => setShow(!show)}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
          <span className="text-xs font-bold text-gray-500 group-hover:text-gray-700">
            {safeComments.length > 0
              ? `${show ? "Hide" : "View all"} ${safeComments.length} comments`
              : "No comments yet. Be the first!"
            }
          </span>
        </div>
        <div className="text-gray-400">
          {show ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {show && (
        <div className="px-4 pb-2 animate-in slide-in-from-top-2 duration-300">
          {/* Comments List */}
          <div className="space-y-1 mt-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
            {safeComments.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-xs text-gray-400 italic">No comments yet.</p>
              </div>
            ) : (
              [...safeComments]
                .sort((a, b) => Number(b.pinned) - Number(a.pinned))
                .map((c) => (
                  <CommentItem
                    key={c._id}
                    comment={c}
                    postId={postId}
                    postAuthorId={postAuthorId}
                    onPin={handlePin}
                    isOwner={c.author?._id === userId}
                  />
                ))
            )}
          </div>

          {/* Input Bar */}
          <div className="mt-2">
            <CaptionInput
              postId={postId}
              onCommentAdded={(newComment) =>
                setComments((prev) => [...(Array.isArray(prev) ? prev : []), newComment])
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
