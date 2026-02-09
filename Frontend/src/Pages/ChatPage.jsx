import React, { useEffect, useState } from 'react'
import ChatBox from '../Components/Chats/ChatBox'
import MainChat from '../Components/Chats/MainChat'
import ChatDetails from '../Components/Chats/ChatDetails'
import { useChatStore } from '../Store/ChatStore'
import { useFriendStore } from '../Store/FriendStore'

const ChatPage = () => {
  const { currentChat, setCurrentChat, fetchConversations, conversations, isMobileChatOpen, setMobileChatOpen, loading } = useChatStore()
  const { friends, fetchFriends } = useFriendStore()

  const [showFriendsList, setShowFriendsList] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    fetchConversations()
    fetchFriends()
    // Reset mobile chat state when entering chat page
    setMobileChatOpen(false)
  }, [])

  const handleSelectChat = (friend) => {
    setCurrentChat(friend)
    setShowFriendsList(false)
    setMobileChatOpen(true) // 👈 open chat on mobile
  }

  const handleNewChat = () => {
    setShowFriendsList(true)
  }

  const toggleDetails = () => {
    setShowDetails(!showDetails)
  }

  const handleBack = () => {
    setMobileChatOpen(false) // 👈 back button closes chat
  }

  return (
    // Use h-full instead of h-screen since we're inside a flex container that already handles height
    <div className="flex h-full w-full bg-gray-100 overflow-hidden">

      {/* Chat List */}
      <div
        className={`
          w-full md:w-[320px] h-full flex-shrink-0
          ${isMobileChatOpen ? 'hidden md:flex' : 'flex'}
        `}
      >
        <ChatBox
          conversations={conversations}
          friends={friends}
          showFriendsList={showFriendsList}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          currentChatId={currentChat?._id}
          loading={loading} // 👈 passing loading state
        />
      </div>

      {/* Main Chat */}
      <div
        className={`
          flex-1 h-full
          ${!isMobileChatOpen ? 'hidden md:flex' : 'flex'}
        `}
      >
        <MainChat
          friend={currentChat}
          onToggleDetails={toggleDetails}
          onBack={handleBack}
        />
      </div>

      {/* Chat Details (desktop only) */}
      {showDetails && currentChat && (
        <div className="hidden lg:flex h-full flex-shrink-0">
          <ChatDetails
            friend={currentChat}
            onClose={() => setShowDetails(false)}
          />
        </div>
      )}
    </div>
  )
}

export default ChatPage
