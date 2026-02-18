import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CircleHelp, FileWarning, MessageSquareWarning, Search, ShieldAlert, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { helpCenterTopics } from "../Utils/helpCenterTopics.js";

const topicIcons = {
  "technical-issues": Wrench,
  "privacy-safety": ShieldAlert,
  "abuse-harassment": MessageSquareWarning,
  "account-access": FileWarning,
};

const HelpCenterPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTopics = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return helpCenterTopics.map((topic) => ({
        ...topic,
        matchedFaqs: [],
      }));
    }

    return helpCenterTopics
      .map((topic) => {
        const topicText = `${topic.title} ${topic.summary}`.toLowerCase();
        const matchedFaqs = topic.faqs.filter((faq) =>
          `${faq.question} ${faq.answer}`.toLowerCase().includes(normalizedQuery)
        );

        const topicMatch = topicText.includes(normalizedQuery);
        if (!topicMatch && matchedFaqs.length === 0) return null;

        return {
          ...topic,
          matchedFaqs,
        };
      })
      .filter(Boolean);
  }, [searchQuery]);

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
          <h1 className="text-xl font-bold text-gray-900">Help Center</h1>
          <p className="text-xs text-gray-500">How we help users quickly and safely</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <CircleHelp size={20} className="text-amber-700" />
              <h2 className="text-sm font-bold text-amber-900">We are here to support you</h2>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Our Help Center guides you through common issues, account protection steps, and quick actions to resolve problems.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search help topics and FAQs..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {filteredTopics.map((topic, index) => {
              const Icon = topicIcons[topic.id] || CircleHelp;
              return (
                <button
                  key={topic.title}
                  onClick={() => navigate(`/settings/help-center/${topic.id}`)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${index !== filteredTopics.length - 1 ? "border-b border-gray-100" : ""}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="p-2 rounded-xl bg-gray-50 text-gray-700 h-fit">
                      <Icon size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{topic.title}</p>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">{topic.summary}</p>
                      {searchQuery.trim() && topic.matchedFaqs.length > 0 && (
                        <p className="text-[11px] text-amber-700 mt-1 font-medium">
                          {topic.matchedFaqs.length} FAQ match{topic.matchedFaqs.length > 1 ? "es" : ""}
                        </p>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-gray-300" />
                  </div>
                </button>
              );
            })}
            {filteredTopics.length === 0 && (
              <div className="p-5 text-center">
                <p className="text-sm font-semibold text-gray-800">No help results found</p>
                <p className="text-xs text-gray-500 mt-1">Try another keyword like OTP, privacy, block, or upload.</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900">Need direct support?</h3>
            <p className="text-xs text-gray-600 mt-1">
              Email support at <span className="font-semibold">support@amigo.app</span> with your username, issue details, and screenshots for faster help.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenterPage;
