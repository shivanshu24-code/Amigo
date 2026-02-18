import { create } from "zustand";
import { usePostStore } from "./PostStore";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const useUploadStore = create((set, get) => ({
    isUploading: false,
    progress: 0,
    error: null,
    mediaUrl: "",
    thumbnail: null, // For UI preview

    // Reset store
    reset: () => set({ isUploading: false, progress: 0, error: null, mediaUrl: "", thumbnail: null }),

    // Start background upload
    startUpload: async ({ caption, mediaFile, visibility, aspectRatio, emoji, isArchived }) => {
        set({ isUploading: true, progress: 0, error: null, thumbnail: mediaFile });

        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Not authenticated");

            let uploadedMediaUrl = "";

            // 1️⃣ Upload media if exists
            if (mediaFile) {
                set({ progress: 10 }); // Started

                const formData = new FormData();
                formData.append("file", mediaFile);
                formData.append("upload_preset", "amigo_unsigned");

                // Use XMLHttpRequest for progress tracking
                uploadedMediaUrl = await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open("POST", "https://api.cloudinary.com/v1_1/dojxawpjt/image/upload");

                    xhr.upload.onprogress = (event) => {
                        if (event.lengthComputable) {
                            const percentComplete = Math.round((event.loaded / event.total) * 70); // Max 70% for upload
                            // Only update if greater than current (avoid jitter)
                            const currentProgress = get().progress;
                            if (percentComplete > currentProgress) {
                                set({ progress: percentComplete });
                            }
                        }
                    };

                    xhr.onload = () => {
                        if (xhr.status === 200) {
                            const response = JSON.parse(xhr.responseText);
                            resolve(response.secure_url);
                        } else {
                            reject(new Error("Media upload failed"));
                        }
                    };

                    xhr.onerror = () => reject(new Error("Network error during upload"));

                    xhr.send(formData);
                });
            }

            set({ progress: 80 }); // Media done, creating post...

            // 2️⃣ Create Post via API
            const finalCaption = `${caption || ""}${emoji || ""}`.trim();

            const res = await fetch(`${API_BASE}/post`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    caption: finalCaption,
                    media: uploadedMediaUrl || "",
                    aspectRatio,
                    visibility,
                    isArchived
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Post creation failed");
            }

            set({ progress: 100 });

            // 3️⃣ Refresh feed
            // We use setTimeout to let the user see 100% for a moment
            setTimeout(() => {
                usePostStore.getState().fetchPosts();
                set({ isUploading: false, progress: 0, thumbnail: null });
            }, 1000);

        } catch (err) {
            console.error("Background upload error:", err);
            set({ error: err.message, isUploading: false, progress: 0 }); // Keep error state visible? Or auto-dismiss? 
            // For now, let's reset after a delay or let user dismiss. Simple reset for now.
            alert(`Upload failed: ${err.message}`);
        }
    }
}));
