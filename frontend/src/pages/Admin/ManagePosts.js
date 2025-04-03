import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { Table } from 'react-bootstrap';

const ManagePosts = () => {
  // Giả sử bạn có một mảng bài viết (có thể lấy từ API)
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // Giả lập dữ liệu bài viết
    const mockPosts = [
      { id: 1, content: "Bài viết 1: Nội dung bài viết đầu tiên" },
      { id: 2, content: "Bài viết 2: Nội dung bài viết thứ hai" },
      { id: 3, content: "Bài viết 3: Nội dung bài viết thứ ba" },
    ];

    // Cập nhật state với dữ liệu bài viết
    setPosts(mockPosts);
  }, []); // useEffect này chỉ chạy một lần khi component được render

  return (
    <AdminLayout>
      <h2 className="mb-4">Quản lý bài viết</h2>
      <Table bordered className="content-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Nội dung</th>
          </tr>
        </thead>
        <tbody>
          {posts.length > 0 ? (
            posts.map((post) => (
              <tr key={post.id}>
                <td>{post.id}</td>
                <td>{post.content}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="2" className="text-center">
                Không có bài viết nào
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </AdminLayout>
  );
};

export default ManagePosts;
