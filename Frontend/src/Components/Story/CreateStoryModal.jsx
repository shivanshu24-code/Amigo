import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../../Store/AuthStore.js";
import { useStoryStore } from "../../Store/StoryStore.js";
import { X, AtSign, Check, Archive, Star } from "lucide-react";
import api from "../../Services/Api.js";

const CreateStoryModal = ({ onClose }) => {
    const user = useAuthStore((state) => state.user);
    const { initialStoryData, createStory } = useStoryStore();
    const token = localStorage.getItem("token");
    const [isUploading, setIsUploading] = useState(false);
    const previewRef = useRef(null);

    // Modal state
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(initialStoryData?.media || null);
    const [isArchived, setIsArchived] = useState(initialStoryData?.isArchived || false);
    const [caption, setCaption] = useState(initialStoryData?.caption || "");
    const [visibility, setVisibility] = useState(initialStoryData?.visibility || "Everyone");

    // Mentions state
    const [friends, setFriends] = useState([]);
    const [selectedMentions, setSelectedMentions] = useState([]);
    const [showMentions, setShowMentions] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [draggingMention, setDraggingMention] = useState(null);

    const previewUrl = Array.isArray(preview) ? preview[0] : preview;
    const isPreviewVideo =
        !!selectedFile?.type?.startsWith("video/") ||
        (typeof previewUrl === "string" &&
            (previewUrl.includes("/video/upload/") || /\.(mp4|mov|webm|m4v|ogg)(\?|$)/i.test(previewUrl)));

    useEffect(() => {
        fetchFriends();
    }, []);

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
    };

    const handleUpload = async () => {
        // If we have a file, it's a new upload. 
        // If no file but we have a preview (string), it's a reshare.
        if (!selectedFile && !preview) return;

        const formData = new FormData();
        if (selectedFile) {
            formData.append("media", selectedFile);
        } else {
            // Reshare case: send the media URL
            formData.append("media", preview);
        }

        formData.append("caption", caption);
        formData.append("isArchived", isArchived);
        formData.append("visibility", visibility);

        if (selectedMentions.length > 0) {
            const mentionsData = selectedMentions.map(m => ({
                userId: m._id,
                x: m.x,
                y: m.y
            }));
            formData.append("mentions", JSON.stringify(mentionsData));
        }

        setIsUploading(true);
        try {
            const result = await createStory(formData);
            if (result.success) {
                onClose();
            } else {
                alert(result.message || "Upload failed");
            }
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setIsUploading(false);
        }
    };

    const toggleMention = (friend) => {
        setSelectedMentions(prev => {
            const exists = prev.find(m => m._id === friend._id);
            if (exists) {
                return prev.filter(m => m._id !== friend._id);
            }
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

    return (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-2xl w-full max-w-md md:max-w-lg lg:max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded-lg transition-colors">
                        <X size={24} />
                    </button>
                    <h3 className="font-bold text-gray-900">
                        {initialStoryData ? "Reshare Story" : "New Story"}
                    </h3>
                    <button
                        onClick={handleUpload}
                        disabled={isUploading || (!selectedFile && !preview)}
                        className="bg-blue-600 text-white px-4 py-1.5 rounded-full font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {isUploading ? "Posting..." : "Share"}
                    </button>
                </div>

                {/* Media Preview / Selector */}
                <div
                    ref={previewRef}
                    onMouseMove={handleDragMove}
                    onMouseUp={handleDragEnd}
                    onMouseLeave={handleDragEnd}
                    onTouchMove={handleDragMove}
                    onTouchEnd={handleDragEnd}
                    className="relative bg-black aspect-[9/16] max-h-[450px] w-full overflow-hidden touch-none flex items-center justify-center group"
                >
                    {previewUrl ? (
                        <>
                            {!isPreviewVideo && (
                                <img
                                    src={previewUrl}
                                    alt="Story preview blur"
                                    className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-60 scale-110"
                                />
                            )}
                            {isPreviewVideo ? (
                                <video
                                    src={previewUrl}
                                    className="relative w-full h-full object-contain z-10 shadow-2xl"
                                    controls
                                    muted
                                    autoPlay
                                    loop
                                    playsInline
                                />
                            ) : (
                                <img
                                    src={previewUrl}
                                    alt="Story preview"
                                    className="relative w-full h-full object-contain z-10 shadow-2xl"
                                />
                            )}

                            {!initialStoryData && (
                                <label className="absolute inset-0 z-20 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                    <span className="bg-white/90 backdrop-blur text-gray-900 px-4 py-2 rounded-full text-sm font-semibold shadow-lg">Change Media</span>
                                    <input type="file" accept="image/*,video/*" hidden onChange={handleFileSelect} />
                                </label>
                            )}
                        </>
                    ) : (
                        <label className="flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-blue-500 transition-colors w-full h-full">
                            <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center mb-4 active:scale-95 transition-transform">
                                <X size={32} className="rotate-45" />
                            </div>
                            <p className="font-bold text-sm">Tap to select media</p>
                            <input type="file" accept="image/*,video/*" hidden onChange={handleFileSelect} />
                        </label>
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
                            className="bg-black/60 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-full flex items-center gap-1.5 select-none transition-all shadow-lg border border-white/10 active:scale-90"
                        >
                            <AtSign size={10} className="text-white/80" />
                            <span className="font-medium">{m.username}</span>
                        </div>
                    ))}
                </div>

                {/* Controls */}
                <div className="p-4 space-y-4">
                    <input
                        type="text"
                        placeholder="Add a caption..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                        maxLength={500}
                    />

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${isArchived ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                                <Archive size={18} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-900">Archive Story</p>
                                <p className="text-[10px] text-gray-500 leading-tight">Post privately to your archive</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsArchived(!isArchived)}
                            className={`w-10 h-5 rounded-full relative transition-colors duration-300 shadow-inner ${isArchived ? 'bg-blue-600' : 'bg-gray-300'}`}
                        >
                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${isArchived ? 'translate-x-5' : ''}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${visibility === "CloseFriends" ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                                <Star size={18} className={visibility === "CloseFriends" ? "fill-green-600" : ""} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-900">Close Friends Only</p>
                                <p className="text-[10px] text-gray-500 leading-tight">Only people on your list can see this</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setVisibility(visibility === "Everyone" ? "CloseFriends" : "Everyone")}
                            className={`w-10 h-5 rounded-full relative transition-colors duration-300 shadow-inner ${visibility === "CloseFriends" ? 'bg-green-600' : 'bg-gray-300'}`}
                        >
                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${visibility === "CloseFriends" ? 'translate-x-5' : ''}`} />
                        </button>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setShowMentions(!showMentions)}
                            className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-blue-600 transition-colors px-1"
                        >
                            <AtSign size={16} />
                            {selectedMentions.length > 0
                                ? `${selectedMentions.length} friends mentioned`
                                : "Mention friends"
                            }
                        </button>

                        {showMentions && (
                            <div className="mt-2 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-xl max-h-48 overflow-y-auto">
                                <div className="sticky top-0 bg-white p-2 border-b border-gray-50">
                                    <input
                                        type="text"
                                        placeholder="Search friends..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full px-3 py-1.5 text-xs bg-gray-50 rounded-lg focus:outline-none"
                                    />
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {filteredFriends.length === 0 ? (
                                        <p className="p-4 text-xs text-gray-500 text-center">No friends found</p>
                                    ) : (
                                        filteredFriends.map(friend => {
                                            const isSelected = selectedMentions.find(m => m._id === friend._id);
                                            return (
                                                <div
                                                    key={friend._id}
                                                    onClick={() => toggleMention(friend)}
                                                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <img
                                                        src={friend.avatar || `https://ui-avatars.com/api/?name=${friend.username}`}
                                                        alt={friend.username}
                                                        className="w-8 h-8 rounded-full object-cover border border-gray-100"
                                                    />
                                                    <span className="flex-1 text-xs font-semibold text-gray-800">{friend.username}</span>
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
        </div>
    );
};

export default CreateStoryModal;
