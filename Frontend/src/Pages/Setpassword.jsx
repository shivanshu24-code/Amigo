import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom"
const SetPassword = () => {
  const [password, setPassword] = useState("");
  const [email, setemail] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate()

  useEffect(() => {
    const savedEmail = localStorage.getItem("signupEmail");
    if (!savedEmail) {
      navigate("/signup");
    } else {
      setemail(savedEmail);
    }
  }, []);

  const handleSubmit = async () => {
    setError("");

    if (!email || !password || !confirmPassword) {
      return setError("All fields are required");
    }

    if (password.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    try {
      setLoading(true);

      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/auth/setpassword`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Server error");
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to set password");
      }

      // 🔐 store JWT
      localStorage.setItem("token", data.token);

      // 🧹 cleanup
      localStorage.removeItem("signupEmail");

      alert("Password set successfully");
      navigate("/createprofile");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
      <h1 className="absolute top-8 left-10 text-white font-bold text-3xl z-20 tracking-tight">
        Amigo<span className="text-pink-400">.</span>
      </h1>

      {/* Main content */}
      <div className="w-full flex items-center justify-center relative z-10 px-4">
        <div className="w-full max-w-[400px] bg-white rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">Set Password</h2>
          <p className="text-gray-500 text-center text-sm mb-8">Create a strong password to secure your account</p>

          <div className="flex flex-col gap-4">
            {/* Password */}
            <div className="relative">
              <label className="text-gray-600 text-sm mb-1.5 block">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-800 placeholder-gray-400 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm */}
            <div>
              <label className="text-gray-600 text-sm mb-1.5 block">Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"}
                className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-800 placeholder-gray-400 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg">
                {error}
              </p>
            )}

            {/* Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/30"
            >
              {loading ? "Setting Password..." : "Continue"}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-white/40 text-xs z-10">
        © 2024 Amigo. Made with ❤️
      </div>
    </div>
  );
};

export default SetPassword;
