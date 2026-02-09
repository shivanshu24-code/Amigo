import { useEffect } from "react";
import StoryViewer from "./Story/StoryViewer.jsx";
import AddStory from "./Story/AddStory.jsx";
import { useStoryStore } from "../Store/StoryStore.js";
import { useAuthStore } from "../Store/AuthStore.js";
import Avatar from "./Avatar.jsx";

const Story = () => {
    // Use StoryStore
    const {
        viewerOpen,
        viewerStories,
        startIndex,
        fetchStories,
        deleteStory,
        getGroupedStories,
        openViewer,
        closeViewer,
    } = useStoryStore();

    useEffect(() => {
        fetchStories();
    }, []);

    const { user } = useAuthStore();
    const grouped = getGroupedStories();

    // Separate my stories from others
    const myStoriesGroup = user ? grouped[user._id] : null;
    const myStories = myStoriesGroup ? myStoriesGroup.stories : [];

    // Filter out my stories from the main list
    const otherStories = Object.values(grouped).filter(group => group.author._id !== user?._id);

    const handleDeleteStory = async (storyId) => {
        await deleteStory(storyId);
    };

    const openUserStories = (userStories) => {
        openViewer(userStories, 0);
    };

    return (
        <>
            <div className="w-screen bg-white">
                <div className="flex gap-4 mb-0 overflow-x-auto px-1">
                    {/* ➕ Add Story / Your Story */}
                    <AddStory
                        onUploaded={fetchStories}
                        myStories={myStories}
                        onViewStory={() => openUserStories(myStories)}
                    />

                    {/* 👤 Story Avatars */}
                    {otherStories.map(({ author, stories }) => (
                        <div
                            key={author._id}
                            onClick={() => openUserStories(stories)}
                            className="flex flex-col items-center cursor-pointer min-w-[64px]"
                        >
                            <div className="p-0.5 rounded-full bg-gradient-to-tr from-yellow-400 to-fuchsia-600">
                                <Avatar
                                    src={author.avatar}
                                    name={author.firstname ? `${author.firstname} ${author.lastname}` : author.username}
                                    className="w-16 h-16 rounded-full border-2 border-white text-xl"
                                />
                            </div>
                            <p className="text-[11px] mt-1 text-gray-700 truncate w-16 text-center">
                                {author.username || "User"}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* 📖 Story Viewer */}
            {viewerOpen && (
                <StoryViewer
                    stories={viewerStories}
                    startIndex={startIndex}
                    onClose={closeViewer}
                    onDelete={handleDeleteStory}
                />
            )}
        </>
    );
};

export default Story;
