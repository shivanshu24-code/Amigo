import React from "react";
import { Calendar, Newspaper, Users, ChevronRight, MapPin, Clock, Sparkles } from "lucide-react";

// Mock data - replace with API calls
const upcomingEvents = [
    {
        id: 1,
        title: "Tech Fest 2026",
        date: "Feb 15",
        time: "10:00 AM",
        location: "Main Auditorium",
        type: "festival",
        color: "purple"
    },
    {
        id: 2,
        title: "Hackathon 3.0",
        date: "Feb 20",
        time: "9:00 AM",
        location: "CS Block",
        type: "competition",
        color: "blue"
    },
    {
        id: 3,
        title: "Cultural Night",
        date: "Feb 25",
        time: "6:00 PM",
        location: "Open Ground",
        type: "cultural",
        color: "pink"
    }
];

const collegeNews = [
    {
        id: 1,
        headline: "New AI Lab inaugurated",
        time: "2 hours ago",
        isNew: true
    },
    {
        id: 2,
        headline: "Placement drive starts next week",
        time: "5 hours ago",
        isNew: true
    },
    {
        id: 3,
        headline: "Sports week schedule announced",
        time: "1 day ago",
        isNew: false
    },
    {
        id: 4,
        headline: "Library timing extended",
        time: "2 days ago",
        isNew: false
    }
];

const onlineUsers = [
    { name: "Aman", avatar: "/profile.jpg" },
    { name: "Riya", avatar: "/profile.jpg" },
    { name: "Kabir", avatar: "/profile.jpg" },
    { name: "Simran", avatar: "/profile.jpg" }
];

const colorMap = {
    purple: "bg-purple-100 text-purple-600 border-purple-200",
    blue: "bg-blue-100 text-blue-600 border-blue-200",
    pink: "bg-pink-100 text-pink-600 border-pink-200"
};

const RightPanel = () => {
    return (
        <div className="hidden lg:flex flex-col w-[320px] bg-gray-50 border-l border-gray-100 sticky top-0 h-screen overflow-y-auto">
            <div className="p-4 space-y-5">

                {/* Upcoming Events */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-purple-500" />
                            Upcoming Events
                        </h3>
                        <button className="text-xs text-purple-600 font-medium hover:text-purple-700">
                            See all
                        </button>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {upcomingEvents.map((event) => (
                            <div
                                key={event.id}
                                className="p-3 hover:bg-gray-50 transition cursor-pointer"
                            >
                                <div className="flex gap-3">
                                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${colorMap[event.color]} border flex flex-col items-center justify-center`}>
                                        <span className="text-xs font-bold">{event.date.split(" ")[0]}</span>
                                        <span className="text-[10px]">{event.date.split(" ")[1]}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-gray-900 text-sm truncate">
                                            {event.title}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                            <Clock className="w-3 h-3" />
                                            <span>{event.time}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                                            <MapPin className="w-3 h-3" />
                                            <span className="truncate">{event.location}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* College News */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <Newspaper className="w-4 h-4 text-blue-500" />
                            College News
                        </h3>
                        <button className="text-xs text-purple-600 font-medium hover:text-purple-700">
                            See all
                        </button>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {collegeNews.map((news) => (
                            <div
                                key={news.id}
                                className="px-4 py-3 hover:bg-gray-50 transition cursor-pointer flex items-start gap-3"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        {news.isNew && (
                                            <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-red-100 text-red-600 rounded">
                                                NEW
                                            </span>
                                        )}
                                        <p className="text-sm text-gray-800 truncate font-medium">
                                            {news.headline}
                                        </p>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">{news.time}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Online Friends */}
                {/* <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-50">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <Users className="w-4 h-4 text-green-500" />
                            Online Now
                            <span className="ml-auto text-xs text-gray-400">{onlineUsers.length}</span>
                        </h3>
                    </div>

                    <div className="p-3">
                        <div className="flex flex-wrap gap-2">
                            {onlineUsers.map((user, index) => (
                                <div
                                    key={index}
                                    className="relative group cursor-pointer"
                                    title={user.name}
                                >
                                    <img
                                        src={user.avatar}
                                        alt={user.name}
                                        className="w-10 h-10 rounded-full object-cover ring-2 ring-green-400 ring-offset-2"
                                    />
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                </div>
                            ))}
                            <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">
                                <span className="text-sm font-medium">+5</span>
                            </button>
                        </div>
                    </div>
                </div> */}

                {/* Quick Links */}
                <div className="text-xs text-gray-400 space-x-2 px-2">
                    <a href="#" className="hover:text-gray-600">About</a>
                    <span>•</span>
                    <a href="#" className="hover:text-gray-600">Help</a>
                    <span>•</span>
                    <a href="#" className="hover:text-gray-600">Privacy</a>
                    <span>•</span>
                    <a href="#" className="hover:text-gray-600">Terms</a>
                </div>
                <p className="text-xs text-gray-300 px-2">© 2026 Amigo</p>
            </div>
        </div>
    );
};

export default RightPanel;
