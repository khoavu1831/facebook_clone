import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api';
import PostList from '../../components/Post/PostList';
import LeftSidebar from '../../components/LeftSidebar';
import RightSidebar from '../../components/RightSidebar';
import { useUser } from '../../contexts/UserContext';
import { useToast } from '../../context/ToastContext';
import './SearchResults.css';

/**
 * Trang hiển thị kết quả tìm kiếm bài viết
 */
const SearchResults = () => {
  const location = useLocation();
  const { currentUser } = useUser();
  const { showError } = useToast();
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lấy query từ URL
  const query = new URLSearchParams(location.search).get('q');

  /**
   * Lấy kết quả tìm kiếm khi query hoặc currentUser thay đổi
   */
  useEffect(() => {
    /**
     * Hàm lấy kết quả tìm kiếm từ API
     */
    const fetchSearchResults = async () => {
      // Nếu không có query, không cần tìm kiếm
      if (!query) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Gọi API tìm kiếm bài viết
        const response = await fetch(
          `${API_ENDPOINTS.BASE_URL}/api/posts/search?query=${encodeURIComponent(query)}${
            currentUser ? `&userId=${currentUser.id}` : ''
          }`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('userToken')}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Không thể tìm kiếm bài viết');
        }

        // Xử lý dữ liệu trả về
        const data = await response.json();
        setSearchResults(data);
      } catch (err) {
        console.error('Lỗi khi tìm kiếm:', err);
        setError(err.message);
        showError('Đã xảy ra lỗi khi tìm kiếm. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query, currentUser, showError]);

  return (
    <div className="container-fluid">
      <div className="row" style={{ paddingTop: '60px' }}>
        {/* Thanh bên trái */}
        <LeftSidebar />

        {/* Nội dung chính */}
        <div className="col-6 offset-3">
          <div className="search-results-container">
            <h3 className="mb-4">Kết quả tìm kiếm cho: "{query}"</h3>

            {/* Hiển thị trạng thái đang tải */}
            {loading ? (
              <div className="d-flex justify-content-center my-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Đang tải...</span>
                </div>
              </div>
            ) : error ? (
              /* Hiển thị thông báo lỗi */
              <div className="alert alert-danger" role="alert">{error}</div>
            ) : searchResults.length === 0 ? (
              /* Hiển thị thông báo không tìm thấy kết quả */
              <div className="alert alert-info" role="alert">
                Không tìm thấy bài viết nào phù hợp với từ khóa "{query}"
              </div>
            ) : (
              /* Hiển thị kết quả tìm kiếm */
              <>
                <p className="text-muted mb-4">Tìm thấy {searchResults.length} bài viết</p>
                <PostList posts={searchResults} currentUser={currentUser} />
              </>
            )}
          </div>
        </div>

        {/* Thanh bên phải */}
        <RightSidebar />
      </div>
    </div>
  );
};

export default SearchResults;
