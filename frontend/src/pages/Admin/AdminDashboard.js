import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import StatCard from './StatCard';
import { Row, Col, Alert } from 'react-bootstrap';
import axios from 'axios';

const AdminDashboard = () => {
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [error, setError] = useState('');

  // Fetch totals on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const postsResponse = await axios.get('http://localhost:8080/api/posts');
        const usersResponse = await axios.get('http://localhost:8080/api/users');
        setTotalPosts(postsResponse.data.length);
        setTotalUsers(usersResponse.data.length);
      } catch (err) {
        setError('Failed to fetch data');
      }
    };
    fetchData();
  }, []);

  return (
    <AdminLayout>
      <h2 className="mb-4 text-2xl font-bold">Dashboard Overview</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Row>
        <Col md={6}>
          <StatCard
            title="Total Posts"
            value={totalPosts}
            description="Number of posts in the system"
          />
        </Col>
        <Col md={6}>
          <StatCard
            title="Total Users"
            value={totalUsers}
            description="Number of registered users"
          />
        </Col>
      </Row>
    </AdminLayout>
  );
};

export default AdminDashboard;