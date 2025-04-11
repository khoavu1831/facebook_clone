export const isUserLoggedIn = () => {
  return !!localStorage.getItem('userToken');
};

export const isAdminLoggedIn = () => {
  return !!localStorage.getItem('adminToken');
};

export const getUserData = () => {
  const userData = localStorage.getItem('userData');
  return userData ? JSON.parse(userData) : null;
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
};