import React, { useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { useChat } from '../contexts/ChatContext';
import { useNavigate } from 'react-router-dom';
import './RightSidebar.css';

/**
 * Component hiển thị danh sách bạn bè ở thanh bên phải
 */
function RightSidebar() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const { openChat, unreadCounts } = useChat();
  const navigate = useNavigate();

  // Thêm hàm xử lý click vào avatar
  const handleAvatarClick = (userId, event) => {
    event.stopPropagation(); // Ngăn sự kiện click lan tỏa đến phần tử cha
    navigate(`/profile/${userId}`);
  };

  // Lấy thông tin người dùng trực tiếp từ localStorage
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Lỗi khi phân tích dữ liệu người dùng:', error);
      return null;
    }
  };

  const user = getUserData();

  // Tham chiếu để theo dõi xem component có được mount hay không
  const isMounted = useRef(true);

  /**
   * Lấy danh sách bạn bè từ API
   */
  const fetchFriends = async () => {
    try {
      if (!user?.id) {
        return;
      }

      // Lấy token xác thực từ localStorage
      const token = localStorage.getItem('userToken');
      if (!token) {
        return;
      }

      setLoading(true);

      const apiUrl = `/api/friends/list/${user.id}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Đọc response dưới dạng text trước
      const responseText = await response.text();

      // Kiểm tra xem response có trống không
      if (!responseText || responseText.trim() === '') {
        setFriends([]);
        return;
      }

      // Thử chuyển đổi thành JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Lỗi khi phân tích JSON:', parseError);
        setFriends([]);
        return;
      }

      // Kiểm tra dữ liệu trả về
      if (Array.isArray(data)) {
        setFriends(data);
      } else if (data && typeof data === 'object') {
        // Nếu là object có thuộc tính error, có thể là lỗi
        if (data.error) {
          console.error('API trả về lỗi:', data.error);
          setFriends([]);
        } else {
          // Nếu là object khác, thử chuyển thành mảng
          const dataArray = Object.values(data).filter(item => item && typeof item === 'object');

          if (dataArray.length > 0) {
            setFriends(dataArray);
          } else {
            setFriends([]);
          }
        }
      } else {
        setFriends([]);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách bạn bè:', error);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách bạn bè khi component được mount
  useEffect(() => {
    if (user?.id) {
      fetchFriends();
    }

    return () => {
      isMounted.current = false;
    };
  }, [user?.id]);

  /**
   * Lấy URL đầy đủ của hình ảnh
   * @param {string} path Đường dẫn hình ảnh
   * @returns {string} URL đầy đủ của hình ảnh
   */
  const getFullImageUrl = (path) => {
    if (!path) return '/default-imgs/avatar.png';
    if (path.startsWith('http')) return path;
    return path; // Đường dẫn tương đối sẽ được xử lý bởi proxy
  };

  return (
    <div className="col-3 position-fixed bg-white"
         style={{ top: '60px', right: '0', height: 'calc(100vh - 60px)', overflowY: 'auto', borderLeft: '1px solid #e4e6eb' }}>
      {/* Phần tiêu đề */}
      <div className="px-3 py-2 border-bottom">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="text-muted fw-bold mb-0">Người liên hệ</h6>
          <div className="d-flex gap-3">
            <i className="bi bi-camera-video text-muted" aria-label="Tạo cuộc gọi video"></i>
            <i className="bi bi-search text-muted" aria-label="Tìm kiếm bạn bè"></i>
            <i className="bi bi-three-dots text-muted" aria-label="Tùy chọn"></i>
          </div>
        </div>
        {loading && <div className="spinner-border spinner-border-sm text-primary mt-2" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>}
      </div>

      {/* Danh sách bạn bè */}
      <div className="friends-list">
        {loading ? (
          <div className="text-center p-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
            <p className="mt-2 text-muted">Đang tải danh sách bạn bè...</p>
          </div>
        ) : Array.isArray(friends) && friends.length > 0 ? (
          <ul className="list-unstyled mb-0">
            {friends.map(friend => (
              <li
                key={friend.id || Math.random()}
                className="px-2 py-2 mx-1 my-1 d-flex align-items-center justify-content-between rounded-3 contact-item"
                onClick={() => openChat(friend)}
                aria-label={`Bắt đầu trò chuyện với ${friend.firstName || ''} ${friend.lastName || ''}`}
                role="button"
                tabIndex="0"
              >
                <div className="d-flex align-items-center gap-2">
                  <div className="position-relative" title="Click để xem hồ sơ">
                    <img
                      src={getFullImageUrl(friend.avatar)}
                      alt={`Ảnh đại diện của ${friend.firstName || ''} ${friend.lastName || ''}`}
                      className="rounded-circle avatar-clickable"
                      style={{ width: '36px', height: '36px', objectFit: 'cover', cursor: 'pointer' }}
                      onClick={(e) => handleAvatarClick(friend.id, e)}
                      onError={(e) => {
                        e.target.src = '/default-imgs/avatar.png';
                      }}
                    />
                    {/* Chỉ báo trạng thái online */}
                    <span
                      className="position-absolute bg-success rounded-circle"
                      style={{ width: '8px', height: '8px', bottom: '2px', right: '2px', border: '1px solid white' }}
                      aria-label="Đang hoạt động"
                    ></span>
                  </div>
                  <span className="text-dark">{`${friend.firstName || ''} ${friend.lastName || ''}`}</span>
                </div>
                {/* Hiển thị số tin nhắn chưa đọc */}
                {unreadCounts[friend.id] > 0 && (
                  <span className="badge rounded-pill bg-danger" aria-label={`${unreadCounts[friend.id]} tin nhắn chưa đọc`}>
                    {unreadCounts[friend.id]}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center text-muted p-3">
            <i className="bi bi-people fs-1 mb-2 d-block"></i>
            <p>Chưa có bạn bè nào</p>
            <small className="d-block mt-2">Hãy gửi lời mời kết bạn để bắt đầu kết nối</small>
          </div>
        )}
      </div>

      {/* CSS tùy chỉnh */}
      <style jsx="true">{`
        .contact-item:hover {
          background-color: #f0f2f5;
          cursor: pointer;
        }
        .friends-list {
          max-height: calc(100vh - 110px);
          overflow-y: auto;
        }
        .friends-list::-webkit-scrollbar {
          width: 8px;
        }
        .friends-list::-webkit-scrollbar-thumb {
          background-color: #c2c2c2;
          border-radius: 10px;
        }
        .friends-list::-webkit-scrollbar-track {
          background-color: transparent;
        }
      `}</style>
    </div>
  );
}

export default RightSidebar;
