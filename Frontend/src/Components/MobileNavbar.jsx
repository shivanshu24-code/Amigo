import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiUsers, FiMessageCircle, FiUser, FiPlus } from 'react-icons/fi';
import { useChatStore } from '../Store/ChatStore';
import { usePostStore } from '../Store/PostStore';
import { useStoryStore } from '../Store/StoryStore';

const MobileNavbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isMobileChatOpen } = useChatStore();
    const { openCreatePostModal } = usePostStore();
    const { viewerOpen } = useStoryStore();

    // Hide when a chat is open or when viewing a story
    const isChatActive = location.pathname === '/chat' && isMobileChatOpen;
    const shouldHide = isChatActive || viewerOpen;

    if (shouldHide) {
        return null;
    }

    const isActive = (path) => location.pathname === path;

    // Common button styles - fixed width to prevent shifting
    const navButtonClass = (path) => `
        flex flex-col items-center justify-center
        w-14 py-2
        rounded-2xl transition-all duration-300
        ${isActive(path) ? 'text-purple-600' : 'text-gray-400 hover:text-gray-600'}
    `;

    return (
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
            <nav className="bg-white rounded-full px-4 py-1 flex items-center justify-between shadow-xl border border-gray-100">
                {/* Home */}
                <button onClick={() => navigate('/feed')} className={navButtonClass('/feed')}>
                    <FiHome className="w-6 h-6" />
                    <span className="text-[10px] mt-0.5 font-medium">Home</span>
                </button>

                {/* Users */}
                <button onClick={() => navigate('/users')} className={navButtonClass('/users')}>
                    <FiUsers className="w-6 h-6" />
                    <span className="text-[10px] mt-0.5 font-medium">Users</span>
                </button>

                {/* Create Post - Center Plus Button */}
                <button
                    onClick={() => navigate('/create-post')}
                    className="
                        flex items-center justify-center
                        w-12 h-12
                        rounded-full
                        bg-gradient-to-br from-purple-600 to-indigo-600
                        text-white
                        shadow-lg shadow-purple-500/40
                        hover:from-purple-700 hover:to-indigo-700
                        transition-all duration-300
                        active:scale-95
                    "
                >
                    <FiPlus className="w-7 h-7" />
                </button>

                {/* Chat */}
                <button onClick={() => navigate('/chat')} className={navButtonClass('/chat')}>
                    <FiMessageCircle className="w-6 h-6" />
                    <span className="text-[10px] mt-0.5 font-medium">Chat</span>
                </button>

                {/* Profile */}
                <button onClick={() => navigate('/profile')} className={navButtonClass('/profile')}>
                    <FiUser className="w-6 h-6" />
                    <span className="text-[10px] mt-0.5 font-medium">Profile</span>
                </button>
            </nav>
        </div>
    );
};

export default MobileNavbar;
