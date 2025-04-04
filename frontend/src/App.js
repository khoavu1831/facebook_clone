import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Profile from './pages/Profile/Profile';
import Friends from './pages/Friends/Friends';
import Auth from './components/Auth/Auth';
import Admin from './pages/Admin/Admin';
import AdminAuth from './components/AdminAuth/AdminAuth'; 

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Regular user login and register */}
          <Route path="/login" element={<Auth isLogin={true} />} />
          <Route path="/register" element={<Auth isLogin={false} />} />

          {/* Admin login */}
          <Route path="/admin/login" element={<AdminAuth />} />

          {/* Protected routes for regular users */}
          <Route
            path="/*"
            element={
              <>
                <Header />
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/friends" element={<Friends />} />
                </Routes>
              </>
            }
          />

          {/* Admin dashboard route */}
          <Route path="/admin/*" element={<Admin />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;