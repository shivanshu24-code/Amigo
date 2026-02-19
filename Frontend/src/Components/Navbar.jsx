import React, { useState, useRef, useEffect } from "react";
import { Bell, MessageCircle, User, X, UserPlus, Check, LogOut, Settings, Heart, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../Store/ChatStore";
import { useFriendStore } from "../Store/FriendStore";
import { useAuthStore } from "../Store/AuthStore";
import { useNotificationStore } from "../Store/NotificationStore";
import { useThemeStore } from "../Store/ThemeStore";
import Avatar from "./Avatar";

const Navbar = () => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChats, setShowChats] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifRef = useRef(null);
  const chatRef = useRef(null);
  const profileRef = useRef(null);

  const { conversations, fetchConversations, setCurrentChat, setMobileChatOpen, loading } = useChatStore();
  const { pendingRequests, fetchPendingRequests, acceptRequest, rejectRequest } = useFriendStore();
  const { user, logout } = useAuthStore();
  const { notifications, markAllAsRead } = useNotificationStore();
  const { theme, toggleTheme } = useThemeStore();
  const unreadSocialCount = notifications.filter((n) => !n.read).length;

  // Fetch data when dropdowns open
  useEffect(() => {
    fetchPendingRequests(); // Fetch immediately for badge
    if (showChats) {
      fetchConversations();
    }
  }, [showChats]);

  useEffect(() => {
    if (showNotifications) {
      fetchPendingRequests();
      markAllAsRead();
    }
  }, [showNotifications, fetchPendingRequests, markAllAsRead]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (chatRef.current && !chatRef.current.contains(e.target)) {
        setShowChats(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChatClick = (friend) => {
    setCurrentChat(friend);
    setMobileChatOpen(true);
    setShowChats(false);
    navigate("/chat");
  };

  const handleAcceptRequest = async (requestId) => {
    await acceptRequest(requestId);
    fetchPendingRequests();
  };

  const handleRejectRequest = async (requestId) => {
    await rejectRequest(requestId);
    fetchPendingRequests();
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const formatRelativeTime = (dateValue) => {
    const date = new Date(dateValue);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return "now";
    if (diffMin < 60) return `${diffMin}m ago`;

    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;

    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
  };

  return (
    <div className="sticky top-0 z-50 w-full bg-white dark:bg-[#0b0b0b] border-b border-gray-200 dark:border-[#2a2a2a] rounded-lg">
      <div className="flex items-center justify-between px-3 md:px-6 h-16">

        <h1
          onClick={() => navigate("/feed")}
          className="font-extrabold text-3xl md:text-4xl text-gray-900 dark:text-white tracking-tight cursor-pointer select-none"
        >
          Amigo
        </h1>

        <div className="flex items-center gap-6 mr-4">

          {/* NOTIFICATIONS */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              className="relative cursor-pointer bg-transparent p-0 border-0"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowChats(false);
                setShowProfileMenu(false);
              }}
              title="Notifications"
            >
              <Bell className="w-6 h-6 text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white transition" />
              {(pendingRequests?.length > 0 || unreadSocialCount > 0) && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {(pendingRequests?.length || 0) + unreadSocialCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="panel-elevated fixed left-1/2 -translate-x-1/2 top-20 w-[calc(100%-2rem)] max-w-sm md:absolute md:left-auto md:translate-x-0 md:right-0 md:top-auto md:mt-2 md:w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                </div>

                {/* Friend Requests Section */}
                <div className="border-b border-gray-100">
                  <div className="px-4 py-2 bg-gray-50">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                      <UserPlus className="w-4 h-4" /> Friend Requests
                    </h4>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {pendingRequests?.length > 0 ? (
                      pendingRequests.map((req) => (
                        <div key={req._id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                          <Avatar
                            src={req.sender?.avatar}
                            name={req.sender?.firstname ? `${req.sender?.firstname} ${req.sender?.lastname}` : req.sender?.username}
                            className="w-10 h-10 text-xs"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {req.sender?.firstname} {req.sender?.lastname}
                            </p>
                            <p className="text-xs text-gray-500">wants to connect</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAcceptRequest(req._id)}
                              className="p-1.5 bg-purple-600 text-white rounded-full hover:bg-purple-700"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejectRequest(req._id)}
                              className="p-1.5 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="px-4 py-3 text-sm text-gray-500">No pending requests</p>
                    )}
                  </div>
                </div>

                {/* Recent Notifications Section */}
                <div>
                  <div className="px-4 py-2 bg-gray-50">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase">Recent</h4>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-gray-500">No recent activity</p>
                    ) : notifications.map((notif) => (
                      <div key={notif.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notif.type === "like" ? "bg-pink-100 dark:bg-pink-900/40" : "bg-indigo-100 dark:bg-indigo-900/40"}`}>
                          {notif.type === "like" ? (
                            <Heart className="w-5 h-5 text-pink-600" />
                          ) : (
                            <MessageCircle className="w-5 h-5 text-indigo-600" />
                          )}
                        </div>
                        <div
                          className="flex-1"
                          onClick={() => {
                            if (notif.postId) {
                              navigate(`/post/${notif.postId}`);
                              setShowNotifications(false);
                            }
                          }}
                        >
                          <p className="text-sm text-gray-800">{notif.text}</p>
                          <p className="text-xs text-gray-400">{formatRelativeTime(notif.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CHATS */}
          <div className="relative" ref={chatRef}>
            <button
              type="button"
              className="relative cursor-pointer bg-transparent p-0 border-0"
              onClick={() => {
                setShowChats(!showChats);
                setShowNotifications(false);
                setShowProfileMenu(false);
              }}
              title="Chats"
            >
              <MessageCircle className="w-6 h-6 text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white transition" />
              {conversations?.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {conversations.length > 9 ? "9+" : conversations.length}
                </span>
              )}
            </button>

            {/* Chats Dropdown */}
            {showChats && (
              <div className="panel-elevated fixed left-1/2 -translate-x-1/2 top-20 w-[calc(100%-2rem)] max-w-sm md:absolute md:left-auto md:translate-x-0 md:right-0 md:top-auto md:mt-2 md:w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">Recent Chats</h3>
                  <button
                    onClick={() => {
                      setShowChats(false);
                      navigate("/chat");
                    }}
                    className="text-xs text-purple-600 font-medium hover:text-purple-700"
                  >
                    View All
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {loading ? (
                    // Skeleton Loading
                    [1, 2, 3].map((n) => (
                      <div key={n} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                        <div className="w-12 h-12 rounded-full bg-gray-200" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-24" />
                          <div className="h-3 bg-gray-200 rounded w-32" />
                        </div>
                      </div>
                    ))
                  ) : conversations?.length > 0 ? (
                    conversations.slice(0, 5).map((convo) => (
                      <div
                        key={convo.friend?._id || convo._id}
                        onClick={() => handleChatClick(convo.friend)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="relative">
                          <Avatar
                            src={convo.friend?.avatar}
                            name={convo.friend?.username}
                            className="w-12 h-12 text-sm"
                          />
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {convo.friend?.username}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {convo.lastMessage?.content || "Start a conversation"}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {convo.lastMessage?.createdAt
                            ? new Date(convo.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : ""
                          }
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No conversations yet</p>
                      <button
                        onClick={() => {
                          setShowChats(false);
                          navigate("/users");
                        }}
                        className="mt-2 text-sm text-purple-600 font-medium hover:text-purple-700"
                      >
                        Find friends to chat
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* THEME TOGGLE */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-700 dark:text-gray-200"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* PROFILE DROPDOWN */}
          <div className="relative" ref={profileRef}>
            <div
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
                setShowChats(false);
              }}
              className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#1b1b1b] cursor-pointer hover:ring-2 hover:ring-purple-500 transition overflow-hidden"
            >
              <Avatar
                src={user?.avatar}
                name={user?.firstname ? `${user.firstname} ${user.lastname}` : user?.username}
                className="w-full h-full text-xs"
              />
            </div>

            {/* Profile Menu */}
            {showProfileMenu && (
              <div className="panel-elevated fixed left-1/2 -translate-x-1/2 top-20 w-[calc(100%-2rem)] max-w-sm md:absolute md:left-auto md:translate-x-0 md:right-0 md:top-auto md:mt-2 md:w-60 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                  <p className="font-semibold text-gray-900 truncate">{user?.firstname} {user?.lastname}</p>
                  <p className="text-xs text-gray-500 truncate">@{user?.username || "username"}</p>
                </div>
                <div className="p-2">
                  <button onClick={() => { navigate("/profile"); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition">
                    <User className="w-4 h-4" /> Profile
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition"
                  onClick={()=>{navigate("/settings");setShowProfileMenu(false)}}
                  >
                    <Settings className="w-4 h-4"  /> Settings
                  </button>
                  <div className="h-px bg-gray-100 my-1"></div>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Navbar;
