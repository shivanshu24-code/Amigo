import React, { useState, useEffect } from "react";
import { X, Camera } from "lucide-react";
import { useAuthStore } from "../Store/AuthStore";

const EditProfileModal = ({ isOpen, onClose, initialData, onUpdateSuccess }) => {
    const { updateProfile, loading } = useAuthStore();
    const fileInputRef = React.useRef(null);
    const [formData, setFormData] = useState({
        firstname: "",
        lastname: "",
        username: "",
        bio: "",
        course: "",
        year: "",
        interest: "",
        avatar: "",
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                firstname: initialData.firstname || "",
                lastname: initialData.lastname || "",
                username: initialData.username || initialData.user?.username || "",
                bio: initialData.bio || "",
                course: initialData.course || "",
                year: initialData.year || "",
                interest: initialData.interest || "",
                avatar: initialData.avatar || "",
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, avatar: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await updateProfile(formData);
        if (success) {
            if (onUpdateSuccess) onUpdateSuccess();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Edit Profile</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center mb-6">
                        <div
                            className="relative w-24 h-24 mb-3 group cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <img
                                src={formData.avatar || "/profile.jpg"}
                                className="w-full h-full rounded-full object-cover border-4 border-gray-100 bg-gray-50 group-hover:opacity-75 transition"
                                alt="Avatar Preview"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                <Camera className="w-8 h-8 text-gray-800" />
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*"
                        />
                        <p className="text-xs text-center text-gray-500">Click avatar to upload new image</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">First Name</label>
                            <input type="text" name="firstname" value={formData.firstname} onChange={handleChange} className="w-full mt-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Name</label>
                            <input type="text" name="lastname" value={formData.lastname} onChange={handleChange} className="w-full mt-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Username</label>
                        <input type="text" name="username" value={formData.username} onChange={handleChange} className="w-full mt-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                    </div>

                    <div className="mb-4">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bio</label>
                        <textarea name="bio" value={formData.bio} onChange={handleChange} rows="3" className="w-full mt-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none resize-none"></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Course</label>
                            <input type="text" name="course" value={formData.course} onChange={handleChange} className="w-full mt-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Year</label>
                            <input type="text" name="year" value={formData.year} onChange={handleChange} className="w-full mt-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Interests</label>
                        <input type="text" name="interest" value={formData.interest} onChange={handleChange} className="w-full mt-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" placeholder="Coding, Music, Travel" />
                    </div>

                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 text-gray-700 font-medium hover:bg-gray-100 rounded-xl transition">Cancel</button>
                        <button type="submit" disabled={loading} className="flex-1 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-black transition disabled:opacity-50">
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default EditProfileModal;
