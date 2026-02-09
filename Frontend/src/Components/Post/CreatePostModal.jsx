import { X } from "lucide-react";
import { useState } from "react";
import MediaUploader from "./MediaUploader.jsx";
import PostActions from "./PostActions.jsx";
import PostSubmitButton from "./PostSubmit.jsx";
const CreatePostModal = ({ onClose }) => {
  const [media, setMedia] = useState(null);
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState("Connection");
  const [emoji, setEmoji] = useState("")
  const [locations, setLocation] = useState("")
  const [aspectRatio, setAspectRatio] = useState("1:1")

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

        {/* 🚀 SUBMIT */}
        <PostSubmitButton
          caption={caption}
          media={media}
          visibility={visibility}

          aspectRatio={aspectRatio}
          onClose={onClose}


        >

        </PostSubmitButton>
      </div>
    </div>
  );
};

export default CreatePostModal;
