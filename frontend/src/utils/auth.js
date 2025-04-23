export const getUserData = () => {
  try {
    const userData = localStorage.getItem('userData');
    console.log("Raw userData from localStorage:", userData); // Debug log
    if (!userData) {
      console.log("No user data found in localStorage");
      return null;
    }
    const parsedData = JSON.parse(userData);
    console.log("Parsed userData:", parsedData); // Debug log
    return parsedData;
  } catch (error) {
    console.error("Error parsing user data:", error);
    return null;
  }
};

export const isUserLoggedIn = () => {
  const token = localStorage.getItem('userToken');
  const userData = getUserData();

  // Nếu có token nhưng không có userData, vẫn coi là đăng nhập
  // UserContext sẽ tự động lấy userData từ API
  return !!token;
};

export const isAdminLoggedIn = () => {
  return !!localStorage.getItem('adminToken');
};

export const getAdminData = () => {
  const adminData = localStorage.getItem('adminData');
  return adminData ? JSON.parse(adminData) : null;
};

export const logout = () => {
  localStorage.removeItem('userToken');
  localStorage.removeItem('userData');
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminData');
  window.location.href = '/login';
};
