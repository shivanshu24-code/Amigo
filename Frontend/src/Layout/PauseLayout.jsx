import React from "react";
import { AnimatePresence, motion } from "framer-motion";

const PauseLayout = () => {
  return (
    <AnimatePresence>
      
        <motion.div
          className="absolute inset-0 z-[70] flex items-center justify-center bg-black/40 "
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="flex items-center justify-center w-20 h-20 rounded-full bg-white/20 "
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 18
            }}
          >
            {/* Pause Icon */}
            <div className="flex gap-2">
              <span className="w-2 h-8 bg-white rounded-sm" />
              <span className="w-2 h-8 bg-white rounded-sm" />
            </div>
          </motion.div>
        </motion.div>
    
    </AnimatePresence>
  );
};

export default PauseLayout;
