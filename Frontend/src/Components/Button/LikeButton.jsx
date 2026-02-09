import { Heart } from "lucide-react";

const LikeButton = ({ liked, likesCount, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1 select-none"
    >
      <Heart
        size={18}
        className={`transition ${
          liked
            ? "text-red-500 fill-red-500"
            : "text-gray-600"
        }`}
      />
      <span className="text-sm font-medium">
        {likesCount}
      </span>
    </button>
  );
};

export default LikeButton;
