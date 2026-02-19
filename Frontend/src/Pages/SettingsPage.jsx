import React from "react";
import {
    Archive,
    Clock,
    Lock,
    Star,
    Ban,
    History,
    AtSign,
    UserPlus,
    HelpCircle,
    ChevronRight,
    User,
    Bell,
    Monitor,
    ShieldCheck,
    Target,
    MessageSquare
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../Store/AuthStore.js";

const SettingsItem = ({ icon: Icon, label, description, color = "text-gray-700", onClick }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
    >
        <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg bg-gray-50 ${color}`}>
                <Icon size={20} />
            </div>
            <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">{label}</p>
                {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
            </div>
        </div>
        <ChevronRight size={18} className="text-gray-300" />
    </button>
);

const SettingsSection = ({ title, children }) => (
    <div className="mb-8">
        <h3 className="px-4 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
            {title}
        </h3>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {children}
        </div>
    </div>
);

const SettingsPage = () => {
    const navigate = useNavigate();
    const logout = useAuthStore((state) => state.logout);
    return (
        <div className="h-full overflow-y-auto bg-gray-50/50 dark:bg-black pb-20">
            <div className="max-w-2xl mx-auto py-8 px-4">
                {/* Header */}
                <div className="mb-8 px-4">
                    <h1 className="text-2xl font-bold text-gray-900">Settings and activity</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your experience and account settings</p>
                </div>

                {/* Your app and media */}
                <SettingsSection title="Your app and media">
                    <SettingsItem
                        icon={Archive}
                        label="Archive"
                        description="View and manage your archived posts and stories"
                        color="text-indigo-600"
                        onClick={() => navigate("/settings/archive")}
                    />
                </SettingsSection>

                {/* What you see */}
                <SettingsSection title="What you see">
                    <SettingsItem
                        icon={Clock}
                        label="Time management"
                        description="Manage your time spent on the platform"
                        color="text-orange-500"
                        onClick={() => navigate("/settings/time-management")}
                    />
                </SettingsSection>

                {/* Who can see your content */}
                <SettingsSection title="Who can see your content">
                    <SettingsItem
                        icon={Lock}
                        label="Account privacy"
                        description="Control who can see your account and content"
                        color="text-green-600"
                        onClick={() => navigate("/settings/privacy")}
                    />
                    <SettingsItem
                        icon={Star}
                        label="Close friends"
                        description="Manage your close friends list"
                        color="text-green-500"
                        onClick={() => navigate("/settings/close-friends")}
                    />
                    <SettingsItem
                        icon={Ban}
                        label="Blocked"
                        description="Manage people you've blocked"
                        color="text-red-500"
                        onClick={() => navigate("/settings/blocked")}
                    />
                </SettingsSection>

                {/* How others can interact with you */}
                <SettingsSection title="How others can interact with you">
                    <SettingsItem
                        icon={History}
                        label="Story settings"
                        description="Control replies, sharing, and archive for stories"
                        color="text-purple-600"
                        onClick={() => navigate("/settings/story-settings")}
                    />
                    <SettingsItem
                        icon={AtSign}
                        label="Tags and mentions"
                        description="Choose who can tag and mention you"
                        color="text-blue-600"
                        onClick={() => navigate("/settings/tags-mentions")}
                    />
                    <SettingsItem
                        icon={MessageSquare}
                        label="Chat settings"
                        description="Read receipts and blocked chats"
                        color="text-indigo-600"
                        onClick={() => navigate("/settings/chat")}
                    />
                </SettingsSection>

                {/* Link/Invite */}
                <SettingsSection title="Follow and invite friends">
                    <SettingsItem
                        icon={UserPlus}
                        label="Follow and invite friends"
                        description="Connect with people you know"
                        color="text-indigo-500"
                    />
                </SettingsSection>

                {/* More Info and Support */}
                <SettingsSection title="More info and support">
                    <SettingsItem
                        icon={HelpCircle}
                        label="Help"
                        description="Help center, privacy and security help, support requests"
                        color="text-gray-600"
                        onClick={() => navigate("/settings/help-center")}
                    />
                    <SettingsItem
                        icon={ShieldCheck}
                        label="Privacy Center"
                        description="Learn how we protect your information"
                        color="text-gray-600"
                        onClick={() => navigate("/settings/privacy-center")}
                    />
                </SettingsSection>

                {/* Login */}
                <SettingsSection title="Login">
                    <button
                        onClick={logout}
                        className="w-full text-left p-4 hover:bg-red-50 transition-colors text-sm font-bold text-red-600"
                    >
                        Log out
                    </button>
                </SettingsSection>

                <div className="text-center px-4 py-8">
                    <p className="text-xs text-gray-400 font-medium">Amigo by Bennett</p>
                    <p className="text-[10px] text-gray-300 mt-1 uppercase tracking-widest">Version 2.4.0</p>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
