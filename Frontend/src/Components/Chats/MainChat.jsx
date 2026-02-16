import React, { useEffect, useRef, useState } from "react";
import { MdCall, MdVideoCall } from "react-icons/md";
import { FiSearch, FiMoreHorizontal, FiImage, FiPaperclip, FiSmile, FiSend } from "react-icons/fi";
import { BsEmojiSmile } from "react-icons/bs";
import { IoSend } from "react-icons/io5";
import ChatBubble from "./ChatBubble.jsx";
import { useChatStore } from "../../Store/ChatStore.js";
import { useAuthStore } from "../../Store/AuthStore.js";
import { useCallStore } from "../../Store/CallStore.js";
import { useFriendStore } from "../../Store/FriendStore.js";
import { useNavigate } from "react-router-dom";

const MainChat = ({ friend, onToggleDetails, onBack }) => {
  const navigate = useNavigate();
  const { messages, sendMessage, isTyping, sendTyping, stopTyping, messagesLoading } = useChatStore();
  const { user } = useAuthStore();
  const { friends } = useFriendStore();
  const { initiateCall, error: callError } = useCallStore();
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !friend) return;

    const text = input.trim();
    setInput("");

    // Stop typing indicator
    stopTyping();

    // Send message via REST API
    await sendMessage(text);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);

    // Send typing indicator
    sendTyping();

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Get message status for display
  const getMessageStatus = (msg, isMe) => {
    if (!isMe) return null;
    if (msg.sending) return "sending";
    if (msg.read) return "seen";
    return "delivered";
  };

  // Format date for message groups
  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    }
    return date.toLocaleDateString([], { weekday: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // No friend selected - show placeholder
  if (!friend) {
    return (
      <div className="h-full flex-1 flex flex-col bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-700">Select a chat</h2>
          <p className="text-gray-500 mt-2">Choose a friend to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex-1 flex flex-col bg-gray-100">
      {/* Chat Header */}
      <div className="flex justify-between items-center h-16 px-5 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          {/* Mobile Back Button */}
          <button
            onClick={onBack}
            className="md:hidden mr-1 text-gray-600 hover:text-indigo-600"
          >
            ←
          </button>
          <div
            onClick={() => !friend.isGroup && navigate(`/profile/${friend._id}`)}
            className={`relative ${!friend.isGroup ? 'cursor-pointer' : ''}`}
          >
            <img
              src={friend.isGroup
                ? (friend.groupAvatar || `https://ui-avatars.com/api/?name=${friend.groupName}&background=indigo&color=fff&size=44`)
                : (friend.avatar || `https://ui-avatars.com/api/?name=${friend.username}&background=random&size=44`)
              }
              alt={friend.isGroup ? friend.groupName : friend.username}
              className="w-11 h-11 rounded-full object-cover border border-gray-100 transition-all hover:scale-105"
            />
            {!friend.isGroup && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>}
          </div>
          <div
            onClick={() => !friend.isGroup && navigate(`/profile/${friend._id}`)}
            className={!friend.isGroup ? 'cursor-pointer' : ''}
          >
            <h1 className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
              {friend.isGroup ? friend.groupName : friend.username}
            </h1>
            {friend.isGroup ? (
              <p className="text-sm text-gray-500">{friend.participants?.length || 0} members</p>
            ) : isTyping ? (
              <p className="text-sm text-green-600">typing...</p>
            ) : (
              <p className="text-sm text-green-600">Online now</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-gray-500">
          {!friend.isGroup && (
            <>
              <MdCall className="w-5 h-5 cursor-pointer hover:text-indigo-600 transition-colors" />
              <MdVideoCall
                className="w-6 h-6 cursor-pointer hover:text-indigo-600 transition-colors"
                onClick={() => initiateCall(friend)}
                title="Start video call"
              />
            </>
          )}
          <FiMoreHorizontal
            className="w-5 h-5 cursor-pointer hover:text-indigo-600 transition-colors"
            onClick={onToggleDetails}
          />
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {messagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p>No messages yet</p>
            <p className="text-sm mt-1">Say hi to {friend.isGroup ? friend.groupName : friend.username}! 👋</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => {
              const isMe = msg.sender?._id === user?._id || msg.sender === user?._id || msg.sender?._id === 'me';
              const showDateSeparator = i === 0 ||
                new Date(msg.createdAt).toDateString() !== new Date(messages[i - 1]?.createdAt).toDateString();

              return (
                <React.Fragment key={msg._id || i}>
                  {showDateSeparator && (
                    <div className="flex justify-center my-4">
                      <span className="text-xs text-gray-400 bg-gray-200 px-3 py-1 rounded-full">
                        {formatMessageDate(msg.createdAt)}
                      </span>
                    </div>
                  )}
                  <ChatBubble
                    message={msg.text}
                    isMe={isMe}
                    time={new Date(msg.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                    avatar={!isMe ? (msg.sender?.avatar || friend.avatar || `https://ui-avatars.com/api/?name=${msg.sender?.username || 'User'}&background=random`) : null}
                    senderName={friend.isGroup && !isMe ? msg.sender?.username : null}
                    status={getMessageStatus(msg, isMe)}
                    sharedPost={msg.sharedPost}
                    messageId={msg._id}
                    isDeletedForEveryone={msg.isDeletedForEveryone}
                    isStoryReply={msg.isStoryReply}
                    sharedStory={msg.sharedStory}
                  />
                </React.Fragment>
              );
            })}
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area or Not Friends Message */}
      {(friend.isGroup || friends.some(f => f._id === friend._id)) ? (
        <div className="bg-white border-t border-gray-200 px-5 py-3">
          <div className="flex items-center gap-3">
            {/* Action Icons */}
            <div className="flex items-center gap-2 text-gray-400">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <FiPaperclip className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <FiImage className="w-5 h-5" />
              </button>
            </div>

            {/* Text Input */}
            <div className="flex-1 relative">
              <input
                className="w-full px-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all pr-10"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Aa"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <BsEmojiSmile className="w-5 h-5" />
              </button>
            </div>

            {/* Send Button */}
            <button
              className={`p-2.5 rounded-full transition-all ${input.trim()
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-100 text-gray-400'
                }`}
              onClick={handleSendMessage}
              disabled={!input.trim()}
            >
              <IoSend className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border-t border-gray-200 px-5 py-4 text-center">
          <p className="text-gray-500 text-sm">You are not friends with this user. <span className="font-medium text-gray-700">Add them to send messages.</span></p>
        </div>
      )}
    </div>
  );
};

export default MainChat;
