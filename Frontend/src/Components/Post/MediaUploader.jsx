import { useState } from "react";
import { ImagePlus, X } from "lucide-react";
import CropModal from "./CropModel.jsx"; // ✅ FIXED import

const MediaUploader = ({ media, setMedia, setAspectRatio }) => {
  const [cropFile, setCropFile] = useState(null);

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 🎥 Video → no crop
    if (file.type.startsWith("video")) {
      setMedia(file);
      setAspectRatio("auto"); // optional
    }
    // 🖼 Image → open crop modal
    else {
      setCropFile(file);
    }
  };

  const handleCropDone = ({ file, aspectkey }) => {
    // Convert Blob → File (important for Cloudinary)
    const croppedFile = new File(
      [file],
      "cropped.jpg",
      { type: "image/jpeg" }
    );

    setMedia(croppedFile);
    setAspectRatio(aspectkey); // ✅ STORE RATIO
    setCropFile(null);
  };

  const removeMedia = () => {
    setMedia(null);
    setAspectRatio(null);
  };

  const isVideo = media?.type?.startsWith("video");

  return (
    <>
      <div className="relative w-full h-[260px] rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden">

        {/* ❌ Remove */}
        {media && (
          <button
            onClick={removeMedia}
            className="absolute top-2 right-2 z-20 bg-black/60 text-white rounded-full p-1 hover:bg-black"
          >
            <X size={16} />
          </button>
        )}

        {/* 📸 Preview */}
        {media ? (
          isVideo ? (
            <video
              src={URL.createObjectURL(media)}
              controls
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={URL.createObjectURL(media)}
              alt="preview"
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <label className="flex flex-col items-center justify-center cursor-pointer text-gray-500 hover:text-blue-600 transition">
            <div className="w-14 h-14 rounded-full bg-white shadow flex items-center justify-center mb-3">
              <ImagePlus size={26} />
            </div>

            <p className="text-sm font-medium">Add photos or videos</p>
            <p className="text-xs text-gray-400 mt-1">
              Crop & choose aspect ratio
            </p>

            <input
              type="file"
              accept="image/*,video/*"
              hidden
              onChange={handleChange}
            />
          </label>
        )}
      </div>

      {/* ✂️ Crop Modal */}
      {cropFile && (
        <CropModal
          file={cropFile}
          onClose={() => setCropFile(null)}
          onCropDone={handleCropDone}
        />
      )}
    </>
  );
};

export default MediaUploader;
