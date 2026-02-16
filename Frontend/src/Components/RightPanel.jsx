import React, { useState, useEffect } from "react";
import { Calendar, Newspaper, Users, ChevronRight, MapPin, Clock, Sparkles, Plus, Trash2, X } from "lucide-react";
import { FiEdit } from "react-icons/fi";
import api from "../Services/Api.js"; // Use configured api instance
import { useAuthStore } from "../Store/AuthStore";

// Configure axios base URL if not already global
// axios.defaults.baseURL = "http://localhost:3000/api";

const RightPanel = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const { user: authUser } = useAuthStore();

    // Form State
    const [newEvent, setNewEvent] = useState({
        title: "",
        date: "",
        time: "",
        location: "",
        type: "other",
        color: "blue"
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingEventId, setEditingEventId] = useState(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await api.get("/events");
            if (res.data.success) {
                setEvents(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching events:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (event) => {
        setNewEvent({
            title: event.title,
            date: new Date(event.date).toISOString().split('T')[0],
            time: event.time,
            location: event.location,
            type: event.type,
            color: event.color
        });
        setEditingEventId(event._id);
        setShowAddModal(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        console.log("Submitting Event Data:", newEvent);
        try {
            if (editingEventId) {
                // Update existing event
                const res = await api.put(`/events/${editingEventId}`, newEvent);
                if (res.data.success) {
                    setEvents(prev => prev.map(ev => ev._id === editingEventId ? res.data.data : ev).sort((a, b) => new Date(a.date) - new Date(b.date)));
                }
            } else {
                // Create new event
                const res = await api.post("/events/create", newEvent);
                if (res.data.success) {
                    setEvents(prev => [...prev, res.data.data].sort((a, b) => new Date(a.date) - new Date(b.date)));
                }
            }
            setShowAddModal(false);
            setNewEvent({ title: "", date: "", time: "", location: "", type: "other", color: "blue" });
            setEditingEventId(null);
        } catch (error) {
            console.error("Error saving event:", error);
            alert("Failed to save event");
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

    const colorMap = {
        purple: "bg-purple-100 text-purple-600 border-purple-200",
        blue: "bg-blue-100 text-blue-600 border-blue-200",
        pink: "bg-pink-100 text-pink-600 border-pink-200",
        green: "bg-green-100 text-green-600 border-green-200",
        orange: "bg-orange-100 text-orange-600 border-orange-200"
    };

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
                                setNewEvent({ title: "", date: "", time: "", location: "", type: "other", color: "blue" });
                                setEditingEventId(null);
                                setShowAddModal(true);
                            }}
                            className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-md font-medium hover:bg-purple-100 transition-colors flex items-center gap-1"
                        >
                            <Plus className="w-3 h-3" /> Add
                        </button>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {loading ? (
                            <div className="p-4 text-center text-gray-400 text-sm">Loading events...</div>
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
                                            <div className="flex items-center gap-1 mt-1">
                                                <span className="text-[10px] text-gray-400">
                                                    By {event.createdBy?.username || "Unknown"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons (Only for creator) */}
                                    {authUser?._id?.toString() === event.createdBy?._id?.toString() && (
                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEditClick(event); }}
                                                className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full"
                                                title="Edit event"
                                            >
                                                <FiEdit className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteEvent(e, event._id)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                                                title="Delete event"
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
                        {/* <button className="text-xs text-purple-600 font-medium hover:text-purple-700">
                            See all
                        </button> */}
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

            {/* Add/Edit Event Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-scale-up">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">
                                {editingEventId ? "Edit Event" : "Add New Event"}
                            </h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all"
                                    placeholder="e.g. Tech Fest 2026"
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all"
                                        value={newEvent.date}
                                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all"
                                        value={newEvent.time}
                                        onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all"
                                    placeholder="e.g. Main Auditorium"
                                    value={newEvent.location}
                                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all"
                                        value={newEvent.type}
                                        onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                                    >
                                        <option value="other">Other</option>
                                        <option value="festival">Festival</option>
                                        <option value="competition">Competition</option>
                                        <option value="cultural">Cultural</option>
                                        <option value="academic">Academic</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Color Theme</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all"
                                        value={newEvent.color}
                                        onChange={(e) => setNewEvent({ ...newEvent, color: e.target.value })}
                                    >
                                        <option value="blue">Blue</option>
                                        <option value="purple">Purple</option>
                                        <option value="pink">Pink</option>
                                        <option value="green">Green</option>
                                        <option value="orange">Orange</option>
                                    </select>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? (editingEventId ? "Saving..." : "Adding...") : (editingEventId ? "Save Changes" : "Add Event")}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RightPanel;
