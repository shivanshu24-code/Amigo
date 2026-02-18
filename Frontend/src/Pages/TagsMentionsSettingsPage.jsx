import React, { useEffect, useState } from "react";
import { ChevronLeft, AtSign, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../Store/AuthStore.js";

const settingMeta = {
    tagInStoryPermission: {
        title: "Who can tag you in story",
        description: "Control who can add your profile as a story tag.",
        icon: Tag
    },
    mentionPermission: {
        title: "Who can mention you",
        description: "Control who can mention your profile in content.",
        icon: AtSign
    }
};

const TagsMentionsSettingsPage = () => {
    const navigate = useNavigate();
    const { user, loading, updateTagsAndMentions } = useAuthStore();
    const [settings, setSettings] = useState({
        tagInStoryPermission: "anyone",
        mentionPermission: "anyone"
    });

    useEffect(() => {
        setSettings({
            tagInStoryPermission: user?.tagInStoryPermission || "anyone",
            mentionPermission: user?.mentionPermission || "anyone"
        });
    }, [user?.tagInStoryPermission, user?.mentionPermission]);

    const toggleSetting = async (key) => {
        const nextValue = settings[key] === "anyone" ? "friends" : "anyone";
        const previousValue = settings[key];

        setSettings((prev) => ({ ...prev, [key]: nextValue }));
        const success = await updateTagsAndMentions({ [key]: nextValue });
        if (!success) {
            setSettings((prev) => ({ ...prev, [key]: previousValue }));
        }
    };

    return (
        <div className="h-full bg-white flex flex-col">
            <div className="flex items-center gap-4 px-4 py-4 border-b border-gray-100">
                <button
                    onClick={() => navigate("/settings")}
                    className="p-2 hover:bg-gray-50 rounded-full transition-colors"
                >
                    <ChevronLeft size={24} className="text-gray-600" />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Tags and mentions</h1>
                    <p className="text-xs text-gray-500">Choose who can tag and mention you</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-md mx-auto space-y-4">
                    {Object.entries(settingMeta).map(([key, meta]) => {
                        const Icon = meta.icon;
                        const isOnlyFriends = settings[key] === "friends";
                        return (
                            <div key={key} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${isOnlyFriends ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}>
                                            <Icon size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{meta.title}</p>
                                            <p className="text-[11px] text-gray-500">{meta.description}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleSetting(key)}
                                        disabled={loading}
                                        className={`w-12 h-6 rounded-full relative transition-colors duration-300 shadow-inner ${isOnlyFriends ? "bg-blue-600" : "bg-gray-300"}`}
                                        aria-label={meta.title}
                                    >
                                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${isOnlyFriends ? "translate-x-6" : ""}`} />
                                    </button>
                                </div>
                                <p className="mt-3 text-xs font-semibold text-gray-600">
                                    {isOnlyFriends ? "Only friends" : "Anyone"}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default TagsMentionsSettingsPage;
