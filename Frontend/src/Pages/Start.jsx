import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import collegeBackground from "../assets/college_background.png";

// Feed Screen Component
const FeedMockup = () => (
  <div className="w-full h-full bg-white flex flex-col text-[8px] overflow-hidden">
    {/* Header */}
    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
      <span className="text-blue-600 font-bold text-[10px]">Amigo</span>
      <div className="flex gap-2">
        <div className="w-3 h-3 rounded-full bg-gray-200"></div>
        <div className="w-3 h-3 rounded-full bg-gray-200"></div>
      </div>
    </div>

    {/* Stories */}
    <div className="px-3 py-2 border-b border-gray-100">
      <div className="flex items-center gap-1 mb-1">
        <span className="text-[7px]">✨</span>
        <span className="font-medium text-[8px]">Stories</span>
      </div>
      <div className="flex gap-2">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 p-0.5">
            <div className="w-full h-full rounded-full bg-gray-300 flex items-center justify-center text-[6px]">+</div>
          </div>
          <span className="text-[6px] mt-0.5">Your Story</span>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 p-0.5">
              <div className="w-full h-full rounded-full bg-gray-300"></div>
            </div>
            <span className="text-[6px] mt-0.5">User {i}</span>
          </div>
        ))}
      </div>
    </div>

    {/* Post */}
    <div className="flex-1 overflow-hidden">
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-blue-500"></div>
          <div>
            <div className="font-medium text-[8px]">Username</div>
            <div className="text-[6px] text-gray-400">19 hours ago</div>
          </div>
        </div>
        <p className="mb-2 text-[8px]">Partyyyyyyy 🎉</p>
        <div className="w-full h-32 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 border-2 border-white"></div>
            ))}
          </div>
        </div>
        <div className="flex gap-3 mt-2">
          <span className="text-[8px]">❤️</span>
          <span className="text-[8px]">💬</span>
          <span className="text-[8px]">📤</span>
        </div>
      </div>
    </div>

    {/* Bottom Nav */}
    <div className="flex justify-around py-2 border-t border-gray-100 bg-white">
      <div className="text-blue-600 text-[10px]">🏠</div>
      <div className="text-gray-400 text-[10px]">🔍</div>
      <div className="text-gray-400 text-[10px]">➕</div>
      <div className="text-gray-400 text-[10px]">🔔</div>
      <div className="text-gray-400 text-[10px]">👤</div>
    </div>
  </div>
);

// Chat Screen Component
const ChatMockup = () => (
  <div className="w-full h-full bg-gray-50 flex flex-col text-[8px] overflow-hidden">
    {/* Header */}
    <div className="bg-white px-3 py-2 border-b border-gray-100">
      <span className="text-blue-600 font-bold text-[10px]">Amigo</span>
    </div>

    <div className="flex flex-1 overflow-hidden">
      {/* Chat List */}
      <div className="w-1/3 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-2 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-[9px]">Chats</span>
            <div className="w-3 h-3 bg-blue-100 rounded flex items-center justify-center text-blue-600 text-[6px]">✎</div>
          </div>
          <div className="bg-gray-100 rounded-full px-2 py-1 text-[6px] text-gray-400">🔍 Search</div>
        </div>
        <div className="flex-1 overflow-hidden">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-1.5 px-2 py-1.5 border-b border-gray-50">
              <div className="w-5 h-5 rounded-full bg-gray-300 flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <div className="h-1.5 bg-gray-300 rounded w-12 mb-1"></div>
                <div className="h-1 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State */}
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
          <span className="text-blue-600 text-[14px]">💬</span>
        </div>
        <span className="font-medium text-[9px] text-gray-800">Select a chat</span>
        <span className="text-[7px] text-blue-500">Choose a friend to start messaging</span>
      </div>
    </div>

    {/* Bottom Nav */}
    <div className="flex justify-around py-2 border-t border-gray-100 bg-white">
      <div className="text-gray-400 text-[10px]">🏠</div>
      <div className="text-gray-400 text-[10px]">🔍</div>
      <div className="text-blue-600 text-[10px]">💬</div>
      <div className="text-gray-400 text-[10px]">⚙️</div>
      <div className="text-gray-400 text-[10px]">👤</div>
    </div>
  </div>
);

// Profile Screen Component
const ProfileMockup = () => (
  <div className="w-full h-full bg-white flex flex-col text-[8px] overflow-hidden">
    {/* Header */}
    <div className="px-3 py-2">
      <span className="text-blue-600 font-bold text-[10px]">Amigo</span>
    </div>

    {/* Banner */}
    <div className="h-16 bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 relative">
      <div className="absolute -bottom-5 left-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 p-0.5">
          <div className="w-full h-full rounded-full bg-gray-300 border-2 border-white"></div>
        </div>
      </div>
    </div>

    {/* Profile Info */}
    <div className="px-3 pt-7 pb-2">
      <div className="flex items-center gap-3 mb-1">
        <span className="text-[7px] text-gray-600">2 <span className="text-blue-500">Friends</span></span>
        <span className="text-[7px] text-gray-600">1 <span className="text-gray-500">Posts</span></span>
      </div>
      <div className="flex items-center gap-1 mb-1">
        <span className="font-bold text-[10px]">Name</span>
        <span className="text-blue-500 text-[8px]">✓</span>
      </div>
      <p className="text-[7px] text-gray-500 mb-2">About...</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-2">
        {["📚 B.Tech CSE", "🎓 2nd Year", "Coding", "AI", "Sports"].map((tag, i) => (
          <span key={i} className={`px-1.5 py-0.5 rounded-full text-[6px] ${i < 2 ? 'bg-gray-100' : 'text-blue-500'}`}>
            {tag}
          </span>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-2">
        <span className="bg-black text-white px-2 py-1 rounded-full text-[7px]">📷 Posts</span>
        <span className="text-gray-500 px-2 py-1 text-[7px]">📑 Saved</span>
        <span className="text-gray-500 px-2 py-1 text-[7px]">❤️ Liked</span>
      </div>
    </div>

    {/* Posts Grid */}
    <div className="flex-1 px-3 grid grid-cols-3 gap-1">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 rounded"></div>
      ))}
    </div>

    {/* Bottom Nav */}
    <div className="flex justify-around py-2 border-t border-gray-100 bg-white mt-2">
      <div className="text-gray-400 text-[10px]">🏠</div>
      <div className="text-gray-400 text-[10px]">🔍</div>
      <div className="text-gray-400 text-[10px]">➕</div>
      <div className="text-gray-400 text-[10px]">🔔</div>
      <div className="text-blue-600 text-[10px]">👤</div>
    </div>
  </div>
);

const Start = () => {
  const navigate = useNavigate();
  const title = "Amigo";

  // Preview screens to cycle through
  const previewScreens = [
    { component: FeedMockup, label: "Feed" },
    { component: ChatMockup, label: "Chat" },
    { component: ProfileMockup, label: "Profile" },
  ];
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);

  // Cycle through screens every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScreenIndex((prev) => (prev + 1) % previewScreens.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Title container (stagger letters)
  const titleContainer = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  // Bounce-in letters
  const letterVariants = {
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.8,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 18,
        mass: 0.6,
      },
    },
  };

  // Tagline fade-in AFTER title
  const taglineVariants = {
    hidden: {
      opacity: 0,
      y: 10,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: title.length * 0.12 + 0.3,
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  // Phone mockup animation
  const phoneVariants = {
    hidden: {
      opacity: 0,
      x: 100,
      scale: 0.9,
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        delay: title.length * 0.12 + 0.5,
        type: "spring",
        stiffness: 120,
        damping: 20,
      },
    },
  };

  const CurrentScreen = previewScreens[currentScreenIndex].component;

  return (
    <div className="h-screen w-full relative overflow-hidden">

      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${collegeBackground})` }}
      />

      {/* Dark Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-blue-900/70 to-indigo-900/80" />

      {/* Main Container - Responsive Layout */}
      <div className="h-full w-full flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 px-6 py-4 relative z-10">

        {/* Left Side - Content */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left max-w-lg">

          {/* Animated Title */}
          <motion.h1
            className="font-bold text-5xl lg:text-7xl mb-4 flex tracking-tight"
            variants={titleContainer}
            initial="hidden"
            animate="visible"
          >
            {title.split("").map((char, index) => (
              <motion.span
                key={index}
                variants={letterVariants}
                className="inline-block text-white"
                style={{ textShadow: "0 2px 20px rgba(255,255,255,0.15)" }}
              >
                {char}
              </motion.span>
            ))}
          </motion.h1>

          {/* Animated Tagline */}
          <motion.div
            variants={taglineVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-2 mb-8"
          >
            <p className="font-light text-base lg:text-lg text-white/80 tracking-wider uppercase">
              Connect · Share · Belong
            </p>
            <p className="font-light text-sm lg:text-base text-white/50 max-w-sm leading-relaxed">
              Your campus community, reimagined.
            </p>
          </motion.div>

          {/* Button */}
          <motion.button
            variants={taglineVariants}
            initial="hidden"
            animate="visible"
            className="bg-white/10 backdrop-blur-sm px-8 py-3 flex items-center rounded-full border border-white/20 hover:bg-white/20 hover:cursor-pointer transition-all duration-300 font-light text-white tracking-wide"
            onClick={() => navigate("/signin")}
          >
            GET STARTED
          </motion.button>
        </div>

        {/* Right Side - Phone Mockup */}
        <motion.div
          variants={phoneVariants}
          initial="hidden"
          animate="visible"
          className="relative flex-shrink-0"
        >
          {/* Phone Frame */}
          <div
            className="relative rounded-[2.5rem] lg:rounded-[3rem] p-2 lg:p-3 shadow-2xl"
            style={{
              background: "linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.1)"
            }}
          >
            {/* Phone Bezel */}
            <div
              className="rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden relative"
              style={{
                width: "clamp(220px, 28vw, 300px)",
                height: "clamp(440px, 56vw, 600px)",
                background: "#000",
              }}
            >
              {/* Notch */}
              <div
                className="absolute top-0 left-1/2 transform -translate-x-1/2 z-20"
                style={{
                  width: "clamp(70px, 9vw, 100px)",
                  height: "clamp(18px, 2.2vw, 26px)",
                  background: "#1a1a2e",
                  borderRadius: "0 0 14px 14px",
                }}
              >
                {/* Camera */}
                <div
                  className="absolute top-1.5 lg:top-2 right-4 lg:right-6 w-2 lg:w-2.5 h-2 lg:h-2.5 rounded-full"
                  style={{
                    background: "radial-gradient(circle, #2d3436 30%, #000 70%)",
                    boxShadow: "inset 0 0 2px rgba(255,255,255,0.3)"
                  }}
                />
                {/* Speaker */}
                <div
                  className="absolute top-2 lg:top-2.5 left-1/2 transform -translate-x-1/2 w-6 lg:w-10 h-0.5 lg:h-1 rounded-full"
                  style={{ background: "#2d3436" }}
                />
              </div>

              {/* Screen Content - Live React Components */}
              <div className="w-full h-full overflow-hidden rounded-[2rem] lg:rounded-[2.5rem] relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={previewScreens[currentScreenIndex].label}
                    className="w-full h-full absolute inset-0"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  >
                    <CurrentScreen />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Home Indicator */}
              <div
                className="absolute bottom-1.5 lg:bottom-2 left-1/2 transform -translate-x-1/2 w-16 lg:w-24 h-0.5 lg:h-1 rounded-full z-20"
                style={{ background: "rgba(255,255,255,0.3)" }}
              />
            </div>

            {/* Side Buttons */}
            <div
              className="absolute left-0 top-20 lg:top-28 w-0.5 lg:w-1 h-6 lg:h-8 rounded-l-sm"
              style={{ background: "#2d3436", transform: "translateX(-100%)" }}
            />
            <div
              className="absolute left-0 top-32 lg:top-40 w-0.5 lg:w-1 h-6 lg:h-8 rounded-l-sm"
              style={{ background: "#2d3436", transform: "translateX(-100%)" }}
            />
            <div
              className="absolute right-0 top-24 lg:top-32 w-0.5 lg:w-1 h-10 lg:h-12 rounded-r-sm"
              style={{ background: "#2d3436", transform: "translateX(100%)" }}
            />
          </div>

          {/* Glow Effect */}
          <div
            className="absolute -inset-4 rounded-[3rem] lg:rounded-[4rem] -z-10 blur-2xl opacity-40"
            style={{
              background: "linear-gradient(145deg, #667eea 0%, #764ba2 100%)"
            }}
          />

          {/* Page Indicator Dots */}
          <div className="flex justify-center gap-2 mt-4">
            {previewScreens.map((screen, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentScreenIndex
                  ? "bg-white scale-125"
                  : "bg-white/40"
                  }`}
              />
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default Start;
