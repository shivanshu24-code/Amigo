import { useUploadStore } from "../../Store/UploadStore";
import { Send } from "lucide-react";

const PostSubmitButton = ({
  caption,
  media,
  visibility,
  emoji,
  onClose,
  aspectRatio
}) => {
  const { startUpload } = useUploadStore();

  const handlePost = () => {
    // Start background upload
    startUpload({
      caption,
      mediaFile: media,
      visibility,
      aspectRatio,
      emoji
    });

    // Close immediately
    onClose?.();
  };

  return (
    <button
      onClick={handlePost}
      className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl hover:opacity-90 hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-200 flex items-center justify-center gap-2 mt-4"
    >
      <Send className="w-5 h-5" />
      <span>Post</span>
    </button>
  );
};

export default PostSubmitButton;
