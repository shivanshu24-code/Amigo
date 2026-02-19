import { useState, useEffect } from "react";
import { X, Link2, Send, Check, Search, Loader2 } from "lucide-react";
import { useFriendStore } from "../../Store/FriendStore.js";
import api from "../../Services/Api.js";

const ShareModal = ({ postId, storyId, profileId, onClose }) => {
  const { friends, fetchFriends } = useFriendStore();
  const [view, setView] = useState("main"); // "main" | "friends"
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(null); // friendId being shared to
  const [sharedTo, setSharedTo] = useState([]); // Array of friendIds already shared
  const isProfileShare = Boolean(profileId);

  useEffect(() => {
    if (friends.length === 0) {
      fetchFriends();
    }
  }, [friends, fetchFriends]);

  // Generate shareable link
  // If storyId is present, we might just copy a link to the app home for now as deep linking to stories is tricky without a dedicated route
  const shareableLink = isProfileShare
    ? `${window.location.origin}/profile/${profileId}`
    : storyId
      ? `${window.location.origin}`
      : `${window.location.origin}/post/${postId}`;

  // Copy link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Share post/story to friend via message
  const handleShareToFriend = async (friendId) => {
    if (sharedTo.includes(friendId)) return;

    try {
      setSharing(friendId);
      if (isProfileShare) {
        await api.post(`/chat/share-profile/${profileId}/${friendId}`);
      } else {
        const url = storyId
          ? `/chat/share-story/${storyId}/${friendId}`
          : `/chat/share/${postId}/${friendId}`;
        await api.post(url);
      }
      setSharedTo(prev => [...prev, friendId]);
    } catch (err) {
      console.error("Failed to share:", err);
    } finally {
      setSharing(null);
    }
  };

  // Filter friends based on search
  const filteredFriends = friends.filter(friend =>
    friend.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.firstname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.lastname?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100]"
      onClick={onClose}
    >
      <div
        className="bg-white w-[360px] max-h-[80vh] rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="font-semibold text-lg">
            {view === "main"
              ? (isProfileShare ? "Share profile" : (storyId ? "Share story" : "Share post"))
              : "Send to friend"}
          </h3>
          <button
            onClick={view === "friends" ? () => setView("main") : onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {view === "main" ? (
          // Main view with options
          <div className="p-3">
            <button
              onClick={() => setView("friends")}
              className="flex items-center gap-3 w-full p-3 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <Send size={18} className="text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Send in message</p>
                <p className="text-sm text-gray-500">Share with your friends</p>
              </div>
            </button>

            {!storyId && (
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-3 w-full p-3 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${copied
                  ? "bg-green-500"
                  : "bg-gradient-to-br from-gray-600 to-gray-800"
                  }`}>
                  {copied ? (
                    <Check size={18} className="text-white" />
                  ) : (
                    <Link2 size={18} className="text-white" />
                  )}
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">
                    {copied ? "Link copied!" : "Copy link"}
                  </p>
                  <p className="text-sm text-gray-500 truncate max-w-[220px]">
                    {shareableLink}
                  </p>
                </div>
              </button>
            )}
          </div>
        ) : (
          // Friends list view
          <div className="flex flex-col max-h-[60vh]">
            {/* Search */}
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search friends..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Friends list */}
            <div className="overflow-y-auto flex-1 p-2">
              {filteredFriends.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {friends.length === 0
                    ? "You don't have any friends yet"
                    : "No friends match your search"
                  }
                </div>
              ) : (
                filteredFriends.map((friend) => {
                  const isShared = sharedTo.includes(friend._id);
                  const isSharing = sharing === friend._id;

                  return (
                    <div
                      key={friend._id}
                      className="flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {friend.avatar ? (
                          <img
                            src={friend.avatar}
                            alt={friend.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-medium">
                            {friend.username?.[0]?.toUpperCase() || "?"}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {friend.firstname && friend.lastname
                              ? `${friend.firstname} ${friend.lastname}`
                              : friend.username
                            }
                          </p>
                          <p className="text-xs text-gray-500">@{friend.username}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleShareToFriend(friend._id)}
                        disabled={isShared || isSharing}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${isShared
                          ? "bg-green-100 text-green-700"
                          : isSharing
                            ? "bg-gray-100 text-gray-400"
                            : "bg-indigo-500 text-white hover:bg-indigo-600"
                          }`}
                      >
                        {isSharing ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : isShared ? (
                          <span className="flex items-center gap-1">
                            <Check size={14} /> Sent
                          </span>
                        ) : (
                          "Send"
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareModal;
