import { Repeat } from "lucide-react";

const RepostButton = ({ onRepost }) => {
  return (
    <button
      onClick={onRepost}
      className="flex items-center gap-1 text-gray-600 hover:text-green-600"
    >
      <Repeat size={20} />
      Repost
    </button>
  );
};

export default RepostButton;
