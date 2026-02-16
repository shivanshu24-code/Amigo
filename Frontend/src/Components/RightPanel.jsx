import React, { useState, useEffect } from "react";
import { Calendar, Newspaper, Users, ChevronRight, MapPin, Clock, Sparkles, Plus, Trash2, X } from "lucide-react";
import { FiEdit } from "react-icons/fi";
import api from "../Services/Api.js"; // Use configured api instance
import { useAuthStore } from "../Store/AuthStore";

// Configure axios base URL if not already global
// axios.defaults.baseURL = "http://localhost:3000/api";

const RightPanel = () => {
    const [events, setEvents] = useState([]);
    const [newsItems, setNewsItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [modalType, setModalType] = useState("event"); // "event" or "news"
    const { user: authUser } = useAuthStore();

    // Form State (Unified/Shared where possible)
    const [formState, setFormState] = useState({
        title: "",
        date: "",
        time: "",
        location: "",
        type: "other",
        color: "blue",
        headline: "", // News field
        isNew: true   // News field
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        const loadAllData = async () => {
            setLoading(true);
            await Promise.all([fetchEvents(), fetchNews()]);
            setLoading(false);
        };
        loadAllData();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await api.get("/events");
            if (res.data.success) {
                setEvents(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching events:", error);
        }
    };

    const fetchNews = async () => {
        try {
            const res = await api.get("/news");
            if (res.data.success) {
                setNewsItems(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching news:", error);
        }
    };

    const handleEditEvent = (event) => {
        setModalType("event");
        setFormState({
            title: event.title,
            date: new Date(event.date).toISOString().split('T')[0],
            time: event.time,
            location: event.location,
            type: event.type,
            color: event.color
        });
        setEditingId(event._id);
        setShowAddModal(true);
    };

    const handleEditNews = (news) => {
        setModalType("news");
        setFormState({
            headline: news.headline,
            isNew: news.isNew
        });
        setEditingId(news._id);
        setShowAddModal(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (modalType === "event") {
                if (editingId) {
                    const res = await api.put(`/events/${editingId}`, formState);
                    if (res.data.success) {
                        setEvents(prev => prev.map(ev => ev._id === editingId ? res.data.data : ev).sort((a, b) => new Date(a.date) - new Date(b.date)));
                    }
                } else {
                    const res = await api.post("/events/create", formState);
                    if (res.data.success) {
                        setEvents(prev => [...prev, res.data.data].sort((a, b) => new Date(a.date) - new Date(b.date)));
                    }
                }
            } else {
                // News handling
                if (editingId) {
                    const res = await api.put(`/news/${editingId}`, formState);
                    if (res.data.success) {
                        setNewsItems(prev => prev.map(n => n._id === editingId ? res.data.data : n));
                    }
                } else {
                    const res = await api.post("/news/create", formState);
                    if (res.data.success) {
                        setNewsItems(prev => [res.data.data, ...prev]);
                    }
                }
            }
            setShowAddModal(false);
            setFormState({ title: "", date: "", time: "", location: "", type: "other", color: "blue", headline: "", isNew: true });
            setEditingId(null);
        } catch (error) {
            console.error(`Error saving ${modalType}:`, error);
            alert(`Failed to save ${modalType}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteEvent = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Delete this event?")) return;
        try {
            const res = await api.delete(`/events/${id}`);
            if (res.data.success) {
                setEvents(prev => prev.filter(ev => ev._id !== id));
            }
        } catch (error) {
            console.error("Error deleting event:", error);
            alert("Failed to delete event");
        }
    };

    const handleDeleteNews = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Delete this news?")) return;
        try {
            const res = await api.delete(`/news/${id}`);
            if (res.data.success) {
                setNewsItems(prev => prev.filter(n => n._id !== id));
            }
        } catch (error) {
            console.error("Error deleting news:", error);
            alert("Failed to delete news");
        }
    };

    const colorMap = {
        purple: "bg-purple-100 text-purple-600 border-purple-200",
        blue: "bg-blue-100 text-blue-600 border-blue-200",
        pink: "bg-pink-100 text-pink-600 border-pink-200",
        green: "bg-green-100 text-green-600 border-green-200",
        orange: "bg-orange-100 text-orange-600 border-orange-200"
    };

    const formatNewsTime = (timestamp) => {
        const diff = Date.now() - new Date(timestamp).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 1) return "Just now";
        if (hours < 24) return `${hours} hours ago`;
        return `${Math.floor(hours / 24)} days ago`;
    };

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
                        <button
                            onClick={() => {
                                setModalType("event");
                                setFormState({ title: "", date: "", time: "", location: "", type: "other", color: "blue", headline: "", isNew: true });
                                setEditingId(null);
                                setShowAddModal(true);
                            }}
                            className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-md font-medium hover:bg-purple-100 transition-colors flex items-center gap-1"
                        >
                            <Plus className="w-3 h-3" /> Add
                        </button>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {loading ? (
                            <div className="p-4 text-center text-gray-400 text-sm animate-pulse">Loading events...</div>
                        ) : events.length === 0 ? (
                            <div className="p-4 text-center text-gray-400 text-sm">No upcoming events</div>
                        ) : (
                            events.map((event) => (
                                <div
                                    key={event._id}
                                    className="p-3 hover:bg-gray-50 transition cursor-pointer group relative"
                                >
                                    <div className="flex gap-3">
                                        <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${colorMap[event.color] || colorMap.blue} border flex flex-col items-center justify-center`}>
                                            <span className="text-xs font-bold">
                                                {new Date(event.date).getDate()}
                                            </span>
                                            <span className="text-[10px] uppercase">
                                                {new Date(event.date).toLocaleString('default', { month: 'short' })}
                                            </span>
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

                                    {/* Action Buttons (Only for creator) */}
                                    {authUser?._id === event.createdBy?._id && (
                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEditEvent(event); }}
                                                className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full"
                                            >
                                                <FiEdit className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteEvent(e, event._id)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* College News */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <Newspaper className="w-4 h-4 text-blue-500" />
                            College News
                        </h3>
                        <button
                            onClick={() => {
                                setModalType("news");
                                setFormState({ title: "", date: "", time: "", location: "", type: "other", color: "blue", headline: "", isNew: true });
                                setEditingId(null);
                                setShowAddModal(true);
                            }}
                            className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-medium hover:bg-blue-100 transition-colors flex items-center gap-1"
                        >
                            <Plus className="w-3 h-3" /> Add
                        </button>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {loading ? (
                            <div className="p-4 text-center text-gray-400 text-sm animate-pulse">Loading news...</div>
                        ) : newsItems.length === 0 ? (
                            <div className="p-4 text-center text-gray-400 text-sm">No updates yet</div>
                        ) : (
                            newsItems.map((news) => (
                                <div
                                    key={news._id}
                                    className="px-4 py-3 hover:bg-gray-50 transition cursor-pointer flex items-start gap-3 group relative"
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
                                        <p className="text-xs text-gray-400 mt-1">{formatNewsTime(news.createdAt)}</p>
                                    </div>

                                    {/* News Actions */}
                                    {authUser?._id === news.createdBy?._id && (
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEditNews(news); }}
                                                className="p-1 text-gray-400 hover:text-blue-500"
                                            >
                                                <FiEdit className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteNews(e, news._id)}
                                                className="p-1 text-gray-400 hover:text-red-500"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                                </div>
                            ))
                        )}
                    </div>
                </div>

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

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">
                                {editingId ? "Edit" : "Add"} {modalType === "event" ? "Event" : "College News"}
                            </h3>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            {modalType === "event" ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Event Title</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all"
                                            placeholder="e.g. Tech Fest 2026"
                                            value={formState.title}
                                            onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date</label>
                                            <input
                                                type="date"
                                                required
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all"
                                                value={formState.date}
                                                onChange={(e) => setFormState({ ...formState, date: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Time</label>
                                            <input
                                                type="time"
                                                required
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all"
                                                value={formState.time}
                                                onChange={(e) => setFormState({ ...formState, time: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all"
                                            placeholder="e.g. Main Auditorium"
                                            value={formState.location}
                                            onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type</label>
                                            <select
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all cursor-pointer"
                                                value={formState.type}
                                                onChange={(e) => setFormState({ ...formState, type: e.target.value })}
                                            >
                                                <option value="other">Other</option>
                                                <option value="festival">Festival</option>
                                                <option value="competition">Competition</option>
                                                <option value="cultural">Cultural</option>
                                                <option value="academic">Academic</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Color Theme</label>
                                            <select
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all cursor-pointer"
                                                value={formState.color}
                                                onChange={(e) => setFormState({ ...formState, color: e.target.value })}
                                            >
                                                <option value="blue">Blue</option>
                                                <option value="purple">Purple</option>
                                                <option value="pink">Pink</option>
                                                <option value="green">Green</option>
                                                <option value="orange">Orange</option>
                                            </select>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Headline</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all"
                                            placeholder="e.g. Placement drive starts next week"
                                            value={formState.headline}
                                            onChange={(e) => setFormState({ ...formState, headline: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 py-2">
                                        <input
                                            type="checkbox"
                                            id="isNew"
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                            checked={formState.isNew}
                                            onChange={(e) => setFormState({ ...formState, isNew: e.target.checked })}
                                        />
                                        <label htmlFor="isNew" className="text-sm font-medium text-gray-700 cursor-pointer">Mark as "NEW"</label>
                                    </div>
                                </>
                            )}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full ${modalType === 'event' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'} text-white py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 mt-4 active:scale-[0.98]`}
                            >
                                {isSubmitting ? "Saving..." : (editingId ? "Save Changes" : `Add ${modalType === 'event' ? 'Event' : 'News'}`)}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RightPanel;
