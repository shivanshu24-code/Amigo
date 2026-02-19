import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheck, FaCheckDouble, FaTrash, FaEllipsisV } from "react-icons/fa";
import { Link } from "react-router-dom";
import { AlertCircle, Download, ExternalLink, Heart, MessageCircle, Pause, Play, X } from "lucide-react";
import { useChatStore } from "../../Store/ChatStore";
import { useStoryStore } from "../../Store/StoryStore";

const ChatBubble = ({ message, isMe, time, avatar, senderName, status, sharedPost, sharedProfile, messageId, isDeletedForEveryone, isStoryReply, sharedStory, isEncrypted, attachment }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [pendingDeleteType, setPendingDeleteType] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isInlineVideoPlaying, setIsInlineVideoPlaying] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioError, setAudioError] = useState("");
  const [isAudioActionPending, setIsAudioActionPending] = useState(false);
  const inlineVideoRef = useRef(null);
  const audioRef = useRef(null);
  const { deleteMessage } = useChatStore();
  const { openViewer } = useStoryStore();

  const handleConfirmDelete = async () => {
    if (!pendingDeleteType || isDeleting) return;
    setIsDeleting(true);
    const deleteForEveryone = pendingDeleteType === "everyone";
    await deleteMessage(messageId, deleteForEveryone);
    setIsDeleting(false);
    setPendingDeleteType(null);
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;
    setPendingDeleteType(null);
  };

  useEffect(() => {
    setIsAudioPlaying(false);
    setAudioCurrentTime(0);
    setAudioDuration(0);
    setAudioError("");
  }, [attachment?.url]);

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

  // Instagram-style shared story component
  const SharedStoryCard = () => (
    <div
      onClick={() => openViewer([sharedStory], 0)}
      className="relative w-48 h-80 rounded-2xl overflow-hidden shadow-lg group/story border border-white/10 bg-black cursor-pointer"
    >
      {/* Story Media */}
      <img
        src={sharedStory.media?.[0] || sharedStory.media}
        alt="Story"
        className="w-full h-full object-cover transition-transform duration-500 group-hover/story:scale-105"
      />

      {/* Glossy Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

      {/* Header Info */}
      <div className="absolute top-0 left-0 w-full p-3 flex items-center gap-2">
        <img
          src={sharedStory.author?.avatar || `https://ui-avatars.com/api/?name=${sharedStory.author?.username}&background=random&size=24`}
          alt={sharedStory.author?.username}
          className="w-6 h-6 rounded-full object-cover ring-2 ring-white/30"
        />
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-white leading-none truncate w-24">
            {sharedStory.author?.username}
          </span>
          <span className="text-[8px] text-white/70">Shared a story</span>
        </div>
      </div>

      {/* View Indicator */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/story:opacity-100 transition-opacity">
        <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30 text-white text-[10px] font-medium">
          View Story
        </div>
      </div>
    </div>
  );

  const SharedProfileCard = () => (
    <Link
      to={`/profile/${sharedProfile._id}`}
      className="block w-64 bg-white rounded-xl overflow-hidden shadow-md border border-gray-100 hover:shadow-lg transition-shadow"
    >
      <div className="p-3 flex items-center gap-3">
        <img
          src={sharedProfile.avatar || `https://ui-avatars.com/api/?name=${sharedProfile.username}&background=random&size=48`}
          alt={sharedProfile.username}
          className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500">Shared profile</p>
          <p className="text-sm font-semibold text-gray-900 truncate">{sharedProfile.username}</p>
          {sharedProfile.isPrivate && (
            <p className="text-[10px] text-gray-500">Private account</p>
          )}
        </div>
        <ExternalLink size={14} className="text-gray-400" />
      </div>
      <div className="px-3 pb-3">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Tap to view profile</p>
      </div>
    </Link>
  );

  const isUnavailableSharedStoryMessage =
    !message &&
    !sharedPost &&
    !sharedProfile &&
    !sharedStory &&
    !attachment?.url &&
    !isStoryReply &&
    !isDeletedForEveryone;

  const UnavailableStoryCard = () => (
    <div className="w-48 h-28 rounded-2xl border border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-center px-4">
      <AlertCircle size={20} className="text-gray-400 mb-2" />
      <p className="text-xs font-semibold text-gray-700">Story unavailable</p>
      <p className="text-[10px] text-gray-500 mt-1">This story is no longer available.</p>
    </div>
  );

  const handleDownloadAttachment = async () => {
    if (!attachment?.url) return;
    try {
      const response = await fetch(attachment.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = attachment.fileName || "attachment";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      // Fallback for cross-origin/cors blocked downloads
      window.open(attachment.url, "_blank", "noopener,noreferrer");
    }
  };

  const handleToggleInlineVideo = () => {
    if (!inlineVideoRef?.current) return;
    if (inlineVideoRef.current.paused) {
      inlineVideoRef.current.play();
      setIsInlineVideoPlaying(true);
    } else {
      inlineVideoRef.current.pause();
      setIsInlineVideoPlaying(false);
    }
  };

  const handleOpenVideoModal = () => {
    if (inlineVideoRef?.current && !inlineVideoRef.current.paused) {
      inlineVideoRef.current.pause();
      setIsInlineVideoPlaying(false);
    }
    setShowVideoModal(true);
  };

  const syncAudioUiState = () => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    setIsAudioPlaying(!audioEl.paused && !audioEl.ended);
    setAudioCurrentTime(audioEl.currentTime || 0);
    setAudioDuration(Number.isFinite(audioEl.duration) ? audioEl.duration : 0);
    if (audioEl.error?.code) {
      setAudioError("Unable to play this voice note. Try downloading it.");
    }
  };

  const handleToggleAudioPlayback = () => {
    const audioEl = audioRef.current;
    if (!audioEl || isAudioActionPending) return;

    if (!audioEl.paused) {
      audioEl.pause();
      setIsAudioPlaying(false);
      return;
    }

    setIsAudioActionPending(true);
    setAudioError("");
    if (audioEl.ended || (audioDuration > 0 && audioEl.currentTime >= audioDuration - 0.05)) {
      audioEl.currentTime = 0;
    }
    audioEl.muted = false;
    audioEl.volume = 1;

    const playPromise = audioEl.play();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise
        .then(() => {
          setIsAudioPlaying(true);
        })
        .catch(() => {
          setAudioError("Unable to play this voice note. Try downloading it.");
          setIsAudioPlaying(false);
        })
        .finally(() => {
          setIsAudioActionPending(false);
        });
    } else {
      // Safari may return void from play(); rely on events and clear pending quickly
      setIsAudioPlaying(true);
      setTimeout(() => setIsAudioActionPending(false), 200);
    }
  };

  const formatAudioTime = (seconds) => {
    const total = Number.isFinite(seconds) ? Math.floor(seconds) : 0;
    const mins = Math.floor(total / 60).toString().padStart(2, "0");
    const secs = (total % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const waveformPattern = [6, 10, 14, 9, 16, 11, 7, 13, 18, 12, 8, 15, 10, 6, 14, 17, 9, 12, 16, 11, 7, 13, 9, 15];

  const AttachmentCard = () => {
    if (!attachment?.url) return null;

    const fileName = (attachment.fileName || "").toLowerCase();
    const mimeType = attachment.mimeType || "";
    const fallbackAudioByName = (!mimeType || mimeType === "application/octet-stream") &&
      /\.(mp3|m4a|wav|ogg|webm|aac)$/i.test(fileName);
    const isLikelyVoiceNote = fileName.startsWith("voice-message-");
    const isAudio = attachment.resourceType === "audio" ||
      mimeType.startsWith("audio/") ||
      fallbackAudioByName ||
      (isLikelyVoiceNote && mimeType.includes("webm"));
    const isImage = attachment.resourceType === "image" || mimeType.startsWith("image/");
    const isVideo = !isAudio && (attachment.resourceType === "video" || mimeType.startsWith("video/"));

    if (isImage) {
      return (
        <div className="w-64 rounded-2xl overflow-hidden shadow-md border border-gray-100 bg-white">
          <img src={attachment.url} alt={attachment.fileName || "shared image"} className="w-full h-56 object-cover" />
          <div className="p-2.5 flex items-center justify-between gap-2 border-t border-gray-100">
            <p className="text-[11px] text-gray-700 truncate flex-1">{attachment.fileName || "Photo"}</p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => window.open(attachment.url, "_blank", "noopener,noreferrer")}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
                title="View full image"
              >
                <ExternalLink size={14} />
              </button>
              <button
                onClick={handleDownloadAttachment}
                className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600"
                title="Download image"
              >
                <Download size={14} />
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (isVideo) {
      return (
        <div className="w-72 rounded-2xl overflow-hidden shadow-md border border-gray-100 bg-white">
          <div className="relative bg-black">
            <video
              ref={inlineVideoRef}
              src={attachment.url}
              className="w-full h-56 object-cover"
              onPause={() => setIsInlineVideoPlaying(false)}
              onPlay={() => setIsInlineVideoPlaying(true)}
            />
            <button
              onClick={handleToggleInlineVideo}
              className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
              title={isInlineVideoPlaying ? "Pause" : "Play"}
            >
              <span className="w-12 h-12 rounded-full bg-white/90 text-gray-900 flex items-center justify-center shadow-lg">
                {isInlineVideoPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
              </span>
            </button>
          </div>
          <div className="p-2.5 flex items-center justify-between gap-2 border-t border-gray-100">
            <p className="text-[11px] text-gray-700 truncate flex-1">{attachment.fileName || "Video"}</p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleOpenVideoModal}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
                title="Open full video"
              >
                <ExternalLink size={14} />
              </button>
              <button
                onClick={handleDownloadAttachment}
                className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600"
                title="Download video"
              >
                <Download size={14} />
              </button>
            </div>
          </div>
          {showVideoModal && (
            <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4">
              <button
                onClick={() => setShowVideoModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                title="Close"
              >
                <X size={20} />
              </button>
              <video
                src={attachment.url}
                controls
                autoPlay
                className="w-full max-w-4xl max-h-[85vh] rounded-xl bg-black"
              />
            </div>
          )}
        </div>
      );
    }

    if (isAudio) {
      const progressRatio = audioDuration > 0 ? Math.min(audioCurrentTime / audioDuration, 1) : 0;
      return (
        <div className={`w-[340px] max-w-full rounded-2xl border p-3 shadow-sm ${isMe ? "bg-indigo-600 border-indigo-500" : "bg-white border-gray-100"}`}>
          <audio
            ref={audioRef}
            preload="metadata"
            playsInline
            src={attachment.url}
            onPlay={() => {
              setIsAudioActionPending(false);
              syncAudioUiState();
            }}
            onPause={() => {
              setIsAudioActionPending(false);
              syncAudioUiState();
            }}
            onLoadedMetadata={syncAudioUiState}
            onTimeUpdate={syncAudioUiState}
            onEnded={() => {
              setIsAudioActionPending(false);
              syncAudioUiState();
            }}
            onCanPlay={syncAudioUiState}
            onWaiting={syncAudioUiState}
            onError={() => {
              setAudioError("Voice note failed to load.");
              setIsAudioActionPending(false);
              syncAudioUiState();
            }}
          />

          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleAudioPlayback}
              disabled={isAudioActionPending}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isMe ? "bg-white/20 text-white hover:bg-white/30" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}
              title={isAudioPlaying ? "Pause" : "Play"}
            >
              {isAudioPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={(e) => {
                if (!audioRef.current || !audioDuration) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const clickRatio = (e.clientX - rect.left) / rect.width;
                const nextTime = Math.max(0, Math.min(audioDuration, clickRatio * audioDuration));
                audioRef.current.currentTime = nextTime;
                setAudioCurrentTime(nextTime);
              }}
              className={`flex-1 h-8 rounded-md px-1 flex items-end gap-[2px] overflow-hidden ${isMe ? "bg-white/10" : "bg-black/5"}`}
              title="Seek voice message"
            >
              {waveformPattern.map((height, index) => {
                const barProgress = (index + 1) / waveformPattern.length;
                const isPassed = barProgress <= progressRatio;
                const baseColor = isMe
                  ? (isPassed ? "bg-white/90" : "bg-white/35")
                  : (isPassed ? "bg-emerald-500" : "bg-gray-300");

                return (
                  <motion.span
                    key={`${attachment.url}-${index}`}
                    className={`inline-block w-1 rounded-full ${baseColor}`}
                    style={{ height: `${height}px`, transformOrigin: "bottom" }}
                    animate={isAudioPlaying ? { scaleY: [0.75, 1.15, 0.85, 1] } : { scaleY: 1 }}
                    transition={{
                      duration: 0.85,
                      repeat: isAudioPlaying ? Infinity : 0,
                      delay: index * 0.02,
                      ease: "easeInOut",
                    }}
                  />
                );
              })}
            </button>

            <button
              onClick={handleDownloadAttachment}
              className={`p-1.5 rounded-lg transition-colors ${isMe ? "hover:bg-white/20 text-white" : "hover:bg-gray-100 text-gray-600"}`}
              title="Download voice note"
            >
              <Download size={13} />
            </button>
          </div>

          <div className="mt-2 px-1 flex items-center justify-between">
            <p className={`text-[12px] font-semibold ${isMe ? "text-indigo-100" : "text-gray-700"}`}>Voice message</p>
            <span className={`text-[11px] ${isMe ? "text-indigo-100/90" : "text-gray-500"}`}>
              {formatAudioTime(audioCurrentTime)} / {formatAudioTime(audioDuration)}
            </span>
          </div>
          {audioError && (
            <div className={`mt-1 text-[10px] ${isMe ? "text-red-200" : "text-red-500"}`}>
              {audioError}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="w-64 bg-white rounded-2xl border border-gray-200 p-3 shadow-sm">
        <p className="text-xs font-semibold text-gray-900 truncate">{attachment.fileName || "File"}</p>
        <p className="text-[11px] text-gray-500 mt-1">{attachment.mimeType || "Document"}</p>
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => window.open(attachment.url, "_blank", "noopener,noreferrer")}
            className="flex-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Open
          </button>
          <button
            onClick={handleDownloadAttachment}
            className="flex-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
          >
            Download
          </button>
        </div>
      </div>
    );
  };

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
          {/* Shared Story Card */}
          {sharedStory && !isDeletedForEveryone && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <SharedStoryCard />
            </motion.div>
          )}

          {isUnavailableSharedStoryMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <UnavailableStoryCard />
            </motion.div>
          )}

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

          {/* Attachment Card */}
          {attachment?.url && !isDeletedForEveryone && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <AttachmentCard />
            </motion.div>
          )}

          {/* Shared Profile Card */}
          {sharedProfile && !isDeletedForEveryone && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <SharedProfileCard />
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
              {senderName && !isMe && (
                <div className="mb-1 text-[11px] font-bold text-indigo-600">
                  {senderName}
                </div>
              )}
              {isStoryReply && (
                <div className={`mb-1.5 pb-1.5 border-b text-[11px] font-medium flex items-center gap-1.5 ${isMe ? 'border-white/20 text-indigo-100' : 'border-gray-100 text-gray-400'}`}>
                  <span className="flex-shrink-0">📸</span>
                  <span>{isMe ? "Replied to their story" : "Replied to your story"}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <p className="leading-relaxed">{message}</p>
                {/* Padlock for E2EE messages */}
                {message && !isDeletedForEveryone && isEncrypted && (
                  <span className={`block transition-opacity ${isMe ? 'text-indigo-200' : 'text-gray-300'}`} title="End-to-End Encrypted">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
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
                    onClick={() => {
                      setPendingDeleteType("me");
                      setShowOptions(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FaTrash size={10} className="text-gray-400" />
                    Delete for me
                  </button>
                  {isMe && (
                    <button
                      onClick={() => {
                        setPendingDeleteType("everyone");
                        setShowOptions(false);
                      }}
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

      <AnimatePresence>
        {pendingDeleteType && (
          <>
            <div className="fixed inset-0 z-40 bg-black/35" onClick={handleCancelDelete}></div>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-gray-100 p-5">
                <h3 className="text-sm font-semibold text-gray-900">Delete message?</h3>
                <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                  {pendingDeleteType === "everyone"
                    ? "Do you really want to delete this message for everyone?"
                    : "Do you really want to delete this message only for you?"}
                </p>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    onClick={handleCancelDelete}
                    disabled={isDeleting}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50 ${pendingDeleteType === "everyone" ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"}`}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatBubble;


