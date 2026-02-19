import React, { useEffect, useState } from 'react';
import { FiX, FiImage, FiUsers, FiShield, FiLogOut, FiChevronDown, FiChevronUp, FiTrash2 } from 'react-icons/fi';
import { useChatStore } from '../../Store/ChatStore';
import { useAuthStore } from '../../Store/AuthStore';

const ChatDetails = ({ friend, onClose, focusSection = "media", onlySection = null }) => {
    const { fetchSharedMedia, leaveGroup, makeAdmin, removeAdmin, conversations, clearChat } = useChatStore();
    const { user } = useAuthStore();
    const [sharedMedia, setSharedMedia] = useState([]);
    const [mediaLoading, setMediaLoading] = useState(false);
    const [showMembers, setShowMembers] = useState(true);
    const [showMedia, setShowMedia] = useState(true);
    const [confirmLeave, setConfirmLeave] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);
    const [actionLoading, setActionLoading] = useState(null); // tracks which member action is loading
    const membersSectionRef = React.useRef(null);
    const mediaSectionRef = React.useRef(null);

    const isGroup = friend?.isGroup;

    // For groups, get conversation data from the conversations list for fresh admin/participant info
    const groupConv = isGroup
        ? conversations.find(c => c._id === friend._id)
        : null;

    const participants = groupConv?.participants || friend?.participants || [];
    const groupAdmins = groupConv?.groupAdmin || friend?.groupAdmin || [];

    // Check if current user is admin
    const currentUserId = user?._id;
    const isCurrentUserAdmin = isGroup && Array.isArray(groupAdmins) && groupAdmins.some(
        a => {
            const adminId = typeof a === 'object' ? a._id : a;
            return String(adminId) === String(currentUserId);
        }
    );

    // Get the conversation ID for media fetching
    const conversationId = isGroup ? friend._id : friend?.conversationId;

    useEffect(() => {
        if (conversationId) {
            setMediaLoading(true);
            fetchSharedMedia(conversationId).then(data => {
                setSharedMedia(data);
                setMediaLoading(false);
            });
        }
    }, [conversationId]);

    useEffect(() => {
        if (focusSection === "members") {
            setShowMembers(true);
            setTimeout(() => {
                membersSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 0);
        } else if (focusSection === "media") {
            setShowMedia(true);
            setTimeout(() => {
                mediaSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 0);
        }
    }, [focusSection]);

    const handleLeaveGroup = async () => {
        if (!isGroup) return;
        const success = await leaveGroup(friend._id);
        if (success) {
            onClose();
        }
    };

    const handleClearChat = async () => {
        if (!conversationId) return;

        setActionLoading('clearing');
        const success = await clearChat(conversationId);
        setActionLoading(null);

        if (success) {
            setConfirmClear(false);
            onClose(); // Optional: close details panel after clearing
        } else {
            alert("Failed to clear chat");
        }
    };

    const handleMakeAdmin = async (userId) => {
        setActionLoading(userId);
        const success = await makeAdmin(friend._id, userId);
        setActionLoading(null);
        if (!success) {
            alert("Failed to make admin");
        }
    };

    const handleRemoveAdmin = async (userId) => {
        setActionLoading(userId);
        const success = await removeAdmin(friend._id, userId);
        setActionLoading(null);
        if (!success) {
            alert("Failed to remove admin");
        }
    };

    const isAdmin = (userId) => {
        return Array.isArray(groupAdmins) && groupAdmins.some(a => {
            const adminId = typeof a === 'object' ? a._id : a;
            return String(adminId) === String(userId);
        });
    };

    const displayName = isGroup ? friend.groupName : friend?.username;
    const displayAvatar = isGroup
        ? (friend.groupAvatar || `https://ui-avatars.com/api/?name=${friend.groupName}&background=6366f1&color=fff&size=96`)
        : (friend?.avatar || `https://ui-avatars.com/api/?name=${friend?.username}&background=random&size=96`);

    return (
       <div className="w-full md:w-[320px] bg-white border-l border-gray-200 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">
                    {isGroup ? 'Group Info' : 'Chat Details'}
                </h2>
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <FiX className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {/* Profile Section */}
            <div className="flex flex-col items-center py-6 border-b border-gray-100">
                <div className="relative">
                    <img
                        src={displayAvatar}
                        alt={displayName}
                        className="w-20 h-20 rounded-full object-cover border-2 border-indigo-100"
                    />
                    {isGroup && (
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-white">
                            <FiUsers className="w-3.5 h-3.5 text-white" />
                        </div>
                    )}
                </div>
                <h3 className="mt-3 text-lg font-semibold text-gray-900">{displayName}</h3>
                {isGroup && (
                    <p className="text-sm text-gray-500">{participants.length} members</p>
                )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">

                {/* Members Section (group only) */}
                {isGroup && onlySection !== "media" && (
                    <div ref={membersSectionRef} className="border-b border-gray-100">
                        <button
                            className="flex items-center justify-between w-full px-5 py-3 hover:bg-gray-50 transition-colors"
                            onClick={() => setShowMembers(!showMembers)}
                        >
                            <div className="flex items-center gap-2">
                                <FiUsers className="w-4 h-4 text-indigo-600" />
                                <span className="font-medium text-gray-900">Members ({participants.length})</span>
                            </div>
                            {showMembers ? <FiChevronUp className="w-4 h-4 text-gray-400" /> : <FiChevronDown className="w-4 h-4 text-gray-400" />}
                        </button>
                        {showMembers && (
                            <div className="px-3 pb-3 space-y-1">
                                {participants.map(member => {
                                    const memberId = member._id || member;
                                    const memberIsAdmin = isAdmin(memberId);
                                    const isMe = memberId.toString() === currentUserId?.toString();

                                    return (
                                        <div
                                            key={memberId}
                                            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
                                        >
                                            <img
                                                src={member.avatar || `https://ui-avatars.com/api/?name=${member.username}&background=random&size=36`}
                                                alt={member.username}
                                                className="w-9 h-9 rounded-full object-cover"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-sm font-medium text-gray-900 truncate">
                                                        {member.username}{isMe ? ' (You)' : ''}
                                                    </span>
                                                    {memberIsAdmin && (
                                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded text-xs font-medium">
                                                            <FiShield className="w-3 h-3" />
                                                            Admin
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Admin controls */}
                                            {isCurrentUserAdmin && !isMe && (
                                                <div className="flex items-center">
                                                    {memberIsAdmin ? (
                                                        <button
                                                            onClick={() => handleRemoveAdmin(memberId)}
                                                            disabled={actionLoading === memberId}
                                                            className={`text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors ${actionLoading === memberId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            title="Remove admin"
                                                        >
                                                            {actionLoading === memberId ? 'Removing...' : 'Remove Admin'}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleMakeAdmin(memberId)}
                                                            disabled={actionLoading === memberId}
                                                            className={`text-xs px-2 py-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors ${actionLoading === memberId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            title="Make admin"
                                                        >
                                                            {actionLoading === memberId ? 'Making...' : 'Make Admin'}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Shared Media Section */}
                {onlySection !== "members" && (
                <div ref={mediaSectionRef} className="border-b border-gray-100">
                    <button
                        className="flex items-center justify-between w-full px-5 py-3 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowMedia(!showMedia)}
                    >
                        <div className="flex items-center gap-2">
                            <FiImage className="w-4 h-4 text-indigo-600" />
                            <span className="font-medium text-gray-900">
                                Shared Media ({sharedMedia.length})
                            </span>
                        </div>
                        {showMedia ? <FiChevronUp className="w-4 h-4 text-gray-400" /> : <FiChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    {showMedia && (
                        <div className="px-4 pb-4">
                            {mediaLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                </div>
                            ) : sharedMedia.length > 0 ? (
                                <div className="grid grid-cols-3 gap-1.5">
                                    {sharedMedia.map(item => (
                                        <div
                                            key={item._id}
                                            className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                                        >
                                            <img
                                                src={item.media}
                                                alt={item.caption || 'Shared media'}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 text-center py-6">No shared media yet</p>
                            )}
                        </div>
                    )}
                </div>
                )}

                {/* Privacy & Support (Clear Chat) */}
                {!onlySection && (
                <div className="p-4 border-b border-gray-100">
                    <button
                        onClick={() => setConfirmClear(true)}
                        className="flex items-center gap-2 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm"
                    >
                        <FiTrash2 className="w-5 h-5" />
                        Clear Recent Chat
                    </button>
                </div>
                )}

                {/* Leave Group (group only) */}
                {isGroup && !onlySection && (
                    <div className="p-4">
                        {!confirmLeave ? (
                            <button
                                onClick={() => setConfirmLeave(true)}
                                className="flex items-center gap-2 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                            >
                                <FiLogOut className="w-5 h-5" />
                                Leave Group
                            </button>
                        ) : (
                            <div className="space-y-2 pb-4">
                                <p className="text-sm text-gray-600 px-1">Are you sure you want to leave this group?</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleLeaveGroup}
                                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                                    >
                                        Leave
                                    </button>
                                    <button
                                        onClick={() => setConfirmLeave(false)}
                                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {confirmClear && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => actionLoading !== 'clearing' && setConfirmClear(false)}
                    />
                    <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 p-5">
                        <h3 className="text-base font-semibold text-gray-900">Clear recent chat?</h3>
                        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                            This will remove chat history for you only. Other participants can still see the messages.
                        </p>
                        <div className="mt-4 flex items-center justify-end gap-2">
                            <button
                                onClick={() => setConfirmClear(false)}
                                disabled={actionLoading === 'clearing'}
                                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleClearChat}
                                disabled={actionLoading === 'clearing'}
                                className="px-3 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                            >
                                {actionLoading === 'clearing' ? 'Clearing...' : 'Clear'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatDetails;
