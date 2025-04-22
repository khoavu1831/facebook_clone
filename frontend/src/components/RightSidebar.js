import React, { useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS } from '../config/api';

function RightSidebar() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get user data directly from localStorage
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  };

  const user = getUserData();

  // Reference to track if component is mounted
  const isMounted = useRef(true);

  const fetchFriends = async () => {
    try {
      if (!user?.id) {
        console.warn('User ID not found');
        return;
      }

      // Lấy token xác thực từ localStorage
      const token = localStorage.getItem('userToken');
      if (!token) {
        console.warn('Authentication token not found');
        return;
      }

      setLoading(true);
      console.log('%c===== FETCHING FRIENDS =====', 'background: #3b5998; color: white; padding: 2px 5px;');
      console.log('Fetching friends for user ID:', user.id);
      console.log('Using token:', token.substring(0, 10) + '...');

      // Kiểm tra dữ liệu người dùng trong localStorage
      console.log('User data from localStorage:', user);

      const apiUrl = `/api/friends/list/${user.id}`;
      console.log('API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', [...response.headers.entries()]);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Đọc response dưới dạng text trước
      const responseText = await response.text();
      console.log('%c===== API RESPONSE =====', 'background: #4CAF50; color: white; padding: 2px 5px;');
      console.log('Raw response text:', responseText);

      // Kiểm tra xem response có trống không
      if (!responseText || responseText.trim() === '') {
        console.warn('Empty response from API');
        setFriends([]);
        return;
      }

      // Thử chuyển đổi thành JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Friends data parsed:', data);
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        setFriends([]);
        return;
      }

      // Kiểm tra dữ liệu trả về
      if (Array.isArray(data)) {
        console.log('%c===== FRIENDS DATA =====', 'background: #FF9800; color: white; padding: 2px 5px;');
        console.log('Data is an array with', data.length, 'items');

        if (data.length === 0) {
          console.warn('Friends array is empty');
          setFriends([]);
        } else {
          console.log('First friend:', data[0]);
          console.log('All friends:', data);
          setFriends(data);
          console.log('Friends loaded successfully!');
        }
      } else if (data && typeof data === 'object') {
        console.warn('Data is an object, not an array:', data);
        // Nếu là object có thuộc tính error, có thể là lỗi
        if (data.error) {
          console.error('API returned error:', data.error);
        } else {
          // Nếu là object khác, thử chuyển thành mảng
          console.log('Trying to convert object to array...');
          const dataArray = Object.values(data).filter(item => item && typeof item === 'object');
          console.log('Converted object to array:', dataArray);

          if (dataArray.length > 0) {
            console.log('First item after conversion:', dataArray[0]);
            setFriends(dataArray);
            console.log('Friends loaded from converted object!');
          } else {
            console.warn('No valid items after conversion');
            setFriends([]);
          }
        }
      } else {
        console.warn('Data is neither array nor object:', data);
        setFriends([]);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      // Fetch friends when component mounts
      fetchFriends();
    }

    return () => {
      isMounted.current = false;
    };
  }, [user?.id]);

  const getFullImageUrl = (path) => {
    if (!path) return '/default-imgs/avatar.png';
    if (path.startsWith('http')) return path;
    return path; // Đường dẫn tương đối sẽ được xử lý bởi proxy
  };

  return (
    <div className="col-3 position-fixed bg-white"
         style={{ top: '60px', right: '0', height: 'calc(100vh - 60px)', overflowY: 'auto', borderLeft: '1px solid #e4e6eb' }}>
      {/* Header */}
      <div className="px-3 py-2 border-bottom">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="text-muted fw-bold mb-0">Người liên hệ</h6>
          <div className="d-flex gap-3">
            <i className="bi bi-camera-video text-muted"></i>
            <i className="bi bi-search text-muted"></i>
            <i className="bi bi-three-dots text-muted"></i>
          </div>
        </div>
        {loading && <div className="spinner-border spinner-border-sm text-primary mt-2" role="status"></div>}
      </div>

      {/* Friends List */}
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
              <li key={friend.id || Math.random()} className="px-2 py-2 mx-1 my-1 d-flex align-items-center gap-2 rounded-3 contact-item">
                <div className="position-relative">
                  <img
                    src={getFullImageUrl(friend.avatar)}
                    alt={`${friend.firstName || ''} ${friend.lastName || ''}`}
                    className="rounded-circle"
                    style={{ width: '36px', height: '36px', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.src = '/default-imgs/avatar.png';
                    }}
                  />
                  <span className="position-absolute bg-success rounded-circle"
                        style={{ width: '8px', height: '8px', bottom: '2px', right: '2px', border: '1px solid white' }}></span>
                </div>
                <span className="text-dark">{`${friend.firstName || ''} ${friend.lastName || ''}`}</span>
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

      {/* Custom CSS */}
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
