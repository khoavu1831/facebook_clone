import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import PostForm from '../components/Post/PostForm';
import PostList from '../components/Post/PostList';
import LeftSidebar from '../components/LeftSidebar';
import RightSidebar from '../components/RightSidebar';
import { API_ENDPOINTS } from '../config/api';

/**
 * Trang chủ hiển thị danh sách bài đăng
 */
const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useUser();

  // Lấy danh sách bài đăng khi component được mount hoặc currentUser thay đổi
  useEffect(() => {
    // Chỉ tiếp tục nếu có thông tin người dùng hợp lệ
    if (!currentUser?.id) {
      return;
    }

    /**
     * Lấy danh sách bài đăng từ API
     */
    const fetchPosts = async () => {
      try {
        // Kiểm tra xem người dùng đã đăng nhập chưa
        if (!currentUser?.id) {
          return; // Chỉ return thay vì chuyển hướng
        }

        const response = await fetch(`${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.POSTS}?userId=${currentUser.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('userToken')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Đảm bảo data là một mảng và lọc ra các bài đăng hợp lệ
          setPosts(Array.isArray(data) ? data.filter(post => post && post.id) : []);
        } else {
          setPosts([]);
        }
      } catch (error) {
        console.error('Lỗi khi lấy bài đăng:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [currentUser]); // Thêm currentUser vào dependencies

  // Hiển thị thông báo nếu chưa đăng nhập
  if (!currentUser) {
    return <div className="alert alert-warning m-3">Vui lòng đăng nhập để tiếp tục</div>;
  }

  // Hiển thị trạng thái đang tải
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row" style={{ paddingTop: '60px' }}>
        {/* Thanh bên trái */}
        <LeftSidebar />

        {/* Nội dung chính */}
        <div className="col-6 offset-3">
          {currentUser && (
            <>
              {/* Form tạo bài đăng mới */}
              <PostForm
                onAddPost={(newPost) => setPosts([newPost, ...posts])}
                currentUser={currentUser}
              />

              {/* Danh sách bài đăng */}
              <PostList
                posts={posts}
                currentUser={currentUser}
                userData={currentUser} // Để tương thích ngược
              />
            </>
          )}
        </div>

        {/* Thanh bên phải */}
        <RightSidebar />
      </div>
    </div>
  );
};

export default Home;
