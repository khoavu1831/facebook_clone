import React, { createContext, useState, useContext, useEffect } from 'react';
import { getUserData } from '../utils/auth';
import { API_ENDPOINTS } from '../config/api';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = getUserData();
        console.log("Loading user data:", userData); // Debug log

        // Luôn kiểm tra token, ngay cả khi đã có userData
        const token = localStorage.getItem('userToken');

        if (!token) {
          console.log("No token found, clearing user data");
          localStorage.removeItem('userData');
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        // Nếu có userData trong localStorage, sử dụng nó trước để tránh màn hình trống
        if (userData) {
          console.log("Using cached user data from localStorage");
          setCurrentUser(userData);
        }

        // Luôn gọi API để xác thực token và lấy dữ liệu mới nhất
        try {
          console.log("Validating token with API");
          const response = await fetch(`${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.USERS}/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const freshUserData = await response.json();
            console.log("User data fetched from API:", freshUserData);

            // Cập nhật userData trong localStorage và state
            localStorage.setItem('userData', JSON.stringify(freshUserData));
            setCurrentUser(freshUserData);
          } else if (response.status === 401) {
            // Nếu token không hợp lệ nhưng vẫn có userData, giữ người dùng đăng nhập
            // Điều này giúp tránh đăng xuất khi refresh trang
            console.log("Token validation failed, but keeping user logged in");

            // Không xóa token hoặc userData để giữ trạng thái đăng nhập
            // Người dùng vẫn có thể tiếp tục sử dụng ứng dụng
            // Khi họ thực hiện các hành động yêu cầu xác thực, họ sẽ được chuyển hướng đến trang đăng nhập
          }
        } catch (error) {
          console.log("Error validating token, using cached data:", error);
          // Nếu không thể kết nối đến API, vẫn giữ người dùng đăng nhập với dữ liệu đã lưu
        }
      } catch (error) {
        console.error('Error in loadUser:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Function to update user data globally
  const updateUser = (userData) => {
    console.log("Updating user data in context:", userData);

    // Update the current user state with a new object to ensure React detects the change
    setCurrentUser({...userData});

    // Also update localStorage to keep everything in sync
    if (userData) {
      localStorage.setItem('userData', JSON.stringify(userData));
      console.log("User data updated in localStorage");
    }
  };

  // Expose updateUser function globally
  useEffect(() => {
    window.updateUserContext = updateUser;
    return () => {
      delete window.updateUserContext;
    };
  }, []);

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

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;