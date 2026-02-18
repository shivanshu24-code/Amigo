import { useState, useRef } from "react";
import { useAuthStore } from "../../Store/AuthStore.js";
import { useStoryStore } from "../../Store/StoryStore.js";
import Avatar from "../Avatar.jsx";
import { Archive } from "lucide-react";

const AddStory = ({ onUploaded, myStories, onViewStory }) => {
  const user = useAuthStore((state) => state.user);
  const { openCreateStoryModal } = useStoryStore();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Use global store to open modal
    openCreateStoryModal();
  };

  const hasStory = myStories && myStories.length > 0;

  return (
    <>
      <div className="flex flex-col items-center relative cursor-pointer group">
        <div className="relative">
          <div
            onClick={() => !isUploading && (hasStory ? onViewStory() : document.getElementById('story-upload').click())}
            className={`p-0.5 rounded-full ${hasStory ? 'bg-blue-400' : 'border border-gray-200'}`}
          >
            <Avatar
              src={user?.avatar}
              name={user?.firstname ? `${user.firstname} ${user.lastname}` : user?.username}
              className={`w-16 h-16 rounded-full border-2 border-white text-xl ${isUploading ? 'opacity-50' : ''}`}
            />
          </div>

          {/* Loading Spinner Ring */}
          {isUploading && (
            <div className="absolute inset-0 -m-1 rounded-full border-4 border-gray-200 border-t-blue-500 animate-spin z-10 pointer-events-none"></div>
          )}

          {/* Upload Button overlay */}
          {!isUploading && (
            <label
              htmlFor="story-upload"
              className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs border-2 border-white cursor-pointer hover:bg-blue-700 transition"
              onClick={(e) => e.stopPropagation()}
            >
              +
            </label>
          )}

          <input
            id="story-upload"
            type="file"
            accept="image/*,video/*"
            hidden
            onChange={handleFileSelect}
            disabled={isUploading}
          />
        </div>
        <p className="text-[11px] mt-1 text-gray-700">{isUploading ? "Posting..." : "Your Story"}</p>
      </div>
    </>
  );
};

export default AddStory;
