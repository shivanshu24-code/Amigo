import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../../Store/AuthStore.js";
import Avatar from "../Avatar.jsx";
import { X, AtSign, Check } from "lucide-react";
import api from "../../Services/Api.js";

const AddStory = ({ onUploaded, myStories, onViewStory }) => {
  const user = useAuthStore((state) => state.user);
  const token = localStorage.getItem("token");
  const [isUploading, setIsUploading] = useState(false);
  const previewRef = useRef(null);

  // Story creation modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");

  // Mentions state
  const [friends, setFriends] = useState([]);
  const [selectedMentions, setSelectedMentions] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [draggingMention, setDraggingMention] = useState(null);

  // Fetch friends when modal opens
  useEffect(() => {
    if (showModal) {
      fetchFriends();
    }
  }, [showModal]);

  const fetchFriends = async () => {
    try {
      const res = await api.get("/friends");
      setFriends(res.data.data || res.data.friends || []);
    } catch (err) {
      console.error("Failed to fetch friends:", err);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setShowModal(true);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("media", selectedFile);
    formData.append("caption", caption);
    if (selectedMentions.length > 0) {
      // Send array of { userId: id, x: percent, y: percent }
      const mentionsData = selectedMentions.map(m => ({
        userId: m._id,
        x: m.x,
        y: m.y
      }));
      formData.append("mentions", JSON.stringify(mentionsData));
    }

    setIsUploading(true);
    try {
      await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/story`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      await onUploaded();
      closeModal();
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedFile(null);
    setPreview(null);
    setCaption("");
    setSelectedMentions([]);
    setShowMentions(false);
    setSearchTerm("");
  };

  const toggleMention = (friend) => {
    setSelectedMentions(prev => {
      const exists = prev.find(m => m._id === friend._id);
      if (exists) {
        return prev.filter(m => m._id !== friend._id);
      }
      // Initialize with default center-ish position (x: 50, y: 70)
      return [...prev, { ...friend, x: 50, y: 70 }];
    });
  };

  const handleDragStart = (id, e) => {
    e.stopPropagation();
    setDraggingMention(id);
  };

  const handleDragMove = (e) => {
    if (!draggingMention || !previewRef.current) return;

    const rect = previewRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    let x = ((clientX - rect.left) / rect.width) * 100;
    let y = ((clientY - rect.top) / rect.height) * 100;

    // Constrain within bounds
    x = Math.max(5, Math.min(95, x));
    y = Math.max(5, Math.min(95, y));

    setSelectedMentions(prev => prev.map(m =>
      m._id === draggingMention ? { ...m, x, y } : m
    ));
  };

  const handleDragEnd = () => {
    setDraggingMention(null);
  };

  const filteredFriends = friends.filter(f =>
    f.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      {/* Story Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
              <h3 className="font-semibold text-gray-900">New Story</h3>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="text-blue-600 font-semibold hover:text-blue-700 disabled:opacity-50"
              >
                {isUploading ? "Posting..." : "Share"}
              </button>
            </div>

            {/* Media Preview */}
            <div
              ref={previewRef}
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
              className="relative bg-black aspect-[9/16] max-h-[400px] w-full overflow-hidden touch-none"
            >
              {preview && (
                <>
                  {/* Blurred Background */}
                  <img
                    src={preview}
                    alt="Story preview blur"
                    className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-60 scale-110"
                  />
                  {/* Main Content */}
                  <img
                    src={preview}
                    alt="Story preview"
                    className="relative w-full h-full object-contain z-10"
                  />
                </>
              )}

              {/* Selected mentions overlay */}
              {selectedMentions.map(m => (
                <div
                  key={m._id}
                  onMouseDown={(e) => handleDragStart(m._id, e)}
                  onTouchStart={(e) => handleDragStart(m._id, e)}
                  style={{
                    position: 'absolute',
                    left: `${m.x}%`,
                    top: `${m.y}%`,
                    transform: 'translate(-50%, -50%)',
                    cursor: draggingMention === m._id ? 'grabbing' : 'grab',
                    zIndex: 20
                  }}
                  className="bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1.5 rounded-full flex items-center gap-1.5 select-none transition-shadow hover:shadow-lg active:scale-95"
                >
                  <AtSign size={12} className="text-white/80" />
                  <span className="font-medium">{m.username}</span>
                </div>
              ))}
            </div>

            {/* Caption & Mentions */}
            <div className="p-4 space-y-3">
              {/* Caption Input */}
              <input
                type="text"
                placeholder="Add a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                maxLength={500}
              />

              {/* Add Mentions Button */}
              <button
                onClick={() => setShowMentions(!showMentions)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                <AtSign size={16} />
                {selectedMentions.length > 0
                  ? `${selectedMentions.length} mentioned`
                  : "Mention friends"
                }
              </button>

              {/* Friends list for mentions */}
              {showMentions && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <input
                    type="text"
                    placeholder="Search friends..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 text-sm border-b border-gray-100 focus:outline-none"
                  />
                  <div className="max-h-40 overflow-y-auto">
                    {filteredFriends.length === 0 ? (
                      <p className="p-3 text-xs text-gray-500 text-center">No friends found</p>
                    ) : (
                      filteredFriends.map(friend => {
                        const isSelected = selectedMentions.find(m => m._id === friend._id);
                        return (
                          <div
                            key={friend._id}
                            onClick={() => toggleMention(friend)}
                            className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                              }`}
                          >
                            <img
                              src={friend.avatar || `https://ui-avatars.com/api/?name=${friend.username}`}
                              alt={friend.username}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <span className="flex-1 text-sm text-gray-800">{friend.username}</span>
                            {isSelected && <Check size={16} className="text-blue-600" />}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddStory;

