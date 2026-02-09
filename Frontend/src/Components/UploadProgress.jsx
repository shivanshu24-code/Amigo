import React from 'react';
import { useUploadStore } from '../Store/UploadStore.js';
import { Loader2, Image as ImageIcon, Send } from 'lucide-react';

const UploadProgress = () => {
    const { isUploading, progress, thumbnail, error } = useUploadStore();

    if (!isUploading && !error) return null;

    if (error) {
        // Optional: Error state rendering, but for now we rely on the alert/reset in store.
        return null;
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 p-4 animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-4">
                {/* Thumbnail Preview */}
                <div className="relative w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                    {thumbnail ? (
                        thumbnail.type?.startsWith('video') ? (
                            <video src={URL.createObjectURL(thumbnail)} className="w-full h-full object-cover opacity-80" />
                        ) : (
                            <img src={URL.createObjectURL(thumbnail)} alt="uploading" className="w-full h-full object-cover opacity-80" />
                        )
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Send size={20} />
                        </div>
                    )}
                    {/* Overlay Spinner */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                </div>

                {/* Progress Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1.5">
                        <p className="text-sm font-semibold text-gray-700 truncate">
                            {progress < 100 ? "Posting..." : "Finishing up..."}
                        </p>
                        <span className="text-xs font-medium text-violet-600">{progress}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-300 ease-out rounded-full"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadProgress;
