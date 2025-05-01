import React, { createContext, useState, useContext, useEffect } from 'react';
import { getUserData } from '../utils/auth';
import { API_ENDPOINTS } from '../config/api';

/**
 * Context để quản lý thông tin người dùng trong toàn bộ ứng dụng
 */
const UserContext = createContext();

/**
 * Provider cung cấp thông tin người dùng cho toàn bộ ứng dụng
 * @param {Object} props - Props của component
 * @param {React.ReactNode} props.children - Các component con
 */
export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tải thông tin người dùng khi component được mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = getUserData();

        // Luôn kiểm tra token, ngay cả khi đã có userData
        const token = localStorage.getItem('userToken');

        if (!token) {
          localStorage.removeItem('userData');
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        // Nếu có userData trong localStorage, sử dụng nó trước để tránh màn hình trống
        if (userData) {
          setCurrentUser(userData);
        }

        // Luôn gọi API để xác thực token và lấy dữ liệu mới nhất
        try {
          const response = await fetch(`${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.USERS}/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const freshUserData = await response.json();

            // Cập nhật userData trong localStorage và state
            localStorage.setItem('userData', JSON.stringify(freshUserData));
            setCurrentUser(freshUserData);
          } else if (response.status === 401) {
            // Nếu token không hợp lệ nhưng vẫn có userData, giữ người dùng đăng nhập
            // Điều này giúp tránh đăng xuất khi refresh trang

            // Không xóa token hoặc userData để giữ trạng thái đăng nhập
            // Người dùng vẫn có thể tiếp tục sử dụng ứng dụng
            // Khi họ thực hiện các hành động yêu cầu xác thực, họ sẽ được chuyển hướng đến trang đăng nhập
          }
        } catch (error) {
          // Nếu không thể kết nối đến API, vẫn giữ người dùng đăng nhập với dữ liệu đã lưu
          console.error('Lỗi khi xác thực token:', error);
        }
      } catch (error) {
        console.error('Lỗi khi tải thông tin người dùng:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  /**
   * Cập nhật thông tin người dùng trong context và localStorage
   * @param {Object} userData - Thông tin người dùng mới
   */
  const updateUser = (userData) => {
    // Cập nhật state với một object mới để đảm bảo React phát hiện thay đổi
    setCurrentUser({...userData});

    // Đồng thời cập nhật localStorage để giữ đồng bộ
    if (userData) {
      localStorage.setItem('userData', JSON.stringify(userData));
    }
  };

  // Cung cấp hàm updateUser toàn cục để có thể gọi từ bất kỳ đâu
  useEffect(() => {
    window.updateUserContext = updateUser;
    return () => {
      delete window.updateUserContext;
    };
  }, []);

  // Giá trị được cung cấp cho context
  const value = {
    currentUser,
    setCurrentUser,
    loading,
    updateUser
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

/**
 * Hook để sử dụng UserContext trong các component
 * @returns {Object} Context chứa thông tin người dùng và các hàm liên quan
 */
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser phải được sử dụng trong UserProvider');
  }
  return context;
};

export default UserContext;