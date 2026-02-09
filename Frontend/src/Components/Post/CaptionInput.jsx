import React, { useState } from 'react';
import { usePostStore } from '../../Store/PostStore.js';
import { useAuthStore } from '../../Store/AuthStore.js';
import { Send } from 'lucide-react';

const CaptionInput = ({ postId, onCommentAdded, parentComment = null }) => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const { addComment } = usePostStore();

  const submit = async () => {
    if (!text.trim()) return;

    setLoading(true);
    const result = await addComment(postId, text, parentComment);
    setLoading(false);

    if (result.success) {
      onCommentAdded?.(result.data);
      setText("");
    } else {
      console.error(result.message || "Failed to add comment");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex items-center gap-3 py-3 border-t border-gray-50 bg-white sticky bottom-0">
      {/* Current User Avatar */}
      <div className="shrink-0">
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={user.username}
            className="w-8 h-8 rounded-full object-cover border border-gray-200"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
            {user?.username?.[0]?.toUpperCase() || "A"}
          </div>
        )}
      </div>

      {/* Input Field */}
      <div className="flex-1 relative">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={parentComment ? "Write a reply..." : "Add a comment..."}
          className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500/30 transition-all placeholder:text-gray-400"
          disabled={loading}
        />
      </div>

      {/* Submit Button */}
      <button
        onClick={submit}
        disabled={loading || !text.trim()}
        className={`shrink-0 p-2 rounded-xl transition-all ${!text.trim() || loading
            ? "text-gray-300 cursor-not-allowed"
            : "text-indigo-600 hover:bg-indigo-50"
          }`}
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
        ) : (
          <Send size={20} className={text.trim() ? "fill-indigo-600/10" : ""} />
        )}
      </button>
    </div>
  );
};

export default CaptionInput;
