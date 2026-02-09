import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheck, FaCheckDouble, FaTrash, FaEllipsisV } from "react-icons/fa";
import { Link } from "react-router-dom";
import { ExternalLink, Heart, MessageCircle } from "lucide-react";
import { useChatStore } from "../../Store/ChatStore";

const ChatBubble = ({ message, isMe, time, avatar, status, sharedPost, messageId, isDeletedForEveryone, isStoryReply, sharedStory }) => {
  const [showOptions, setShowOptions] = useState(false);
  const { deleteMessage } = useChatStore();

  const handleDeleteForMe = () => {
    deleteMessage(messageId, false);
    setShowOptions(false);
  };

  const handleDeleteForEveryone = () => {
    deleteMessage(messageId, true);
    setShowOptions(false);
  };

  // Instagram-style shared post component
  const SharedPostCard = () => (
    <Link
      to={`/post/${sharedPost._id}`}
      className="block w-64 bg-white rounded-xl overflow-hidden shadow-md border border-gray-100 hover:shadow-lg transition-shadow"
    >
      {/* Post Header - Author Info */}
      <div className="flex items-center gap-2 p-2.5 border-b border-gray-100">
        <img
          src={sharedPost.author?.avatar || `https://ui-avatars.com/api/?name=${sharedPost.author?.username}&background=random&size=32`}
          alt={sharedPost.author?.username}
          className="w-7 h-7 rounded-full object-cover ring-2 ring-gray-100"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-900 truncate">
            {sharedPost.author?.username}
          </p>
        </div>
        <ExternalLink size={14} className="text-gray-400" />
      </div>

      {/* Post Media */}
      {sharedPost.media && (
        <div className="relative aspect-square bg-gray-100">
          <img
            src={sharedPost.media}
            alt="Post"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Post Footer - Caption & Stats */}
      <div className="p-2.5">
        {/* Engagement Icons */}
        <div className="flex items-center gap-3 mb-1.5">
          <Heart size={16} className="text-gray-600" />
          <MessageCircle size={16} className="text-gray-600" />
        </div>

        {/* Caption Preview */}
        {sharedPost.caption && (
          <p className="text-xs text-gray-700 line-clamp-2">
            <span className="font-semibold">{sharedPost.author?.username}</span>{" "}
            {sharedPost.caption}
          </p>
        )}

        {/* Tap to view */}
        <p className="text-[10px] text-gray-400 mt-1.5 uppercase tracking-wide">
          Tap to view post
        </p>
      </div>
    </Link>
  );

  // Text-only post card (no media)
  const TextOnlyPostCard = () => (
    <Link
      to={`/post/${sharedPost._id}`}
      className="block w-56 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
    >
      <div className="p-4">
        {/* Author */}
        <div className="flex items-center gap-2 mb-3">
          <img
            src={sharedPost.author?.avatar || `https://ui-avatars.com/api/?name=${sharedPost.author?.username}&background=random&size=28`}
            alt={sharedPost.author?.username}
            className="w-6 h-6 rounded-full object-cover ring-2 ring-white/30"
          />
          <span className="text-xs font-medium text-white/90">
            {sharedPost.author?.username}
          </span>
        </div>

        {/* Caption */}
        <p className="text-sm text-white font-medium line-clamp-3 leading-relaxed">
          "{sharedPost.caption || "Shared a post"}"
        </p>

        {/* Tap to view */}
        <p className="text-[10px] text-white/60 mt-3 uppercase tracking-wide">
          Tap to view →
        </p>
      </div>
    </Link>
  );

  if (isDeletedForEveryone) {
    return (
      <div className={`flex w-full ${isMe ? "justify-end" : "justify-start"} mb-2`}>
        <div className={`px-4 py-2 text-xs italic text-gray-400 rounded-2xl border border-gray-100 bg-gray-50`}>
          This message was deleted
        </div>
      </div>
    );
  }

  return (
    <div className={`flex w-full ${isMe ? "justify-end" : "justify-start"} mb-2 group`}>
      {/* Avatar for received messages */}
      {!isMe && avatar && (
        <img
          src={avatar}
          className="w-8 h-8 rounded-full mr-2 self-end object-cover flex-shrink-0"
          alt=""
        />
      )}
      {!isMe && !avatar && <div className="w-8 mr-2" />}

      <div className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
        <div className="flex flex-col items-end gap-1">
          {/* Shared Post Card */}
          {sharedPost && !isDeletedForEveryone && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {sharedPost.media ? <SharedPostCard /> : <TextOnlyPostCard />}
            </motion.div>
          )}

          {/* Text message bubble */}
          {message && !isDeletedForEveryone && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.15, delay: sharedPost || isStoryReply ? 0.05 : 0 }}
              className={`max-w-xs md:max-w-md px-4 py-2.5 text-sm ${isMe
                ? "bg-indigo-600 text-white rounded-2xl rounded-br-md"
                : "bg-white text-gray-800 rounded-2xl rounded-bl-md shadow-sm border border-gray-100"
                }`}
            >
              {isStoryReply && (
                <div className={`mb-1.5 pb-1.5 border-b text-[11px] font-medium flex items-center gap-1.5 ${isMe ? 'border-white/20 text-indigo-100' : 'border-gray-100 text-gray-400'}`}>
                  <span className="flex-shrink-0">📸</span>
                  <span>{isMe ? "Replied to their story" : "Replied to your story"}</span>
                </div>
              )}
              <p className="leading-relaxed">{message}</p>
            </motion.div>
          )}

          {/* Time & Status */}
          <div className={`flex items-center gap-1.5 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
            {time && (
              <span className="text-[10px] text-gray-400">
                {time}
              </span>
            )}

            {/* Message Status for sent messages */}
            {isMe && status && (
              <span className="flex items-center">
                {status === "sending" && (
                  <FaCheck className="w-3 h-3 text-gray-300" />
                )}
                {status === "sent" && (
                  <FaCheck className="w-3 h-3 text-gray-400" />
                )}
                {status === "delivered" && (
                  <FaCheckDouble className="w-3 h-3 text-gray-400" />
                )}
                {status === "seen" && (
                  <FaCheckDouble className="w-3 h-3 text-blue-500" />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Options Button */}
        <div className="relative mb-6">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className={`p-1.5 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-gray-600 transition-all rounded-full hover:bg-gray-100`}
          >
            <FaEllipsisV size={12} />
          </button>

          <AnimatePresence>
            {showOptions && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowOptions(false)}
                ></div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className={`absolute bottom-full mb-2 ${isMe ? 'right-0' : 'left-0'} z-20 bg-white shadow-xl border border-gray-100 rounded-xl py-1 min-w-[140px] overflow-hidden`}
                >
                  <button
                    onClick={handleDeleteForMe}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FaTrash size={10} className="text-gray-400" />
                    Delete for me
                  </button>
                  {isMe && (
                    <button
                      onClick={handleDeleteForEveryone}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <FaTrash size={10} />
                      Delete for everyone
                    </button>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;


