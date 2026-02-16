import React, { useState } from 'react';
import { FiX, FiUsers, FiSearch, FiCheck } from 'react-icons/fi';
import { useChatStore } from '../../Store/ChatStore';

const CreateGroupModal = ({ isOpen, onClose, friends }) => {
    const { createGroup } = useChatStore();
    const [groupName, setGroupName] = useState('');
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const filteredFriends = friends.filter(friend =>
        friend.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleFriend = (friendId) => {
        if (selectedFriends.includes(friendId)) {
            setSelectedFriends(selectedFriends.filter(id => id !== friendId));
        } else {
            setSelectedFriends([...selectedFriends, friendId]);
        }
    };

    const handleCreate = async () => {
        if (!groupName.trim() || selectedFriends.length === 0) return;

        setLoading(true);
        const result = await createGroup(groupName.trim(), selectedFriends);
        setLoading(false);

        if (result) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white">
                    <div className="flex items-center gap-2">
                        <FiUsers className="w-5 h-5" />
                        <h3 className="font-bold text-lg">Create New Group</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Group Name Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Group Name
                        </label>
                        <input
                            type="text"
                            placeholder="Enter group name..."
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>

                    {/* Friend Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Add Members ({selectedFriends.length})
                        </label>

                        {/* Search in friends */}
                        <div className="relative mb-3">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search friends..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            />
                        </div>

                        {/* Friends list */}
                        <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                            {filteredFriends.length > 0 ? (
                                filteredFriends.map(friend => (
                                    <div
                                        key={friend._id}
                                        onClick={() => toggleFriend(friend._id)}
                                        className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${selectedFriends.includes(friend._id)
                                                ? 'bg-indigo-50'
                                                : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="relative flex-shrink-0">
                                            <img
                                                src={friend.avatar || `https://ui-avatars.com/api/?name=${friend.username}&background=random`}
                                                alt={friend.username}
                                                className="w-10 h-10 rounded-full object-cover shadow-sm"
                                            />
                                            {selectedFriends.includes(friend._id) && (
                                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-white">
                                                    <FiCheck className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-900 text-sm truncate">
                                                {friend.username}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center py-4 text-gray-500 text-sm">No friends found</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={loading || !groupName.trim() || selectedFriends.length === 0}
                        className={`px-6 py-2 rounded-xl text-sm font-bold text-white shadow-lg transition-all ${loading || !groupName.trim() || selectedFriends.length === 0
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-indigo-200'
                            }`}
                    >
                        {loading ? 'Creating...' : 'Create Group'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;
