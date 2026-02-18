import React, { useState, useRef,useEffect } from "react";
import { motion } from "framer-motion";
import {useAuthStore} from "../Store/AuthStore.js"
import { useNavigate } from "react-router-dom";
const VerificationPage = () => {
  const [otp, setOtp] = useState("");
  const[email,setemail]=useState("")
  const inputRef = useRef(null);
  const navigate=useNavigate()
  const { verifyOtp, loading, error } = useAuthStore();
  const maskEmail = (email) => {
  if (!email) return "";
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}****@${domain}`;
};
    useEffect(() => {
  const savedEmail = localStorage.getItem("signupEmail");
  if (!savedEmail) {
    navigate("/signin");
  } else {
    setemail(savedEmail);
  }
}, [navigate])
 const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 6) setOtp(value);
  };





const handleVerify = async () => {
  if (!email) {
    alert("Email missing. Please signup again.");
    navigate("/signin");
    return;
  }

  if (otp.length !== 6) {
    alert("Enter 6-digit OTP");
    return;
  }

  const ok = await verifyOtp(email, otp);
  if (ok) navigate("/setpassword");
};
  return (
    <div
      className="h-screen w-full relative flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: 'url("/3.png")',
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Lighter overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/45 via-purple-800/35 to-pink-700/30" />

      {/* Decorative blurred circles */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-[380px] bg-white rounded-3xl p-8 shadow-2xl relative z-10"
      >
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-1">Verify your email</h2>
        <p className="text-gray-500 text-center text-sm mb-6">
          Code sent to <span className="font-semibold">{maskEmail(email)}</span>
        </p>

        <div className="flex flex-col items-center">
          <span className="text-sm text-gray-600 mb-3">Enter 6-digit code</span>

          <input
            ref={inputRef}
            type="text"
            value={otp}
            onChange={handleChange}
            maxLength={6}
            className="opacity-0 absolute pointer-events-none"
          />

          <div
            className="flex gap-2 cursor-text"
            onClick={() => inputRef.current.focus()}
          >
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="w-12 h-14 flex justify-center items-center border border-gray-300 rounded-xl bg-gray-100 text-2xl font-semibold shadow-sm"
              >
                {otp[idx] || ""}
              </div>
            ))}
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center bg-red-50 py-2 px-3 rounded-lg mt-3 w-full">
              {error}
            </p>
          )}

          <button
            disabled={otp.length !== 6 || loading}
            className="w-full py-3.5 mt-6 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/30"
            onClick={handleVerify}
          >
            {loading ? "Verifying..." : "Verify Code"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default VerificationPage;
