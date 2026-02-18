import React, { useEffect, useState } from "react";
import { ChevronLeft, Database, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../Store/AuthStore.js";

const PrivacyCenterPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [agreed, setAgreed] = useState(false);
  const [savedAt, setSavedAt] = useState("");

  const agreementStorageKey = `privacy_center_agreement_${user?._id || "guest"}`;

  useEffect(() => {
    const storedAgreement = localStorage.getItem(agreementStorageKey);
    const storedDate = localStorage.getItem(`${agreementStorageKey}_date`);
    setAgreed(storedAgreement === "true");
    setSavedAt(storedDate || "");
  }, [agreementStorageKey]);

  const handleAgreementToggle = () => {
    const nextValue = !agreed;
    const timestamp = nextValue ? new Date().toLocaleString() : "";

    setAgreed(nextValue);
    setSavedAt(timestamp);

    localStorage.setItem(agreementStorageKey, String(nextValue));
    if (nextValue) {
      localStorage.setItem(`${agreementStorageKey}_date`, timestamp);
    } else {
      localStorage.removeItem(`${agreementStorageKey}_date`);
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
          <h1 className="text-xl font-bold text-gray-900">Privacy Center</h1>
          <p className="text-xs text-gray-500">How Amigo protects your data and safety</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="text-indigo-600" size={20} />
              <h2 className="text-sm font-bold text-indigo-900">Your safety is our priority</h2>
            </div>
            <p className="text-xs text-indigo-800 leading-relaxed">
              We use secure authentication, encrypted chat flows, and account controls to help keep your conversations and account data safe.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex gap-3">
              <div className="p-2 rounded-xl bg-gray-50 text-gray-700 h-fit">
                <Lock size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Secure account protection</p>
                <p className="text-xs text-gray-600 mt-1">Login sessions and account access are protected with token-based auth and verification flow support.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 rounded-xl bg-gray-50 text-gray-700 h-fit">
                <Database size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Data handling and storage</p>
                <p className="text-xs text-gray-600 mt-1">We only store data needed to provide app features, and your privacy settings control who can access your content.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 rounded-xl bg-gray-50 text-gray-700 h-fit">
                <EyeOff size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">User controls</p>
                <p className="text-xs text-gray-600 mt-1">You can manage account privacy, tags and mentions, story controls, and blocked users from settings anytime.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Privacy Agreement</h3>
                <p className="text-xs text-gray-600 mt-1">
                  I understand how Amigo handles my data and agree to these privacy protections.
                </p>
                {savedAt && (
                  <p className="text-[11px] text-green-600 mt-2">
                    Agreement saved on {savedAt}
                  </p>
                )}
              </div>
              <button
                onClick={handleAgreementToggle}
                className={`w-12 h-6 rounded-full relative transition-colors duration-300 shadow-inner ${agreed ? "bg-green-600" : "bg-gray-300"}`}
                aria-label="Privacy agreement toggle"
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${agreed ? "translate-x-6" : ""}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyCenterPage;
