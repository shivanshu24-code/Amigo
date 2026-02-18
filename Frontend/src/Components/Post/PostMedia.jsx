import { useState } from "react";
import LikeOverlay from "./LikeOverlay.jsx";

const aspectClassMap = {
  "1:1": "aspect-square",
  "4:5": "aspect-[4/5]",
  "9:16": "aspect-[9/16]"
};

const PostMedia = ({ media, onLike,aspectRatio="1:1" }) => {
  const [lastTap, setLastTap] = useState(0);
  const [showHeart, setShowHeart] = useState(false);
  const mediaUrl = Array.isArray(media) ? media[0] : media;
  const isVideo =
    typeof mediaUrl === "string" &&
    (mediaUrl.includes("/video/upload/") ||
      /\.(mp4|mov|webm|m4v|ogg)(\?|$)/i.test(mediaUrl));

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      onLike();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    }
    setLastTap(now);
  };

   //Double-Tap-Like

  return (
      <div
      onClick={handleTap}
      className={`relative w-full overflow-hidden 
        ${aspectClassMap[aspectRatio]}`}
    >
      {isVideo ? (
        <video
          src={mediaUrl}
          controls
          playsInline
          className="w-full h-full object-cover bg-black"
        />
      ) : (
        <img
          src={mediaUrl}
          className="w-full h-full object-cover"
          alt="post media"
        />
      )}
      <LikeOverlay show={showHeart} />
    </div>
  );
};

export default PostMedia;  
