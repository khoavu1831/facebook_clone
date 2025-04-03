import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { Table } from 'react-bootstrap';

const ManageUsers = () => {
  // Giả sử bạn có một mảng người dùng (có thể lấy từ API)
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Giả lập dữ liệu người dùng
    const mockUsers = [
      { id: 1, username: "user1", email: "user1@example.com" },
      { id: 2, username: "user2", email: "user2@example.com" },
      { id: 3, username: "user3", email: "user3@example.com" },
    ];

    // Cập nhật state với dữ liệu người dùng
    setUsers(mockUsers);
  }, []); // useEffect này chỉ chạy một lần khi component được render

  return (
    <AdminLayout>
      <h2 className="mb-4">Quản lý người dùng</h2>
      <Table bordered className="content-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Tên người dùng</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="text-center">
                Không có người dùng nào
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </AdminLayout>
  );
};

export default ManageUsers;
