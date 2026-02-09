import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../Store/AuthStore.js";

const CreateProfile = () => {
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    course: "",
    year: "",
    interests: [],
    bio: "",
    username: "",
  });

  const interestsList = [
    "Coding",
    "Design",
    "Sports",
    "Music",
    "Photography",
    "AI",
    "Startups",
  ];

  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const setProfileComplete = useAuthStore(
    (state) => state.setProfileComplete
  );

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const toggleInterest = (item) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(item)
        ? prev.interests.filter((i) => i !== item)
        : [...prev.interests, item],
    }));
  };

  // 🔑 FORM SUBMIT (ENTER KEY WORKS)
  const handleSubmit = async (e) => {
    e.preventDefault(); // 🚨 IMPORTANT
    if (loading) return;

    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      if (!token) {
        alert("Session expired. Please login again.");
        navigate("/login");
        return;
      }

      let avatarUrl = "";

      // 1️⃣ Upload avatar
      if (avatar) {
        const avatarData = new FormData();
        avatarData.append("file", avatar);
        avatarData.append("upload_preset", "amigo_unsigned");

        const uploadRes = await fetch(
          "https://api.cloudinary.com/v1_1/dojxawpjt/image/upload",
          {
            method: "POST",
            body: avatarData,
          }
        );

        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadJson.error?.message || "Avatar upload failed");
        }

        avatarUrl = uploadJson.secure_url;
      }

      // 2️⃣ Create profile
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstname: form.firstname,
          lastname: form.lastname,
          username: form.username,
          course: form.course,
          year: form.year,
          bio: form.bio,
          interest: form.interests.join(","),
          avatar: avatarUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // ✅ UPDATE AUTH STORE
      setProfileComplete({
        firstname: form.firstname,
        lastname: form.lastname,
        username: form.username,
        avatar: avatarUrl,
        hasProfile: true,
      });

      navigate("/feed");
    } catch (err) {
      alert(err.message || "Failed to create profile");
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

      <div className="w-full h-full flex items-center justify-center relative z-10 px-4 py-8 overflow-y-auto">
        <div className="w-full max-w-[500px] bg-white rounded-3xl p-8 shadow-2xl my-auto">
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-1">Create your profile</h1>
          <p className="text-gray-500 text-center text-sm mb-6">Tell us a bit about yourself</p>

          {/* 🔥 FORM WRAPPER */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Avatar */}
            <div className="flex justify-center">
              <label className="cursor-pointer group relative">
                <div className="w-28 h-28 rounded-full border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-sm font-medium">Upload</span>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 bg-blue-500 p-1.5 rounded-full border-2 border-white shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                </div>
                <input type="file" hidden onChange={handleAvatarChange} />
              </label>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-1 block pl-1">First Name</label>
                <input
                  placeholder="John"
                  onChange={(e) => setForm({ ...form, firstname: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all font-medium"
                />
              </div>
              <div>
                <label className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-1 block pl-1">Last Name</label>
                <input
                  placeholder="Doe"
                  onChange={(e) => setForm({ ...form, lastname: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all font-medium"
                />
              </div>

              <div className="col-span-2">
                <label className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-1 block pl-1">Username</label>
                <input
                  placeholder="@username"
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all font-medium"
                />
              </div>

              <div className="col-span-2 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-1 block pl-1">Course</label>
                  <input
                    placeholder="CS/IT..."
                    onChange={(e) => setForm({ ...form, course: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-1 block pl-1">Year</label>
                  <div className="relative">
                    <select
                      onChange={(e) => setForm({ ...form, year: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all appearance-none font-medium cursor-pointer"
                    >
                      <option value="">Select</option>
                      <option>1st Year</option>
                      <option>2nd Year</option>
                      <option>3rd Year</option>
                      <option>4th Year</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interests */}
            <div>
              <label className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-2 block pl-1">Interests</label>
              <div className="flex flex-wrap gap-2">
                {interestsList.map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => toggleInterest(item)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${form.interests.includes(item)
                      ? "bg-purple-600 text-white shadow-purple-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-1 block pl-1">Bio</label>
              <textarea
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all resize-none h-24 font-medium"
                placeholder="Tell us something interesting..."
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/30 mt-2"
            >
              {loading ? "Creating Profile..." : "Get Started"}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-white/40 text-xs z-10 hidden md:block">
        © 2024 Amigo. Made with ❤️
      </div>
    </div>
  );
};

export default CreateProfile;
