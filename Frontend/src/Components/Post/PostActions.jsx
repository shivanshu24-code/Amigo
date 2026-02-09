import { Smile, MapPin, Users, ChevronDown, Globe, X, UserCheck, ShieldCheck } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";
import { motion, AnimatePresence } from "framer-motion";

const PostActions = ({
  visibility,
  setVisibility,
  onEmojiSelect,
  location,
  setLocation
}) => {
  const [showEmoji, setShowEmoji] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const visibilityRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (visibilityRef.current && !visibilityRef.current.contains(event.target)) {
        setShowVisibilityMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 📍 Get current location
  const fetchLocation = () => {
    if (!navigator.geolocation) return;

    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        // Optional: reverse geocoding (OpenStreetMap – free)
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const data = await res.json();

        setLocation(data.display_name?.split(",")[0] || "Current location"); // Shortened location
        setLoadingLocation(false);
      },
      () => setLoadingLocation(false)
    );
  };

  const visibilityOptions = [
    { value: "Connection", label: "Connections", icon: Users, description: "Your mutual connections" },
    { value: "Followers", label: "Followers", icon: UserCheck, description: "People who follow you" },
    { value: "Public", label: "Public", icon: Globe, description: "Anyone on Amigo" },
  ];

  const currentVisibility = visibilityOptions.find(opt => opt.value === visibility) || visibilityOptions[0];

  return (
    <>
      <div className="flex items-center justify-between border-t border-gray-100 pt-3 relative">

        {/* 😀 Emoji Button */}
        <button
          onClick={() => setShowEmoji(true)}
          className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors bg-gray-50 text-gray-600 hover:bg-amber-50 hover:text-amber-600 border border-transparent hover:border-amber-200`}
        >
          <Smile size={18} />
          <span className="hidden sm:inline">Feeling</span>
        </button>

        {/* 📍 Location Button */}
        <button
          onClick={fetchLocation}
          className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors ${location
            ? "bg-blue-50 text-blue-600 border border-blue-100"
            : "bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-200"
            }`}
        >
          <MapPin size={18} className={location ? "fill-current" : ""} />
          <span className="max-w-[100px] truncate hidden sm:inline">
            {loadingLocation ? "Locating..." : location || "Location"}
          </span>
          <span className="sm:hidden">
            {location ? "Location" : ""}
          </span>
        </button>

        {/* 👁️ Custom Visibility Selector */}
        <div className="relative" ref={visibilityRef}>
          <button
            onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200 active:scale-95"
          >
            <currentVisibility.icon size={16} className="text-indigo-500" />
            <span className="w-[85px] sm:w-auto text-left truncate">
              {currentVisibility.label}
            </span>
            <ChevronDown
              size={14}
              className={`text-gray-400 transition-transform duration-200 ${showVisibilityMenu ? 'rotate-180' : ''}`}
            />
          </button>

          <AnimatePresence>
            {showVisibilityMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 bottom-full mb-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden"
              >
                <div className="px-3 py-1.5 mb-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Who can see this?</p>
                </div>
                {visibilityOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setVisibility(option.value);
                      setShowVisibilityMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors group ${visibility === option.value
                        ? "bg-indigo-50"
                        : "hover:bg-gray-50"
                      }`}
                  >
                    <div className={`p-1.5 rounded-lg transition-colors ${visibility === option.value
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-gray-100 text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-500"
                      }`}>
                      <option.icon size={16} />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${visibility === option.value ? "text-indigo-600" : "text-gray-700"
                        }`}>
                        {option.label}
                      </p>
                      <p className="text-[10px] text-gray-400 leading-tight">
                        {option.description}
                      </p>
                    </div>
                    {visibility === option.value && (
                      <ShieldCheck size={14} className="ml-auto text-indigo-500" />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 😀 Emoji Picker Modal (Centered) */}
      {showEmoji && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowEmoji(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowEmoji(false)}
              className="absolute top-2 right-2 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full z-10 transition-colors"
            >
              <X size={18} className="text-gray-600" />
            </button>
            <EmojiPicker
              onEmojiClick={(e) => {
                onEmojiSelect(e.emoji);
                setShowEmoji(false);
              }}
              theme="light"
              lazyLoadEmojis={true}
              width={320}
              height={400}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default PostActions;
