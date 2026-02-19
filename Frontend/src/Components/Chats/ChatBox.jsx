import React from 'react'
import { FiSearch, FiEdit, FiUsers, FiImage, FiVideo, FiPaperclip, FiTrash2, FiCamera, FiMic } from "react-icons/fi";

const ChatBox = ({ conversations, friends, showFriendsList, onSelectChat, onNewChat, onCreateGroup, currentChatId, loading }) => {
  const [activeTab, setActiveTab] = React.useState('direct');

  const filteredConversations = conversations?.filter(c => {
    if (activeTab === 'group') return c.isGroup;
    return !c.isGroup;
  });

  // Format time to relative (12m, 1h, 2h, etc.)
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  return (
    <div className='bg-white dark:bg-[#0b0b0b] w-full lg:w-[320px] border-r border-gray-200 dark:border-[#2a2a2a] h-full flex flex-col'>
      {/* Header */}
      <div className='p-5 pb-3'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className="font-bold text-3xl text-gray-900 dark:text-gray-100">Chats</h2>
          <div className="flex items-center gap-3">
            <FiUsers
              className='w-5 h-5 text-indigo-600 dark:text-indigo-400 cursor-pointer hover:text-white hover:bg-indigo-600 rounded-full transition-all'
              onClick={onCreateGroup}
              title="Create group"
            />
            <FiEdit
              className='w-5 h-5 text-indigo-600 dark:text-indigo-400 cursor-pointer hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors'
              onClick={onNewChat}
              title="New chat"
            />
          </div>
        </div>

        {/* Search Bar */}
        <div className='relative'>
          <FiSearch className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500' />
          <input
            type="text"
            placeholder="Search in chats"
            className='w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-[#141414] text-gray-800 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-500/40 transition-all'
          />
        </div>
        {/* Tabs - Only show when not selecting friends */}
        {!showFriendsList && (
          <div className="flex px-5 space-x-4 border-b border-gray-100 dark:border-[#2a2a2a] items-center justify-between">
            <button
              onClick={() => setActiveTab('direct')}
              className={`pb-2 mt-4 text-sm font-medium transition-colors relative ${activeTab === 'direct' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
            >
              Chats
              {activeTab === 'direct' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('group')}
              className={`pb-2 mt-4 text-sm font-medium transition-colors relative ${activeTab === 'group' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
            >
              Groups
              {activeTab === 'group' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Chat/Friends List */}
      <div className='flex-1 overflow-y-auto'>
        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : showFriendsList ? (
          friends && friends.length > 0 ? (
            friends.map(friend => (
              <div
                key={friend._id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 cursor-pointer transition-colors"
                onClick={() => onSelectChat(friend)}
              >
                <div className="relative">
                  <img
                    src={friend.avatar || `https://ui-avatars.com/api/?name=${friend.username}&background=random&size=48`}
                    className="w-12 h-12 rounded-full object-cover"
                    alt={friend.username}
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{friend.username}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm truncate">Start a conversation</p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500 dark:text-gray-400">
              <p>No friends yet</p>
              <p className="text-sm mt-1">Add friends to start chatting</p>
            </div>
          )
        ) : (
          filteredConversations && filteredConversations.length > 0 ? (
            filteredConversations.map(conv => {
              const isSelected = currentChatId === conv._id ||
                (!conv.isGroup && currentChatId === conv.friend?._id);

              const unreadCount = conv.unreadCount || 0;

              const displayName = conv.isGroup ? conv.groupName : conv.friend?.username;
              const displayAvatar = conv.isGroup
                ? (conv.groupAvatar || `https://ui-avatars.com/api/?name=${conv.groupName}&background=indigo&color=fff&size=48`)
                : (conv.friend?.avatar || `https://ui-avatars.com/api/?name=${conv.friend?.username}&background=random&size=48`);

              const textPrefix = conv.lastMessage?.sender?._id === 'me'
                ? 'You: '
                : (conv.isGroup && conv.lastMessage?.sender?.username ? `${conv.lastMessage.sender.username}: ` : '');

              const renderLastMessagePreview = () => {
                const isUnavailableSharedStory =
                  !conv.lastMessage?.text &&
                  !conv.lastMessage?.sharedPost &&
                  !conv.lastMessage?.sharedProfile &&
                  !conv.lastMessage?.sharedStory &&
                  !conv.lastMessage?.attachment?.url &&
                  !conv.lastMessage?.isStoryReply &&
                  !conv.lastMessage?.isDeletedForEveryone;

                if (conv.lastMessage?.isDeletedForEveryone) {
                  return (
                    <span className="inline-flex items-center gap-1.5">
                      <FiTrash2 className="w-3.5 h-3.5" />
                      Message deleted
                    </span>
                  );
                }

                if (conv.lastMessage?.isStoryReply) {
                  return (
                    <span className="inline-flex items-center gap-1.5">
                      <FiCamera className="w-3.5 h-3.5" />
                      Replied to story
                    </span>
                  );
                }

                if (conv.lastMessage?.attachment?.url) {
                  const attachmentType = conv.lastMessage.attachment?.resourceType;
                  const attachmentMime = conv.lastMessage.attachment?.mimeType || "";
                  const attachmentFileName = (conv.lastMessage.attachment?.fileName || "").toLowerCase();
                  const fallbackAudioByName = (!attachmentMime || attachmentMime === "application/octet-stream") &&
                    /\.(mp3|m4a|wav|ogg|webm|aac)$/i.test(attachmentFileName);
                  const isLikelyVoiceNote = attachmentFileName.startsWith("voice-message-");
                  const isAudioAttachment = attachmentType === "audio" ||
                    attachmentMime.startsWith("audio/") ||
                    fallbackAudioByName ||
                    (isLikelyVoiceNote && attachmentMime.includes("webm"));

                  if (isAudioAttachment) {
                    return (
                      <span className="inline-flex items-center gap-1.5 text-emerald-600">
                        <FiMic className="w-3.5 h-3.5" />
                        Voice message
                      </span>
                    );
                  }
                  if (attachmentType === "image") {
                    return (
                      <span className="inline-flex items-center gap-1.5 text-blue-600">
                        <FiImage className="w-3.5 h-3.5" />
                        Photo
                      </span>
                    );
                  }
                  if (attachmentType === "video") {
                    return (
                      <span className="inline-flex items-center gap-1.5 text-purple-600">
                        <FiVideo className="w-3.5 h-3.5" />
                        Video
                      </span>
                    );
                  }
                  return (
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <FiPaperclip className="w-3.5 h-3.5" />
                      File
                    </span>
                  );
                }

                if (conv.lastMessage?.sharedPost) {
                  return (
                    <span className="inline-flex items-center gap-1.5">
                      <FiImage className="w-3.5 h-3.5" />
                      Shared a post
                    </span>
                  );
                }

                if (conv.lastMessage?.sharedStory) {
                  return (
                    <span className="inline-flex items-center gap-1.5">
                      <FiCamera className="w-3.5 h-3.5" />
                      Shared a story
                    </span>
                  );
                }

                if (conv.lastMessage?.sharedProfile) {
                  return (
                    <span className="inline-flex items-center gap-1.5">
                      <FiUsers className="w-3.5 h-3.5" />
                      Shared a profile
                    </span>
                  );
                }

                if (isUnavailableSharedStory) {
                  return (
                    <span className="inline-flex items-center gap-1.5 text-gray-500">
                      <FiCamera className="w-3.5 h-3.5" />
                      Story unavailable
                    </span>
                  );
                }

                return `${textPrefix}${conv.lastMessage?.text || 'Start a conversation'}`;
              };

              return (
                <div
                  key={conv._id}
                  className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 border-l-3 border-l-indigo-600'
                    : 'hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                  onClick={() => onSelectChat(conv)}
                >
                  <div className="relative">
                    <img
                      src={displayAvatar}
                      className="w-12 h-12 rounded-full object-cover"
                      alt={displayName}
                    />
                    {conv.isGroup && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-white">
                        <FiUsers className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center gap-2">
                      <p className={`font-semibold truncate ${unreadCount > 0 ? 'text-gray-900 dark:text-gray-100 font-bold' : 'text-gray-800 dark:text-gray-200'}`}>
                        {displayName}
                      </p>
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                        {formatTime(conv.lastMessage?.createdAt || conv.updatedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm truncate flex-1 ${unreadCount > 0 ? 'text-gray-900 dark:text-gray-100 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                        {renderLastMessagePreview()}
                      </p>
                      {unreadCount > 0 && (
                        <div className="flex items-center justify-center min-w-max h-5 px-2 bg-indigo-600 text-white rounded-full flex-shrink-0">
                          <span className="text-xs font-bold">{unreadCount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500 dark:text-gray-400">
              <p>No {activeTab === 'group' ? 'groups' : 'chats'} yet</p>
              {activeTab === 'group' ? (
                <button
                  onClick={onCreateGroup}
                  className="mt-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  Create a group
                </button>
              ) : (
                <button
                  onClick={onNewChat}
                  className="mt-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  Start a new chat
                </button>
              )}
            </div>
          )
        )}
      </div>
    </div>
  )
}

export default ChatBox
