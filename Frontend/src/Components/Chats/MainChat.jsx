import React, { useEffect, useRef, useState } from "react";
import { MdCall, MdVideoCall } from "react-icons/md";
import { FiSearch, FiMoreHorizontal, FiImage, FiPaperclip, FiSmile, FiSend, FiMic, FiStopCircle } from "react-icons/fi";
import { BsEmojiSmile } from "react-icons/bs";
import { IoSend } from "react-icons/io5";
import { Ban, Unlock, X } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import ChatBubble from "./ChatBubble.jsx";
import { useChatStore } from "../../Store/ChatStore.js";
import { useAuthStore } from "../../Store/AuthStore.js";
import { useCallStore } from "../../Store/CallStore.js";
import { useFriendStore } from "../../Store/FriendStore.js";
import { useNavigate } from "react-router-dom";

const MainChat = ({ friend, onToggleDetails, onOpenDetails, onBack, detailsComponent: DetailsComponent }) => {
  const navigate = useNavigate();
  const { messages, sendMessage, sendAttachment, isTyping, sendTyping, stopTyping, messagesLoading, blockUser, unblockUser, isBlocked, markAsRead, onlineUsers } = useChatStore();
  const { user, e2eeEnabled } = useAuthStore();
  const { friends } = useFriendStore();
  const { initiateCall, initiateVoiceCall, error: callError } = useCallStore();
  const [input, setInput] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  // NEW: tracks whether mobile details overlay is open
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [mobileDetailsSection, setMobileDetailsSection] = useState("media");
  const [mobileOnlySection, setMobileOnlySection] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingError, setRecordingError] = useState("");
  const chatEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const menuRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const messageInputRef = useRef(null);
  const docInputRef = useRef(null);
  const mediaInputRef = useRef(null);
  const lastMarkedMessageRef = useRef(null);
  const isChatEncrypted = friend?.isGroup
    ? Boolean(e2eeEnabled) && Array.isArray(friend?.participants) && friend.participants.length > 0 && friend.participants.every((p) => Boolean(p?.publicKey))
    : Boolean(friend?.publicKey) && Boolean(e2eeEnabled);
  const isFriendOnline = !friend?.isGroup && onlineUsers.includes(String(friend?._id || ""));

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (!friend?.isGroup && friend?.conversationId) {
      markAsRead(friend.conversationId);
    }
  }, [friend?._id, friend?.conversationId, friend?.isGroup, markAsRead]);

  useEffect(() => {
    lastMarkedMessageRef.current = null;
  }, [friend?._id, friend?.conversationId]);

  useEffect(() => {
    if (!friend || friend.isGroup || !friend.conversationId || messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.read) return;

    const senderId = typeof lastMessage.sender === "object" ? lastMessage.sender?._id : lastMessage.sender;
    const isIncoming = String(senderId || "") !== String(user?._id || "");
    if (!isIncoming) return;
    if (lastMarkedMessageRef.current === lastMessage._id) return;

    lastMarkedMessageRef.current = lastMessage._id;
    markAsRead(friend.conversationId);
  }, [messages, friend, user?._id, markAsRead]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Ensure Enter sends message even while emoji picker is open
  useEffect(() => {
    if (!showEmojiPicker) return;

    const handleGlobalEnter = (event) => {
      if (event.key === "Enter" && !event.shiftKey && input.trim()) {
        event.preventDefault();
        handleSendMessage();
      }
    };

    document.addEventListener("keydown", handleGlobalEnter, true);
    return () => document.removeEventListener("keydown", handleGlobalEnter, true);
  }, [showEmojiPicker, input]);

  // Close mobile details when friend changes
  useEffect(() => {
    setShowMobileDetails(false);
    setMobileDetailsSection("media");
    setMobileOnlySection(null);
  }, [friend?._id]);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleBlockUser = async () => {
    const result = await blockUser(friend._id);
    if (result.success) {
      setShowMenu(false);
    }
  };

  const handleUnblockUser = async () => {
    const result = await unblockUser(friend._id);
    if (result.success) {
      setShowMenu(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !friend) return;

    const text = input.trim();
    setInput("");
    setShowEmojiPicker(false);

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

  // NEW: unified handler — on desktop call onToggleDetails, on mobile open overlay
  const handleViewDetails = (section = "media", onlySection = null) => {
    setShowMenu(false);
    const isMobile = window.innerWidth < 768; // matches Tailwind's md breakpoint
    if (isMobile) {
      setMobileDetailsSection(section);
      setMobileOnlySection(onlySection);
      setShowMobileDetails(true);
    } else {
      if (onOpenDetails) {
        onOpenDetails(section, onlySection);
      } else {
        onToggleDetails();
      }
    }
  };

  const handleAttachmentPick = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await sendAttachment(file);
    event.target.value = "";
  };

  const handleEmojiSelect = (emojiData) => {
    setInput((prev) => `${prev}${emojiData.emoji}`);
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const startRecordingAudio = async () => {
    if (isRecording) return;
    try {
      setRecordingError("");
      if (typeof window !== "undefined" && !window.isSecureContext) {
        setRecordingError("Microphone needs HTTPS or localhost.");
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setRecordingError("Microphone is not supported in this browser.");
        return;
      }
      if (typeof MediaRecorder === "undefined") {
        setRecordingError("Audio recording is not supported in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeCandidates = [
        "audio/mp4",
        "audio/webm;codecs=opus",
        "audio/webm",
      ];
      const mimeType = mimeCandidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recordingChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const rawRecordedMime = recorder.mimeType || mimeType || "audio/webm";
        const recordedMimeType = rawRecordedMime.startsWith("video/webm")
          ? "audio/webm"
          : rawRecordedMime;
        if (recordingChunksRef.current.length === 0) {
          stream.getTracks().forEach((track) => track.stop());
          setRecordingError("No audio captured. Please try again.");
          setIsRecording(false);
          setRecordingTime(0);
          if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
            recordingIntervalRef.current = null;
          }
          return;
        }

        const audioBlob = new Blob(recordingChunksRef.current, {
          type: recordedMimeType,
        });
        const extension = recordedMimeType.includes("mp4") ? "m4a" : "webm";
        const audioFile = new File([audioBlob], `voice-message-${Date.now()}.${extension}`, {
          type: recordedMimeType,
        });

        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        setRecordingTime(0);
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }

        if (audioFile.size > 0) {
          await sendAttachment(audioFile);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Microphone permission denied or unavailable:", error);
      setRecordingError("Microphone permission denied or unavailable.");
    }
  };

  const stopRecordingAudio = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== "recording") return;
    mediaRecorderRef.current.stop();
  };

  // Get message status for display
  const getMessageStatus = (msg, isMe) => {
    if (!isMe) return null;
    if (msg.sending) return "sending";
    const canShowSeen = friend?.isGroup || friend?.readReceiptsEnabled !== false;
    if (msg.read && canShowSeen) return "seen";
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
      <div className="h-full flex-1 flex flex-col bg-white dark:bg-black items-center justify-center">
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
    <div className="h-full flex-1 flex flex-col bg-white dark:bg-black relative">
      {/* ── MOBILE DETAILS OVERLAY ── */}
      {/* 
        This full-screen overlay slides in on mobile when "View details" is tapped.
        It renders your existing details panel component inside it.
        On desktop this overlay never appears — onToggleDetails() handles it instead.
      */}
      {showMobileDetails && (
        <div className="absolute inset-0 z-50 flex flex-col md:hidden overflow-y-auto bg-white">
          {/* 
            No wrapper header here — ChatDetails renders its own header.
            We just pass onClose so its internal close/back button works.
          */}
          {DetailsComponent ? (
            <DetailsComponent
              friend={friend}
              focusSection={mobileDetailsSection}
              onlySection={mobileOnlySection}
              onClose={() => setShowMobileDetails(false)}
            />
          ) : (
            // Fallback if no detailsComponent prop is provided
            <div className="flex flex-col items-center gap-4 px-6 py-8">
              <div className="flex items-center justify-between w-full mb-2">
                <h2 className="font-semibold text-gray-900 text-base">Chat Details</h2>
                <button
                  onClick={() => setShowMobileDetails(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
                >
                  <X size={20} />
                </button>
              </div>
              <img
                src={
                  friend.isGroup
                    ? (friend.groupAvatar || `https://ui-avatars.com/api/?name=${friend.groupName}&background=indigo&color=fff&size=80`)
                    : (friend.avatar || `https://ui-avatars.com/api/?name=${friend.username}&background=random&size=80`)
                }
                alt={friend.isGroup ? friend.groupName : friend.username}
                className="w-20 h-20 rounded-full object-cover border border-gray-200"
              />
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 text-lg">
                  {friend.isGroup ? friend.groupName : friend.username}
                </h3>
                {friend.isGroup && (
                  <p className="text-sm text-gray-500 mt-1">{friend.participants?.length || 0} members</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chat Header */}
      <div className="flex justify-between items-center h-16 px-5 bg-white dark:bg-[#0b0b0b] border-b border-gray-200 dark:border-[#2a2a2a]">
        <div className="flex items-center gap-3">
          {/* Mobile Back Button */}
          <button
            onClick={onBack}
            className="md:hidden mr-1 text-gray-600 hover:text-indigo-600"
          >
            ←
          </button>
          <div
            onClick={() => {
              if (friend.isGroup) {
                handleViewDetails("media");
              } else {
                navigate(`/profile/${friend._id}`);
              }
            }}
            className="relative cursor-pointer"
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
            onClick={() => {
              if (friend.isGroup) {
                handleViewDetails("media");
              } else {
                navigate(`/profile/${friend._id}`);
              }
            }}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <h1 className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
                {friend.isGroup ? friend.groupName : friend.username}
              </h1>
              {isChatEncrypted && (
                <span title="End-to-End Encrypted" className="text-green-500">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </div>
            {friend.isGroup ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewDetails("members", "members");
                }}
                className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"
              >
                {friend.participants?.length || 0} members
              </button>
            ) : isTyping ? (
              <p className="text-sm text-green-600">typing...</p>
            ) : isFriendOnline ? (
              <p className="text-sm text-green-600">Online now</p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-4 text-gray-500">
          {!friend.isGroup && (
            <>
              <MdCall
                className="w-5 h-5 cursor-pointer hover:text-indigo-600 transition-colors"
                onClick={() => initiateVoiceCall(friend)}
                title="Start voice call"
              />
              <MdVideoCall
                className="w-6 h-6 cursor-pointer hover:text-indigo-600 transition-colors"
                onClick={() => initiateCall(friend, "video")}
                title="Start video call"
              />
            </>
          )}
          
          {/* Dropdown Menu */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => {
                if (friend.isGroup) {
                  handleViewDetails("media", "media");
                } else {
                  setShowMenu(!showMenu);
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiMoreHorizontal className="w-5 h-5" />
            </button>

            {showMenu && !friend.isGroup && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
                {isBlocked ? (
                  <button
                    onClick={handleUnblockUser}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 text-green-600 font-medium transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <Unlock size={18} />
                    Unblock user
                  </button>
                ) : (
                  <button
                    onClick={handleBlockUser}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-600 font-medium transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <Ban size={18} />
                    Block user
                  </button>
                )}
                {/* FIXED: now calls handleViewDetails instead of onToggleDetails directly */}
                <button
                  onClick={() => handleViewDetails("media")}
                  className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  View details
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-3 pt-6 pb-4 relative">
        {/* Floating Encryption Banner */}
        {isChatEncrypted && (
          <div className="sticky top-2 z-20 flex justify-center mb-5 pointer-events-none">
            <div className="bg-white/80 dark:bg-[#1a1a1a]/90 backdrop-blur-md border border-white/50 dark:border-[#333] px-4 py-1.5 rounded-full shadow-sm text-center max-w-xs pointer-events-auto">
              <p className="text-[10px] text-gray-500 font-semibold flex items-center justify-center gap-1.5 uppercase tracking-wider">
                <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                End-to-End Encrypted
              </p>
            </div>
          </div>
        )}

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
                    sharedProfile={msg.sharedProfile}
                    messageId={msg._id}
                    isDeletedForEveryone={msg.isDeletedForEveryone}
                    isStoryReply={msg.isStoryReply}
                    sharedStory={msg.sharedStory}
                    isEncrypted={msg.isEncrypted}
                    attachment={msg.attachment}
                  />
                </React.Fragment>
              );
            })}
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area or Not Friends Message or Blocked Message */}
      {isBlocked ? (
        <div className="bg-red-50 border-t border-red-200 px-5 py-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <Ban className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-gray-700 font-semibold">You have blocked this user</p>
              <p className="text-gray-500 text-sm mt-1">You won't be able to send messages to this user.</p>
            </div>
            <button
              onClick={handleUnblockUser}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Unblock user
            </button>
          </div>
        </div>
      ) : (friend.isGroup || friends.some(f => f._id === friend._id)) ? (
        <div className="bg-white border-t border-gray-200 px-5 py-3">
          <div className="flex items-center gap-3">
            {/* Action Icons */}
            <div className="flex items-center gap-2 text-gray-400">
              <input
                ref={docInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z"
                className="hidden"
                onChange={handleAttachmentPick}
              />
              <input
                ref={mediaInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleAttachmentPick}
              />
              <button
                onClick={() => docInputRef.current?.click()}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Share file"
              >
                <FiPaperclip className="w-5 h-5" />
              </button>
              <button
                onClick={() => mediaInputRef.current?.click()}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Share photo/video"
              >
                <FiImage className="w-5 h-5" />
              </button>
              <button
                onClick={isRecording ? stopRecordingAudio : startRecordingAudio}
                className={`p-2 rounded-full transition-colors ${isRecording ? "bg-red-50 text-red-600 hover:bg-red-100" : "hover:bg-gray-100"}`}
                title={isRecording ? "Stop recording" : "Record voice message"}
              >
                {isRecording ? <FiStopCircle className="w-5 h-5" /> : <FiMic className="w-5 h-5" />}
              </button>
            </div>

            {/* Text Input */}
            <div className="flex-1 relative">
              {isRecording && (
                <div className="absolute -top-7 left-1 text-[11px] font-semibold text-red-500">
                  Recording... {formatRecordingTime(recordingTime)}
                </div>
              )}
              {!!recordingError && (
                <div className="absolute -top-7 left-1 text-[11px] font-semibold text-amber-600">
                  {recordingError}
                </div>
              )}
              <input
                ref={messageInputRef}
                className="w-full px-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all pr-10"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Aa"
              />
              <button
                onClick={() => {
                  setShowEmojiPicker((prev) => !prev);
                  setTimeout(() => messageInputRef.current?.focus(), 0);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <BsEmojiSmile className="w-5 h-5" />
              </button>
              {showEmojiPicker && (
                <div ref={emojiPickerRef} className="absolute bottom-12 right-0 z-50 shadow-xl rounded-xl overflow-hidden">
                  <EmojiPicker
                    onEmojiClick={handleEmojiSelect}
                    lazyLoadEmojis={true}
                    width={320}
                    height={400}
                  />
                </div>
              )}
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
