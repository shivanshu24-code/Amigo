import React, { useEffect, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";
import { Clock, ChevronLeft, Calendar, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../Services/Api";

const TimeManagementPage = () => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [average, setAverage] = useState(0);

    useEffect(() => {
        const fetchUsage = async () => {
            try {
                const res = await api.get("/usage");
                if (res.data.success) {
                    setData(res.data.data);
                    // Calculate average
                    const totalMinutes = res.data.data.reduce((acc, curr) => acc + curr.minutes, 0);
                    setAverage(Math.round(totalMinutes / 7));
                }
            } catch (error) {
                console.error("Failed to fetch usage data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsage();
    }, []);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-black/80 backdrop-blur-md text-white px-3 py-2 rounded-lg text-xs shadow-xl border border-white/10">
                    <p className="font-bold mb-1">{payload[0].payload.date}</p>
                    <p className="opacity-90">{payload[0].value} minutes</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-full bg-white overflow-y-auto pb-20">
            <div className="max-w-2xl mx-auto py-6 px-4">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate("/settings")}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ChevronLeft size={24} className="text-gray-700" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">Time spent</h1>
                </div>

                {/* Stats Card */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white mb-8 shadow-lg shadow-indigo-200">
                    <div className="flex items-center gap-2 opacity-80 mb-6">
                        <Clock size={16} />
                        <span className="text-sm font-medium">Daily average</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-5xl font-black">{average}</h2>
                        <span className="text-lg opacity-80 font-medium">min</span>
                    </div>
                    <p className="mt-4 text-sm opacity-70 leading-relaxed max-w-[280px]">
                        Average time you spent per day using the Amigo app on this device over the last week.
                    </p>
                </div>

                {/* Chart Section */}
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-6 px-2">
                        <h3 className="font-bold text-gray-900">Weekly Activity</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                            <Calendar size={14} />
                            <span>Last 7 Days</span>
                        </div>
                    </div>

                    <div className="h-64 w-full">
                        {loading ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="dayName"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }}
                                        dy={10}
                                    />
                                    <YAxis hide domain={[0, 'auto']} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6', radius: 4 }} />
                                    <Bar
                                        dataKey="minutes"
                                        radius={[6, 6, 6, 6]}
                                        barSize={32}
                                    >
                                        {data.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={index === data.length - 1 ? '#4f46e5' : '#e0e7ff'}
                                                className="transition-all duration-300 hover:fill-indigo-500"
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Info Section */}
                <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100 flex gap-4">
                    <div className="p-2 bg-blue-100 rounded-full h-fit text-blue-600">
                        <Info size={18} />
                    </div>
                    <div>
                        <h4 className="font-bold text-blue-900 text-sm mb-1">Set daily reminders</h4>
                        <p className="text-xs text-blue-800/70 leading-normal">
                            Managing your time on social media can help you stay balanced. Try setting a reminder to take a break after 30 minutes of use.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimeManagementPage;
