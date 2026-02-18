import { X, ChevronLeft, ChevronRight, MoreVertical, Eye, Share2, Trash2, Settings, AtSign, Send } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import PauseLayout from "../../Layout/PauseLayout";
import { useStoryStore } from "../../Store/StoryStore";
import { useAuthStore } from "../../Store/AuthStore";
import api from "../../Services/Api";
import ShareModal from "../Post/ShareModal";

const STORY_DURATION = 10000; // 10s per story

const StoryViewer = ({ stories, startIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const [Paused, setPaused] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const menuRef = useRef(null);

  const story = stories[currentIndex];
  const { user } = useAuthStore();
  const { recordView, fetchViewers, deleteStory, currentViewers, viewersLoading, closeViewersModal } = useStoryStore();

  const isAuthor = user?._id === story?.author?._id;

  // Check if story author is a friend
  useEffect(() => {
    const checkFriendship = async () => {
      if (isAuthor || !story?.author?._id) {
        setIsFriend(false);
        return;
      }
      try {
        const res = await api.get("/friends");
        // API returns friends in res.data.data
        const friends = res.data.data || res.data.friends || [];
        // Convert both IDs to strings for comparison
        const authorId = story.author._id.toString();
        const authorIsFriend = friends.some(f => f._id.toString() === authorId);
        setIsFriend(authorIsFriend);
      } catch (err) {
        console.error("Friendship check error:", err);
        setIsFriend(false);
      }
    };
    checkFriendship();
  }, [story?.author?._id, isAuthor]);


  // Record view when story changes
  useEffect(() => {
    if (story?._id && !isAuthor) {
      recordView(story._id);
    }
  }, [story?._id, isAuthor, recordView]);


  const goNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const togglePause = () => {
    setPaused((p) => !p);
  };

  const handleDelete = async () => {
    if (story?._id) {
      await deleteStory(story._id);
      onClose();
    }
  };

  const handleShowViewers = async () => {
    if (story?._id) {
      await fetchViewers(story._id);
      setShowViewers(true);
      setShowMenu(false);
    }
  };

  // Send reply to story author via chat
  const handleReply = async () => {
    if (!replyText.trim() || !story?.author?._id || sending) return;

    setSending(true);
    try {
      // Send message to story author with reply metadata
      await api.post(`/chat/send/${story.author._id}`, {
        text: replyText.trim(),
        isStoryReply: true,
        sharedStory: story._id
      });
      setReplyText("");
    } catch (err) {
      console.error("Failed to send reply:", err);
    } finally {
      setSending(false);
    }
  };

  // Handle Enter key for reply
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleReply();
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Progress logic
  useEffect(() => {
    if (Paused || showViewers) return;

    setProgress(0);
    const start = Date.now();

    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const percent = (elapsed / STORY_DURATION) * 100;

      if (percent >= 100) {
        clearInterval(timer);
        goNext();
      } else {
        setProgress(percent);
      }
    }, 50);

    return () => clearInterval(timer);
  }, [currentIndex, Paused, showViewers]);

  if (!story) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">

      {/* ❌ Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white z-50 hover:bg-white/10 p-2 rounded-full transition-colors"
      >
        <X size={28} />
      </button>

      {/* ⬅ Prev */}
      <button
        onClick={goPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white z-[60] hover:bg-white/10 p-2 rounded-full transition-colors"
      >
        <ChevronLeft size={36} />
      </button>

      {/* ➡ Next */}
      <button
        onClick={goNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white z-[60] hover:bg-white/10 p-2 rounded-full transition-colors"
      >
        <ChevronRight size={36} />
      </button>

      {/* 📱 Instagram-style story container */}
      <div
        className="relative w-[460px] h-[800px] bg-black rounded-xl overflow-hidden"
        onClick={togglePause}
      >

        {/* 🔝 Progress bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-white/30 z-50">
          <div
            className="h-full bg-white transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header - Author info + Menu */}
        <div className="absolute top-3 left-0 w-full px-3 z-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={story.author?.avatar || `https://ui-avatars.com/api/?name=${story.author?.username}`}
              alt={story.author?.username}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-white/30"
            />
            <span className="text-white text-sm font-medium">{story.author?.username}</span>
            {story.visibility === "CloseFriends" && (
              <div className="flex items-center gap-1 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                <Star size={10} className="fill-white" />
                <span>Close Friends</span>
              </div>
            )}
            <span className="text-white/60 text-xs">
              {new Date(story.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* 3-dot menu (author only) */}
          {isAuthor && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                className="text-white hover:bg-white/10 p-2 rounded-full transition-colors"
              >
                <MoreVertical size={20} />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 top-10 bg-white rounded-lg shadow-xl py-1 min-w-[160px] z-[70]">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleShowViewers(); }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                  >
                    <Eye size={16} />
                    View Activity
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowShareModal(true); setShowMenu(false); }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                  >
                    <Share2 size={16} />
                    Share Story
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                  >
                    <Trash2 size={16} />
                    Delete Story
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pause indicator */}
        {Paused && <PauseLayout />}

        {/* 🖼 Story Media */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          {/* Blurred Background */}
          <img
            src={story.media}
            alt="story blur"
            className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-70 scale-110"
          />
          {/* Main Content */}
          <img
            src={story.media}
            alt="story"
            className="relative w-full h-full object-contain z-10"
          />
        </div>

        {/* 📍 Mentions overlay */}
        {story.mentions && story.mentions.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {story.mentions.map((mention) => (
              <span
                key={mention._id || mention.user?._id}
                style={{
                  position: 'absolute',
                  left: `${mention.x || 50}%`,
                  top: `${mention.y || 70}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="bg-black/40 backdrop-blur-md text-white text-[11px] px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10 shadow-lg pointer-events-auto"
              >
                <AtSign size={10} className="text-white/80" />
                <span className="font-medium">{mention.username || mention.user?.username}</span>
              </span>
            ))}
          </div>
        )}

        {/* 👁 Viewers count (author only) - Moved to bottom left */}
        {isAuthor && (
          <button
            onClick={(e) => { e.stopPropagation(); handleShowViewers(); }}
            className="absolute bottom-6 left-4 bg-black/40 backdrop-blur-md text-white text-[11px] px-3 py-1.5 rounded-full flex items-center gap-2 z-50 hover:bg-black/60 transition-all border border-white/10 shadow-lg"
          >
            <Eye size={14} className="text-white/80" />
            <span className="font-semibold">{story.viewersCount || 0} views</span>
          </button>
        )}

        {/* 💬 Reply Bar - Only for friends */}
        {!isAuthor && isFriend && (
          <div className="absolute bottom-3 left-0 w-full px-3 z-50">
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full px-3 py-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Reply to ${story.author?.username}...`}
                className="flex-1 bg-transparent text-white placeholder-gray-300 outline-none text-sm"
                onClick={(e) => e.stopPropagation()}
                disabled={sending}
              />
              <button
                onClick={(e) => { e.stopPropagation(); handleReply(); }}
                disabled={!replyText.trim() || sending}
                className={`text-sm font-semibold transition-colors ${replyText.trim() && !sending
                  ? 'text-blue-400 hover:text-blue-300'
                  : 'text-gray-500 cursor-not-allowed'
                  }`}
              >
                {sending ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Message for non-friends */}
        {!isAuthor && !isFriend && (
          <div className="absolute bottom-3 left-0 w-full px-3 z-50">
            <div className="bg-black/40 backdrop-blur-sm text-white/60 text-xs text-center py-2 rounded-full">
              Add as friend to reply
            </div>
          </div>
        )}
      </div>


      {/* 👥 Viewers Modal */}
      {showViewers && (
        <div
          className="absolute inset-0 bg-black/50 z-[80] flex items-center justify-center"
          onClick={() => setShowViewers(false)}
        >
          <div
            className="bg-white rounded-xl w-80 max-h-96 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Story Views</h3>
              <button
                onClick={() => setShowViewers(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {viewersLoading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : currentViewers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No views yet</div>
              ) : (
                currentViewers.map((viewer) => (
                  <div key={viewer.user?._id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                    <img
                      src={viewer.user?.avatar || `https://ui-avatars.com/api/?name=${viewer.user?.username}`}
                      alt={viewer.user?.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{viewer.user?.username}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(viewer.viewedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 📤 Share Modal */}
      {showShareModal && (
        <ShareModal
          storyId={story._id}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
};

export default StoryViewer;

