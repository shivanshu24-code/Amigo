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
    navigate("/signup");
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
    navigate("/signup");
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
    <div className="flex bg-gradient-to-br from-violet-900 via-blue-700 to-violet-600 h-screen items-center justify-center">
      {/* POP-UP CARD */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 40 }}
       animate={{ opacity: 1, scale: 1 }}
       transition={{ type: "spring", stiffness: 60 }}
        whileHover={{ scale: 1.02 }}

        className="w-[390px] items-center justify-center bg-gray-50 px-5 py-4 z-10 rounded-xl shadow-md border border-purple-900 backdrop-blur-2xl"
      >
        {/* Logo */}
        <div className="items-center mx-12 mb-6">
          <h1 className="text-3xl font-bold text-center">Amigo</h1>
        </div>

        {/* Info Text */}
        <div className="flex flex-col mt-4">
          <p className="text-gray-800 font-semibold text-xl text-center">
            Verification Email Sent to your
            <br />
            <span className="flex justify-center text-sm font-medium text-gray-500 mt-3">
              {maskEmail(email)}
            </span>
          </p>
        </div>

        {/* OTP Section */}
        <div className="flex flex-col items-center mt-4">
          <span className="text-medium font-light text-gray-800 mb-2">
            Enter Code
          </span>

          <input
            ref={inputRef}
            type="text"
            value={otp}
            onChange={handleChange}
            maxLength={6}
            className="opacity-0 absolute pointer-events-none"
          />

          {/* OTP BOXES */}
          <div
            className="flex gap-2 cursor-text"
            onClick={() => inputRef.current.focus()}
          >
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="w-12 h-14 flex justify-center items-center border border-gray-300 rounded-xl bg-white text-2xl font-semibold shadow-sm"
              >
                {otp[idx] || ""}
              </div>
            ))}
          </div>
              {error && (
  <p className="text-red-600 text-sm mt-2 text-center">{error}</p>
)}
          {/* VERIFY BUTTON */}
          <button
            disabled={otp.length !== 6||loading}
            className="w-64 py-3 mt-6 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 disabled:bg-gray-400 text-white font-semibold mb-2"
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