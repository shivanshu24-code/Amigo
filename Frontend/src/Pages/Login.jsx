import React, { useState } from "react";
import { FaMicrosoft } from "react-icons/fa";
import { motion } from "framer-motion";
import { useAuthStore } from "../Store/AuthStore.js";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const { login, loading, error } = useAuthStore();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!identifier || !password) {
      alert("Please enter valid email/Username and password");
      return;
    }

    const ok = await login(identifier, password);
    if (ok) navigate("/feed");
  };

  return (
    <div
      className="h-screen w-full relative flex overflow-hidden"
      style={{
        backgroundImage: 'url("/3.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 via-purple-800/70 to-pink-700/60" />

      {/* Decorative blurred circles */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-pink-500/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl" />

      {/* Logo */}
      <motion.h1
        className="absolute top-8 left-10 text-white font-bold text-3xl z-20 tracking-tight"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        Amigo<span className="text-pink-400">.</span>
      </motion.h1>

      {/* Main content */}
      <div className="w-full flex items-center justify-center relative z-10">
        <div className="flex items-center gap-16">

          {/* Left side - Tagline (hidden on mobile) */}
          <motion.div
            className="hidden lg:block max-w-md text-white"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-5xl font-bold leading-tight mb-4">
              Connect with your <span className="text-pink-400">friends</span> anywhere
            </h2>
            <p className="text-lg text-white/70">
              Share moments, chat instantly, and stay connected with the people who matter most.
            </p>
          </motion.div>

          {/* Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-[380px] bg-white rounded-3xl p-8 shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-1">Welcome back</h2>
            <p className="text-gray-500 text-center text-sm mb-8">Sign in to continue</p>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="text-gray-600 text-sm mb-1.5 block">Email or Username</label>
                <input
                  type="text"
                  value={identifier}
                  placeholder="you@bennett.edu / @username"
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-800 placeholder-gray-400 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
                />
              </div>

              <div>
                <label className="text-gray-600 text-sm mb-1.5 block">Password</label>
                <input
                  type="password"
                  value={password}
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-800 placeholder-gray-400 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/30"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-gray-400 text-xs">or continue with</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Microsoft */}
            <button className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200 transition-all">
              <FaMicrosoft className="text-lg text-blue-600" />
              <span className="font-medium">Microsoft</span>
            </button>

            {/* Sign up link */}
            <p className="text-center text-gray-500 mt-6 text-sm">
              New to Amigo?{" "}
              <a href="/signin" className="text-purple-600 font-semibold hover:text-purple-500 transition-colors">
                Create account
              </a>
            </p>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-white/40 text-xs z-10">
        © 2024 Amigo. Made with ❤️
      </div>
    </div>
  );
};

export default Login;
