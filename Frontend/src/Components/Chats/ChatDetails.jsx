import React from 'react';
import { FiX, FiImage, FiFile, FiLink, FiBell, FiBellOff } from 'react-icons/fi';
import { BsFileEarmarkPdf, BsFileEarmarkText } from 'react-icons/bs';

const ChatDetails = ({ friend, onClose }) => {
    // Mock shared media data
    const sharedMedia = [
        { id: 1, type: 'image', url: 'https://picsum.photos/100/100?random=1' },
        { id: 2, type: 'image', url: 'https://picsum.photos/100/100?random=2' },
        { id: 3, type: 'image', url: 'https://picsum.photos/100/100?random=3' },
        { id: 4, type: 'image', url: 'https://picsum.photos/100/100?random=4' },
    ];

    const sharedFiles = [
        { id: 1, name: 'Document.pdf', size: '1 MB', type: 'pdf' },
        { id: 2, name: 'Doctor Appointment', size: '10 KB', type: 'doc' },
        { id: 3, name: 'Essay - Biology', size: '200 KB', type: 'doc' },
        { id: 4, name: 'Document.pdf', size: '1 MB', type: 'pdf' },
    ];

    const sharedLinks = [
        { id: 1, name: 'LinkedIn profile', url: 'https://linkedin.com', icon: 'in' },
        { id: 2, name: 'Online game', url: 'https://game.com', icon: 'game' },
        { id: 3, name: 'Video', url: 'https://youtube.com', icon: 'video' },
    ];

    return (
        <div className="w-[300px] bg-white border-l border-gray-200 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Chat details</h2>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <FiX className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {/* Quick Actions */}
            <div className="flex justify-center gap-4 py-4 border-b border-gray-200">
                <button className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-200 transition-colors">
                    <FiImage className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-200 transition-colors">
                    <FiFile className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-200 transition-colors">
                    <FiLink className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 bg-red-100 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-200 transition-colors">
                    <FiBellOff className="w-5 h-5" />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Shared Media Section */}
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900">Shared media (286)</h3>
                        <button className="text-indigo-600 text-sm hover:underline">›</button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {sharedMedia.map(media => (
                            <div
                                key={media.id}
                                className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                            >
                                <img src={media.url} alt="" className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Shared Files Section */}
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900">Shared files (4)</h3>
                        <button className="text-indigo-600 text-sm hover:underline">›</button>
                    </div>
                    <div className="space-y-2">
                        {sharedFiles.map(file => (
                            <div
                                key={file.id}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    {file.type === 'pdf' ? (
                                        <BsFileEarmarkPdf className="w-5 h-5 text-red-500" />
                                    ) : (
                                        <BsFileEarmarkText className="w-5 h-5 text-blue-500" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                    <p className="text-xs text-gray-400">{file.size}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Shared Links Section */}
                <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900">Shared links (3)</h3>
                        <button className="text-indigo-600 text-sm hover:underline">›</button>
                    </div>
                    <div className="space-y-2">
                        {sharedLinks.map(link => (
                            <div
                                key={link.id}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${link.icon === 'in' ? 'bg-blue-100' :
                                        link.icon === 'game' ? 'bg-purple-100' : 'bg-red-100'
                                    }`}>
                                    {link.icon === 'in' && <span className="text-blue-600 font-bold text-sm">in</span>}
                                    {link.icon === 'game' && <span className="text-purple-600 text-lg">🎮</span>}
                                    {link.icon === 'video' && <span className="text-red-600 text-lg">▶</span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">{link.name}</p>
                                    <p className="text-xs text-indigo-500 truncate">{link.url}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatDetails;
