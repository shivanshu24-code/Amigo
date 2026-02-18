import React, { useEffect, useState } from "react";
import { useAuthStore } from "../Store/AuthStore.js";
import { Lock, ChevronLeft, Globe, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacySettingsPage = () => {
    const navigate = useNavigate();
    const { user, updatePrivacy, loading } = useAuthStore();
    const [isPrivate, setIsPrivate] = useState(user?.isPrivate || false);

    useEffect(() => {
        setIsPrivate(Boolean(user?.isPrivate));
    }, [user?.isPrivate]);

    const handleToggle = async () => {
        const newStatus = !isPrivate;
        const success = await updatePrivacy(newStatus);
        if (success) {
            setIsPrivate(newStatus);
        }
    };

    return (
        <div className="h-full bg-white flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 px-4 py-4 border-b border-gray-100">
                <button
                    onClick={() => navigate("/settings")}
                    className="p-2 hover:bg-gray-50 rounded-full transition-colors"
                >
                    <ChevronLeft size={24} className="text-gray-600" />
                </button>
                <h1 className="text-xl font-bold text-gray-900">Account Privacy</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-md mx-auto">
                    <div className="bg-gray-50 rounded-3xl p-6 mb-8 text-center">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isPrivate ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'}`}>
                            {isPrivate ? <Shield size={40} /> : <Globe size={40} />}
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">
                            Your account is {isPrivate ? 'Private' : 'Public'}
                        </h2>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            {isPrivate
                                ? "Only people you approve as friends can see your posts and stories."
                                : "Anyone on the app can see your posts and stories."
                            }
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-xl ${isPrivate ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-400'}`}>
                                    <Lock size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Private account</p>
                                    <p className="text-[10px] text-gray-500">Only friends can see your content</p>
                                </div>
                            </div>
                            <button
                                onClick={handleToggle}
                                disabled={loading}
                                className={`w-12 h-6 rounded-full relative transition-colors duration-300 shadow-inner ${isPrivate ? 'bg-indigo-600' : 'bg-gray-300'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${isPrivate ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>

                        <div className="px-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">What happens when your account is private?</h3>
                            <ul className="space-y-4">
                                <li className="flex gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                                    <p className="text-xs text-gray-600 leading-relaxed">Content you share won't appear on the public feed for non-friends.</p>
                                </li>
                                <li className="flex gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                                    <p className="text-xs text-gray-600 leading-relaxed">Only people you approve as friends can view your profile posts and stories.</p>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacySettingsPage;
