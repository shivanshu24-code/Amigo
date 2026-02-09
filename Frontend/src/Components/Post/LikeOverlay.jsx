import { Heart } from "lucide-react";
import { motion } from "framer-motion";

const LikeOverlay = ({ show }) => {
  if (!show) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1.5, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 260 }}
      className="absolute inset-0 flex items-center justify-center"
    >
      <Heart size={90} className="fill-red-800 text-transparent drop-shadow-lg" />
    </motion.div>
  );
};

export default LikeOverlay;
