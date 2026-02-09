import { MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Avatar from "../Avatar";

const PostHeader = ({ author, time }) => {
    const navigate = useNavigate();
    const { avatar, username, firstname, lastname, _id: authorId } = author || {};

    return (
        <div className="flex items-center gap-3 px-4 py-3">
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
            <button className="p-2 hover:bg-gray-50 rounded-full transition">
                <MoreHorizontal className="w-5 h-5 text-gray-400" />
            </button>
        </div>
    );
};

export default PostHeader;
