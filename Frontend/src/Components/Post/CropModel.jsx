import { useState, useCallback, useMemo } from "react";
import Cropper from "react-easy-crop";
import { motion } from "framer-motion";
import { getCroppedImg } from "../../Utils/CropImage.js";

const ASPECTS = {
  "1:1": 1,
  "4:5": 4 / 5,
  "9:16": 9 / 16
};

const CropModal = ({ file, onClose, onCropDone }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(ASPECTS["1:1"]);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const[aspectkey,setAspectkey]=useState("1:1")
  const imageSrc = useMemo(() => URL.createObjectURL(file), [file]);

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const aspectToLabel = (value) => {
    if (value === 1) return "1:1";
    if (value === 4 / 5) return "4:5";
    if (value === 9 / 16) return "9:16";
    return "1:1";
  };

  const handleDone = async () => {
    const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

    onCropDone({
      file: croppedBlob,aspectkey,
      aspectRatio: aspectToLabel(aspect)
    });

    URL.revokeObjectURL(imageSrc);
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="bg-black w-[420px] h-[520px] rounded-xl overflow-hidden relative">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />

        <div className="absolute bottom-0 w-full bg-black/70 px-4 py-3">
          <div className="flex justify-center gap-3 mb-3">
            {Object.keys(ASPECTS).map((key) => (
              <button
                key={key}
                onClick={() =>{ setAspect(ASPECTS[key])
                  setAspectkey(key)
                }}

                className={`px-3 py-1 rounded-full text-sm ${
                  aspect === ASPECTS[key]
                    ? "bg-white text-black"
                    : "bg-gray-700 text-white"
                }`}
              >
                {key}
              </button>
            ))}
          </div>

          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />

          <div className="flex justify-between mt-3">
            <button onClick={onClose} className="text-gray-300 text-sm">
              Cancel
            </button>
            <button
              onClick={handleDone}
              className="text-blue-400 font-semibold text-sm"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CropModal;
