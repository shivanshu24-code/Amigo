import { useState } from "react";
import PostEngagement from "./Post/PostEngagement.jsx";
import CommentSection from "./Post/CommentSection.jsx";
import PostHeader from "./Post/PostHeader.jsx";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import PostMedia from "./Post/PostMedia.jsx";
import api from "../Services/Api.js";
import { useAuthStore } from "../Store/AuthStore.js";
dayjs.extend(relativeTime);

const aspectClassMap = {
  "1:1": "aspect-square",
  "4:5": "aspect-[4/5]",
  "9:16": "aspect-[9/16]"
};

const Post = ({ post }) => {
  const [postState, setPostState] = useState({
    ...post,
    comments: Array.isArray(post.comments) ? post.comments : []
  });

  const [showComments, setShowComments] = useState(false);
  const [lastTap, setLastTap] = useState(0);

  if (!postState) return null;

  const userId = useAuthStore((s) => s.user?._id);

  const author = postState.author || {};

  const handleLike = async () => {
    const originalLikes = postState.likes;

    setPostState((prev) => ({
      ...prev,
      likes: prev.likes.includes(userId)
        ? prev.likes.filter((id) => id !== userId)
        : [...prev.likes, userId],
    }));

    try {
      await api.post(`/post/${postState._id}/like`);
    } catch (err) {
      console.error("LIKE FAILED:", err);
      setPostState((prev) => ({ ...prev, likes: originalLikes }));
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap < 300) handleLike();
    setLastTap(now);
  };

  const handleCommentAdded = (newComment) => {
    setPostState((prev) => ({
      ...prev,
      comments: [...prev.comments, newComment]
    }));
    setShowComments(true)
  };


  return (
    <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
      {/* Header */}
      <PostHeader
        author={author}
        time={dayjs(postState.createdAt).fromNow()}
      />

      {/* Caption */}
      {postState.caption && (
        <p className="px-4 pb-3 text-gray-800 leading-relaxed">{postState.caption}</p>
      )}

      {/* Media */}
      {post.media && (
        <div className="border-t border-b border-gray-50">
          <PostMedia
            media={post.media}
            aspectRatio={post.aspectRatio}
            onLike={handleLike}
          />
        </div>
      )}

      {/* Engagement */}
      <div className="px-4 py-3">
        <PostEngagement
          postId={postState._id}
          liked={postState.likes.includes(userId)}
          likesCount={postState.likes.length}
          commentsCount={postState.comments.length}
          onLike={handleLike}
          onCommentClick={() => setShowComments(p => !p)}
          saved={useAuthStore(s => s.user?.savedPosts?.includes(postState._id))}
          onSave={async () => {
            const { usePostStore } = await import("../Store/PostStore.js");
            const result = await usePostStore.getState().savePost(postState._id);
            if (result.success) {
              // Update AuthStore
              useAuthStore.setState(state => {
                const currentSaved = state.user.savedPosts || [];
                const newSaved = result.saved
                  ? [...currentSaved, postState._id]
                  : currentSaved.filter(id => id !== postState._id);
                return { user: { ...state.user, savedPosts: newSaved } };
              });
            }
          }}
        />
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-gray-100">
          <CommentSection
            key={postState.comments.length}
            postId={post._id}
            postAuthorId={author?._id}
            comments={postState.comments}
            onCommentAdded={handleCommentAdded}
            setComments={(comments) =>
              setPostState((prev) => ({ ...prev, comments }))
            }
          />
        </div>
      )}
    </div>
  );
};

export default Post;
