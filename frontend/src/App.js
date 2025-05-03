import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import { ToastProvider } from './context/ToastContext';
import { ChatProvider } from './contexts/ChatContext';
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
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';

// Component bảo vệ route - chỉ cho phép truy cập khi đã đăng nhập
const ProtectedRoute = ({ children }) => {
  // Kiểm tra đăng nhập dựa trên sự hiện diện của token
  // Cách này cho phép ứng dụng hoạt động ngay cả khi xác thực token thất bại
  const hasToken = !!localStorage.getItem('userToken');

  if (!hasToken) {
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
              {/* Routes công khai - không cần đăng nhập */}
              <Route path="/login" element={<Auth isLogin={true} />} />
              <Route path="/register" element={<Auth isLogin={false} />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/admin/login" element={<AdminAuth />} />

              {/* Routes được bảo vệ - chỉ dành cho người dùng đã đăng nhập */}
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

              {/* Routes dành cho admin */}
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
