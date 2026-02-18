import React, { useEffect } from "react";
import { useFriendStore } from "../Store/FriendStore.js";
import { Star, ChevronLeft, Search, UserMinus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Avatar from "../Components/Avatar.jsx";

const CloseFriendsPage = () => {
    const navigate = useNavigate();
    const { closeFriends, fetchCloseFriends, toggleCloseFriend, loading } = useFriendStore();

    useEffect(() => {
        fetchCloseFriends();
    }, []);

    const handleRemove = async (userId) => {
        await toggleCloseFriend(userId);
    };

    return (
        <div className="h-full bg-white flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 px-4 py-4 border-b border-gray-100">
                <button
                    onClick={() => navigate("/settings")}
                    className="p-2 hover:bg-gray-50 rounded-full transition-colors"
                >
                    <ChevronLeft size={24} className="text-gray-600" />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Close Friends</h1>
                    <p className="text-xs text-gray-500">We don't send notifications when you edit this list.</p>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : closeFriends.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Star className="w-10 h-10 text-green-500 fill-green-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Build your list</h3>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto">
                            Add your closest friends to share moments exclusively with them.
                        </p>
                        <button
                            onClick={() => navigate("/users")}
                            className="mt-6 px-6 py-2.5 bg-gray-900 text-white rounded-full font-bold text-sm hover:bg-black transition shadow-lg"
                        >
                            Find Friends
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">
                            {closeFriends.length} {closeFriends.length === 1 ? 'Person' : 'People'}
                        </p>
                        {closeFriends.map((friend) => (
                            <div
                                key={friend._id || friend}
                                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar
                                        src={friend.avatar}
                                        name={friend.firstname ? `${friend.firstname} ${friend.lastname}` : friend.username}
                                        className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                                    />
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">
                                            {friend.firstname && friend.lastname
                                                ? `${friend.firstname} ${friend.lastname}`
                                                : friend.username
                                            }
                                        </p>
                                        <p className="text-xs text-gray-500">@{friend.username}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemove(friend._id || friend)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-transparent hover:border-red-100"
                                    title="Remove from Close Friends"
                                >
                                    <UserMinus size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CloseFriendsPage;
