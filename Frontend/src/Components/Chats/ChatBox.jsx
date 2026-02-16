import React from 'react'
import { FiSearch, FiEdit, FiUsers } from "react-icons/fi";

const ChatBox = ({ conversations, friends, showFriendsList, onSelectChat, onNewChat, onCreateGroup, currentChatId, loading }) => {
  const [activeTab, setActiveTab] = React.useState('direct');

  const filteredConversations = conversations?.filter(c => {
    if (activeTab === 'group') return c.isGroup;
    return !c.isGroup;
  });

  const listToShow = showFriendsList ? friends : filteredConversations;

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
    <div className='bg-white w-full lg:w-[320px] border-r border-gray-200 h-full flex flex-col'>
      {/* Header */}
      <div className='p-5 pb-3'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className="font-bold text-3xl text-gray-900">Chats</h2>
          <div className="flex items-center gap-3">
            <FiUsers
              className='w-5 h-5 text-indigo-600 cursor-pointer hover:text-white hover:bg-indigo-600 rounded-full transition-all'
              onClick={onCreateGroup}
              title="Create group"
            />
            <FiEdit
              className='w-5 h-5 text-indigo-600 cursor-pointer hover:text-indigo-700 transition-colors'
              onClick={onNewChat}
              title="New chat"
            />
          </div>
        </div>

        {/* Search Bar */}
        <div className='relative'>
          <FiSearch className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
          <input
            type="text"
            placeholder="Search in chats"
            className='w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all'
          />
        </div>
        {/* Tabs - Only show when not selecting friends */}
        {!showFriendsList && (
          <div className="flex px-5 space-x-4 border-b border-gray-100 items-center justify-between">
            <button
              onClick={() => setActiveTab('direct')}
              className={`pb-2 mt-4 text-sm font-medium transition-colors relative ${activeTab === 'direct' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Chats
              {activeTab === 'direct' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('group')}
              className={`pb-2 mt-4 text-sm font-medium transition-colors relative ${activeTab === 'group' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
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
          // 🔄 Loading Skeleton
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
          // Friends List for New Chat
          friends && friends.length > 0 ? (
            friends.map(friend => (
              <div
                key={friend._id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-indigo-50 cursor-pointer transition-colors"
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
                  <p className="font-semibold text-gray-900">{friend.username}</p>
                  <p className="text-gray-500 text-sm truncate">Start a conversation</p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <p>No friends yet</p>
              <p className="text-sm mt-1">Add friends to start chatting</p>
            </div>
          )
        ) : (
          // Conversations List
          filteredConversations && filteredConversations.length > 0 ? (
            filteredConversations.map(conv => {
              const isSelected = currentChatId === conv._id ||
                (!conv.isGroup && currentChatId === conv.friend?._id);
              const hasUnread = false; // TODO: Track unread status

              const displayName = conv.isGroup ? conv.groupName : conv.friend?.username;
              const displayAvatar = conv.isGroup
                ? (conv.groupAvatar || `https://ui-avatars.com/api/?name=${conv.groupName}&background=indigo&color=fff&size=48`)
                : (conv.friend?.avatar || `https://ui-avatars.com/api/?name=${conv.friend?.username}&background=random&size=48`);

              return (
                <div
                  key={conv._id}
                  className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${isSelected
                    ? 'bg-indigo-50 border-l-3 border-l-indigo-600'
                    : 'hover:bg-gray-50'
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
                    <div className="flex justify-between items-center">
                      <p className={`font-semibold truncate ${hasUnread ? 'text-gray-900' : 'text-gray-800'}`}>
                        {displayName}
                      </p>
                      <span className="text-xs text-gray-400">
                        {formatTime(conv.lastMessage?.createdAt || conv.updatedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm truncate flex-1 ${hasUnread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                        {conv.lastMessage?.isDeletedForEveryone
                          ? '🗑️ Message deleted'
                          : conv.lastMessage?.isStoryReply
                            ? '📸 Replied to story'
                            : (conv.lastMessage?.sender?._id === 'me' ? 'You: ' : (conv.isGroup && conv.lastMessage?.sender?.username ? `${conv.lastMessage.sender.username}: ` : '')) +
                            (conv.lastMessage?.text || (conv.lastMessage?.sharedPost ? '📷 Shared a post' : (conv.lastMessage?.sharedStory ? '📸 Shared a story' : 'Start a conversation')))}
                      </p>
                      {hasUnread && (
                        <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full flex-shrink-0"></div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
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
