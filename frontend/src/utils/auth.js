/**
 * Lấy thông tin người dùng từ localStorage
 * @returns {Object|null} Thông tin người dùng hoặc null nếu không tìm thấy
 */
export const getUserData = () => {
  try {
    const userData = localStorage.getItem('userData');
    if (!userData) {
      return null;
    }
    return JSON.parse(userData);
  } catch (error) {
    console.error("Lỗi khi phân tích dữ liệu người dùng:", error);
    return null;
  }
};

/**
 * Kiểm tra người dùng đã đăng nhập hay chưa
 * @returns {boolean} True nếu đã đăng nhập, ngược lại là false
 */
export const isUserLoggedIn = () => {
  // Chỉ kiểm tra sự tồn tại của token, không quan tâm đến userData
  // Điều này giúp tránh đăng xuất khi refresh trang
  const token = localStorage.getItem('userToken');
  return !!token;
};

/**
 * Kiểm tra admin đã đăng nhập hay chưa
 * @returns {boolean} True nếu admin đã đăng nhập, ngược lại là false
 */
export const isAdminLoggedIn = () => {
  return !!localStorage.getItem('adminToken');
};

/**
 * Lấy thông tin admin từ localStorage
 * @returns {Object|null} Thông tin admin hoặc null nếu không tìm thấy
 */
export const getAdminData = () => {
  const adminData = localStorage.getItem('adminData');
  return adminData ? JSON.parse(adminData) : null;
};

/**
 * Đăng xuất khỏi hệ thống
 * Xóa tất cả thông tin đăng nhập và chuyển hướng về trang đăng nhập
 */
export const logout = () => {
  localStorage.removeItem('userToken');
  localStorage.removeItem('userData');
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminData');
  window.location.href = '/login';
};
