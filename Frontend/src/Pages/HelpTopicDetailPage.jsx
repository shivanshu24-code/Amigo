import React, { useMemo, useState } from "react";
import { ChevronLeft, Search } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { helpCenterTopics } from "../Utils/helpCenterTopics.js";

const HelpTopicDetailPage = () => {
  const navigate = useNavigate();
  const { topicId } = useParams();
  const topic = helpCenterTopics.find((item) => item.id === topicId);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = useMemo(() => {
    if (!topic) return [];
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return topic.faqs;

    return topic.faqs.filter((faq) =>
      `${faq.question} ${faq.answer}`.toLowerCase().includes(normalizedQuery)
    );
  }, [topic, searchQuery]);

  if (!topic) {
    return (
      <div className="h-full bg-white flex flex-col">
        <div className="flex items-center gap-4 px-4 py-4 border-b border-gray-100">
          <button
            onClick={() => navigate("/settings/help-center")}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <ChevronLeft size={24} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Help topic not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="flex items-center gap-4 px-4 py-4 border-b border-gray-100">
        <button
          onClick={() => navigate("/settings/help-center")}
          className="p-2 hover:bg-gray-50 rounded-full transition-colors"
        >
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{topic.title}</h1>
          <p className="text-xs text-gray-500">FAQ and quick help</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
            <p className="text-sm font-semibold text-gray-900">{topic.summary}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search this topic FAQs..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300"
              />
            </div>
          </div>

          {filteredFaqs.map((faq) => (
            <div key={faq.question} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-900">{faq.question}</h3>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">{faq.answer}</p>
            </div>
          ))}

          {filteredFaqs.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-sm font-semibold text-gray-800">No FAQs found</p>
              <p className="text-xs text-gray-500 mt-1">Try another keyword for this topic.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpTopicDetailPage;
