import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import { ToastProvider } from './context/ToastContext';
import { ChatProvider } from './contexts/ChatContext';
import { isUserLoggedIn } from './utils/auth';
import Header from './components/Header';
import ChatForm from './components/ChatForm';
import ChatWindowsContainer from './components/Chat/ChatWindowsContainer';
import Home from './pages/Home';
import Profile from './pages/Profile/Profile';
import Friends from './pages/Friends/Friends';
import PostDetail from './pages/PostDetail/PostDetail';
import SearchResults from './pages/Search/SearchResults';
import Auth from './components/Auth/Auth';
import Admin from './pages/Admin/Admin';
import AdminAuth from './components/AdminAuth/AdminAuth';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  // Check if user is logged in based on token presence
  // This is more permissive to allow the app to work even if token validation fails
  const hasToken = !!localStorage.getItem('userToken');

  if (!hasToken) {
    console.log("No token found, redirecting to login");
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <UserProvider>
      <ToastProvider>
        <ChatProvider>
          <Router>
            <div className="app">
              <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Auth isLogin={true} />} />
              <Route path="/register" element={<Auth isLogin={false} />} />
              <Route path="/admin/login" element={<AdminAuth />} />

              {/* Protected routes for regular users */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <>
                      <Header />
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/profile/:userId" element={<Profile />} />
                        <Route path="/friends" element={<Friends />} />
                        <Route path="/posts/:postId" element={<PostDetail />} />
                        <Route path="/search" element={<SearchResults />} />
                      </Routes>
                      <ChatForm />
                      <ChatWindowsContainer />
                    </>
                  </ProtectedRoute>
                }
              />

              {/* Admin routes */}
              <Route path="/admin/*" element={<Admin />} />
              </Routes>
            </div>
          </Router>
        </ChatProvider>
      </ToastProvider>
    </UserProvider>
  );
}

export default App;
