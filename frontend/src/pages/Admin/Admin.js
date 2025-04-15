import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import ManagePosts from './ManagePosts';
import ManageUsers from './ManageUsers';

const Admin = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/admin/login');
    }
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
      <Route path="/manage-posts" element={<ManagePosts />} />
      <Route path="/manage-users" element={<ManageUsers />} />
    </Routes>
  );
};

export default Admin;