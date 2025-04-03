import React from 'react';
import StatCard from './StatCard';
import AdminLayout from './AdminLayout';
import { Row, Col } from 'react-bootstrap';

const AdminDashboard = () => {
  const totalPosts = 150;
  const totalUsers = 45;

  return (
    <AdminLayout>
      <h2 className="mb-4">Trang Tổng Quan</h2>
      <Row>
        <Col md={6}>
          <StatCard
            title="Tổng bài viết"
            value={totalPosts}
            description="Số lượng bài viết hiện tại"
          />
        </Col>
        <Col md={6}>
          <StatCard
            title="Tổng người dùng"
            value={totalUsers}
            description="Số lượng người dùng hiện tại"
          />
        </Col>
      </Row>
    </AdminLayout>
  );
};

export default AdminDashboard;