import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import { isUserLoggedIn } from './utils/auth';
import Header from './components/Header';
import ChatForm from './components/ChatForm';
import Home from './pages/Home';
import Profile from './pages/Profile/Profile';
import Friends from './pages/Friends/Friends';
import Auth from './components/Auth/Auth';
import Admin from './pages/Admin/Admin';
import AdminAuth from './components/AdminAuth/AdminAuth';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  if (!isUserLoggedIn()) {
    return <Navigate to="/login" />;
  }
  return children;
};

function App() {
  return (
    <UserProvider>
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
                      <Route path="/friends" element={<Friends />} />
                    </Routes>
                    <ChatForm />
                  </>
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route path="/admin/*" element={<Admin />} />
          </Routes>
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;
