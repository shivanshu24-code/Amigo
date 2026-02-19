import { MoreHorizontal, Trash2, Share2, Link2, Edit3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Avatar from "../Avatar";
import { useAuthStore } from "../../Store/AuthStore";
import { useState, useRef, useEffect } from "react";

const PostHeader = ({ author, time, postId }) => {
    const navigate = useNavigate();
    const { avatar, username, firstname, lastname, _id: authorId } = author || {};
    const [showDropdown, setShowDropdown] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingPost, setDeletingPost] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleConfirmDeletePost = async () => {
        if (deletingPost) return;
        setDeletingPost(true);
        const { usePostStore } = await import("../../Store/PostStore.js");
        await usePostStore.getState().deletePost(postId);
        setDeletingPost(false);
        setShowDeleteConfirm(false);
    };

    return (
        <div className="flex items-center gap-3 px-4 py-3 relative">
            {/* Avatar with ring */}
            <div
                onClick={() => authorId && navigate(`/profile/${authorId}`)}
                className="relative cursor-pointer group"
            >
                <Avatar
                    src={avatar}
                    name={firstname ? `${firstname} ${lastname}` : username}
                    className="w-11 h-11 rounded-full border-2 border-white text-xs"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
            </div>

            {/* User Info */}
            <div
                onClick={() => authorId && navigate(`/profile/${authorId}`)}
                className="flex-1 min-w-0 cursor-pointer"
            >
                <p className="font-semibold text-sm text-gray-900 truncate hover:text-indigo-600 transition-colors">
                    {username || firstname || "User"}
                </p>
                <p className="text-xs text-gray-400">
                    {time}
                </p>
            </div>

            {/* More Button */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="p-2 hover:bg-gray-50 rounded-full transition"
                >
                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                </button>

                {showDropdown && (
                    <ul className="absolute right-0 top-12 z-[50] menu p-2 shadow-2xl bg-white rounded-2xl w-52 border border-gray-100 flex flex-col gap-1">
                        <li>
                            <button className="flex items-center gap-3 text-gray-600 hover:bg-gray-50 py-3 px-4 w-full text-left rounded-xl transition">
                                {/* <Share2 className="w-4 h-4" /> */}
                                <span className="text-sm font-medium">Not Interested</span>
                            </button>
                        </li>
                        <li>
                            <button className="flex items-center gap-3 text-gray-600 hover:bg-gray-50 py-3 px-4 w-full text-left rounded-xl transition">
                                {/* <Link2 className="w-4 h-4" /> */}
                                <span className="text-sm font-medium">Report</span>
                            </button>
                        </li>

                        {authorId === useAuthStore.getState().user?._id && (
                            <>
                                <div className="h-px bg-gray-100 my-1 mx-2"></div>
                                <li>
                                    <button
                                        onClick={() => {
                                            // Handle edit logic here or navigate to edit
                                            console.log("Edit post", postId);
                                            setShowDropdown(false);
                                        }}
                                        className="flex items-center gap-3 text-indigo-600 hover:bg-indigo-50 py-3 px-4 w-full text-left rounded-xl transition"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                        <span className="text-sm font-medium">Edit Post</span>
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => {
                                            setShowDeleteConfirm(true);
                                            setShowDropdown(false);
                                        }}
                                        className="flex items-center gap-3 text-red-600 hover:bg-red-50 py-3 px-4 w-full text-left rounded-xl transition"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span className="text-sm font-medium">Delete Post</span>
                                    </button>
                                </li>
                            </>
                        )}
                    </ul>
                )}
            </div>

            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => !deletingPost && setShowDeleteConfirm(false)}
                    />
                    <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 p-5">
                        <h3 className="text-base font-semibold text-gray-900">Delete post?</h3>
                        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                            Do you really want to delete this post?
                        </p>
                        <div className="mt-4 flex items-center justify-end gap-2">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={deletingPost}
                                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDeletePost}
                                disabled={deletingPost}
                                className="px-3 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                            >
                                {deletingPost ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostHeader;
