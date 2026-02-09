import React from 'react'
import { FiSearch, FiEdit } from "react-icons/fi";

const ChatBox = ({ conversations, friends, showFriendsList, onSelectChat, onNewChat, currentChatId, loading }) => {
  const listToShow = showFriendsList ? friends : conversations;

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
          <FiEdit
            className='w-5 h-5 text-indigo-600 cursor-pointer hover:text-indigo-700 transition-colors'
            onClick={onNewChat}
            title="New chat"
          />
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
          conversations && conversations.length > 0 ? (
            conversations.map(conv => {
              const isSelected = currentChatId === conv.friend?._id;
              const hasUnread = false; // TODO: Track unread status

              return (

                <div
                  key={conv._id}
                  className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${isSelected
                    ? 'bg-indigo-50 border-l-3 border-l-indigo-600'
                    : 'hover:bg-gray-50'
                    }`}
                  onClick={() => onSelectChat(conv.friend)}
                >
                  <div className="relative">
                    <img
                      src={conv.friend?.avatar || `https://ui-avatars.com/api/?name=${conv.friend?.username}&background=random&size=48`}
                      className="w-12 h-12 rounded-full object-cover"
                      alt={conv.friend?.username}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className={`font-semibold ${hasUnread ? 'text-gray-900' : 'text-gray-800'}`}>
                        {conv.friend?.username}
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
                            : (conv.lastMessage?.text || (conv.lastMessage?.sharedPost ? '📷 Shared a post' : (conv.lastMessage?.sharedStory ? '📸 Shared a story' : 'Start a conversation')))}
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
              <p>No conversations yet</p>
              <button
                onClick={onNewChat}
                className="mt-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                Start a new chat
              </button>
            </div>
          )
        )}
      </div>
    </div>
  )
}

export default ChatBox
