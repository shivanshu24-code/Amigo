import "./index.css";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./Store/AuthStore.js";
import { usePostStore } from "./Store/PostStore.js";
import { useCallStore } from "./Store/CallStore.js";
import { useChatStore } from "./Store/ChatStore.js";
import { useFriendStore } from "./Store/FriendStore.js";
import { useStoryStore } from "./Store/StoryStore.js";

import SignIn from "./Pages/SignIn.jsx";
import Feed from "./Pages/Feed.jsx";
import VerificationPage from "./Pages/VerificationPage.jsx";
import ProfilePage from "./Pages/ProfilePage.jsx";
import OtherUserProfile from "./Pages/OtherUserProfile.jsx";
import Start from "./Pages/Start.jsx";
import ChatPage from "./Pages/ChatPage.jsx";
import CreateProfile from "./Pages/CreateProfile.jsx";
import Login from "./Pages/Login.jsx";
import Setpassword from "./Pages/Setpassword.jsx";
import UserPage from "./Pages/UserPage.jsx";
import SharedPost from "./Pages/SharedPost.jsx";
import SettingsPage from "./Pages/SettingsPage.jsx";
import TimeManagementPage from "./Pages/TimeManagementPage.jsx";
import useUsageTracker from "./Hooks/useUsageTracker.js";
import SideBar from "./Components/SideBar.jsx";
import Navbar from "./Components/Navbar.jsx";
import VideoCall from "./Components/Chats/VideoCall.jsx";
import IncomingCall from "./Components/Chats/IncomingCall.jsx";
import MobileNavbar from "./Components/MobileNavbar.jsx";
import CreatePostModal from "./Components/Post/CreatePostModal.jsx";
import CreatePost from "./Pages/CreatePost.jsx";
import StoryViewer from "./Components/Story/StoryViewer.jsx";
import CreateStoryModal from "./Components/Story/CreateStoryModal.jsx";
import ArchivePage from "./Pages/ArchivePage.jsx";
import CloseFriendsPage from "./Pages/CloseFriendsPage.jsx";
import PrivacySettingsPage from "./Pages/PrivacySettingsPage.jsx";
import StorySettingsPage from "./Pages/StorySettingsPage.jsx";
import TagsMentionsSettingsPage from "./Pages/TagsMentionsSettingsPage.jsx";
import BlockedPage from "./Pages/BlockedPage.jsx";
import PrivacyCenterPage from "./Pages/PrivacyCenterPage.jsx";
import HelpCenterPage from "./Pages/HelpCenterPage.jsx";
import HelpTopicDetailPage from "./Pages/HelpTopicDetailPage.jsx";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, authChecked } = useAuthStore();

  // if (!authChecked) {
  //   return (
  //     <div className="h-screen flex items-center justify-center">
  //       Loading...
  //     </div>
  //   );
  // }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Pages that should show the app layout (sidebar + navbar)
const APP_PAGES = ['/feed', '/users', '/chat', '/profile', '/settings', '/settings/time-management', '/settings/archive', '/settings/close-friends', '/settings/privacy', '/settings/story-settings', '/settings/tags-mentions', '/settings/blocked', '/settings/privacy-center', '/settings/help-center'];

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const authChecked = useAuthStore((state) => state.authChecked);
  const { callStatus } = useCallStore();
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Reset all stores on logout
  useEffect(() => {
    if (!isAuthenticated) {
      useChatStore.getState().resetStore();
      usePostStore.getState().reset();
      useFriendStore.getState().reset();
      useStoryStore.getState().reset();
      useCallStore.getState().reset();
    }
  }, [isAuthenticated]);


  useEffect(() => {
    if (!authChecked) {
      checkAuth();
    }
  }, [authChecked, checkAuth]);

  // Check if current page should show app layout
  const showAppLayout = APP_PAGES.some(page => location.pathname.startsWith(page));

  // Get Store states for Global Modals
  const { showCreatePostModal, closeCreatePostModal } = usePostStore();
  const {
    viewerOpen,
    viewerStories,
    startIndex,
    closeViewer,
    deleteStory,
    showCreateStoryModal,
    closeCreateStoryModal
  } = useStoryStore();

  useUsageTracker();

  const handleDeleteStory = async (storyId) => {
    await deleteStory(storyId);
  };

  return (
    <>
      {/* Video Call Components - always visible */}
      <VideoCall />
      <IncomingCall />

      {/* Global Create Post Modal */}
      {showCreatePostModal && (
        <CreatePostModal onClose={closeCreatePostModal} />
      )}

      {/* Global Create Story Modal */}
      {showCreateStoryModal && (
        <CreateStoryModal onClose={closeCreateStoryModal} />
      )}

      {showAppLayout ? (
        // App Layout with Navbar and Sidebar
        <div className="flex flex-col h-screen overflow-hidden">
          {/* Top Navbar */}
          <Navbar />

          {/* Main content area with sidebar */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar - fixed width */}
            <aside className="hidden md:flex flex-shrink-0">
              <SideBar />
            </aside>

            {/* Main Content - takes remaining space */}
            <main className="flex-1 overflow-hidden bg-gray-50">
              <Routes>
                <Route
                  path="/feed"
                  element={
                    <ProtectedRoute>
                      <Feed />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute>
                      <UserPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <ChatPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/:userId"
                  element={
                    <ProtectedRoute>
                      <OtherUserProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings/time-management"
                  element={
                    <ProtectedRoute>
                      <TimeManagementPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings/archive"
                  element={
                    <ProtectedRoute>
                      <ArchivePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings/close-friends"
                  element={
                    <ProtectedRoute>
                      <CloseFriendsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings/privacy"
                  element={
                    <ProtectedRoute>
                      <PrivacySettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings/story-settings"
                  element={
                    <ProtectedRoute>
                      <StorySettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings/tags-mentions"
                  element={
                    <ProtectedRoute>
                      <TagsMentionsSettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings/blocked"
                  element={
                    <ProtectedRoute>
                      <BlockedPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings/privacy-center"
                  element={
                    <ProtectedRoute>
                      <PrivacyCenterPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings/help-center"
                  element={
                    <ProtectedRoute>
                      <HelpCenterPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings/help-center/:topicId"
                  element={
                    <ProtectedRoute>
                      <HelpTopicDetailPage />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
          </div>

          {/* Mobile Bottom Navigation - Hide when in call */}
          {callStatus === 'idle' && <MobileNavbar />}
        </div>
      ) : (
        // Auth/Landing pages - no sidebar/navbar
        <Routes>
          <Route path="/" element={<Start />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verification" element={<VerificationPage />} />
          <Route path="/setpassword" element={<Setpassword />} />
          <Route path="/createprofile" element={<CreateProfile />} />
          <Route
            path="/create-post"
            element={
              <ProtectedRoute>
                <CreatePost />
              </ProtectedRoute>
            }
          />
          <Route path="/post/:postId" element={<SharedPost />} />
          <Route path="*" element={<Navigate to="/feed" />} />
        </Routes>
      )}

      {/* 📖 Global Story Viewer */}
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
}

export default App;
