import { X, Archive } from "lucide-react";
import { useState } from "react";
import { usePostStore } from "../../Store/PostStore.js";
import MediaUploader from "./MediaUploader.jsx";
import PostActions from "./PostActions.jsx";
import PostSubmitButton from "./PostSubmit.jsx";
const CreatePostModal = ({ onClose }) => {
  const { initialPostData } = usePostStore();

  const [media, setMedia] = useState(initialPostData?.media || null);
  const [caption, setCaption] = useState(initialPostData?.caption || "");
  const [visibility, setVisibility] = useState(initialPostData?.visibility || "Connection");
  const [emoji, setEmoji] = useState("");
  const [locations, setLocation] = useState("");
  const [aspectRatio, setAspectRatio] = useState(initialPostData?.aspectRatio || "1:1");
  const [isArchived, setIsArchived] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-[500px] bg-white rounded-xl shadow-xl p-4">

        {/* 🧠 HEADER */}
        <div className="flex justify-between items-center border-b pb-2">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-700 to-violet-700 bg-clip-text text-transparent ">Create Post</h2>
          <button onClick={onClose}><X /></button>
        </div>

        {/* 🖼 MEDIA */}
        <div className="mt-4">
          <MediaUploader media={media} setMedia={setMedia} setAspectRatio={setAspectRatio} />
        </div>

        {/* 📝 CAPTION */}
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption..."
          className="w-full mt-3 p-2 border rounded-lg resize-none"
        />

        {/* ⚙️ ACTIONS */}
        <PostActions
          visibility={visibility}
          setVisibility={setVisibility}
          location={locations}
          setLocation={setLocation}
          onEmojiSelect={(emoji) =>
            setCaption(prev => prev + emoji)
          }

        />

        {/* 📦 ARCHIVE TOGGLE */}
        <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isArchived ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-500'}`}>
              <Archive size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Archive directly</p>
              <p className="text-[10px] text-gray-500">Only you can see this post</p>
            </div>
          </div>
          <button
            onClick={() => setIsArchived(!isArchived)}
            className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${isArchived ? 'bg-indigo-600' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${isArchived ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        {/* 🚀 SUBMIT */}
        <PostSubmitButton
          caption={caption}
          media={media}
          visibility={visibility}

          aspectRatio={aspectRatio}
          isArchived={isArchived}
          onClose={onClose}


        >

        </PostSubmitButton>
      </div>
    </div>
  );
};

export default CreatePostModal;
