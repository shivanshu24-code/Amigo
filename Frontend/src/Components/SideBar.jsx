import React from "react";
import Menu from "./Menu.jsx";
import { useNavigate } from "react-router-dom";
import { account, home, search, conversation, wheel } from "../assets/assets.js";
import { usePostStore } from "../Store/PostStore.js";
import { useAuthStore } from '../Store/AuthStore.js'
const SideBar = () => {
  const navigate = useNavigate();
  const { openCreatePostModal } = usePostStore();
  const { user } = useAuthStore()
  return (
    <div
      className="
        group
        h-full
        bg-white
        border-r
        border-gray-200
        flex
        flex-col
        transition-all
        duration-300
        ease-in-out
        w-[65px]
        hover:w-[240px]
        overflow-hidden
        
      "
    >


      {/* MENU ITEMS */}
      <div className="flex flex-col gap-1 mt-4 px-2 flex-1 ">
        <Menu icon={home} label="Feed" onClick={() => navigate("/feed")} />
        {/* <Menu icon={search} label="Discover" /> */}
        <Menu icon={search} label="Users" onClick={() => navigate("/users")} />
        <Menu icon={conversation} label="Chat" onClick={() => navigate("/chat")} />
        <Menu icon={wheel} label="Settings" />
        <Menu icon={account} label="Profile" onClick={() => navigate("/profile")} />

        {/* CREATE POST - visible on hover */}
        <button
          onClick={openCreatePostModal}
          className="
            mt-4
            mx-1
            py-2.5
            rounded-xl
            bg-gradient-to-r
            from-indigo-600
            to-purple-600
            text-white
            text-sm
            font-medium
            whitespace-nowrap
            opacity-0
            group-hover:opacity-100
            transition-opacity
            duration-300
            hover:from-indigo-700
            hover:to-purple-700
          "
        >
          Create Post
        </button>
      </div>

      {/* PROFILE AT BOTTOM */}
      <div className="mt-auto border-t border-gray-100 p-2">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
          <img
            src={user?.avatar || "/profile.jpg"}
            alt="profile"
            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
          />
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <p className="text-sm font-medium text-gray-800 truncate">{user?.username || "User"}</p>
            <p className="text-xs text-gray-500 truncate">View profile</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideBar;
