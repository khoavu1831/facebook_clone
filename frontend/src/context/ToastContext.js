import React, { createContext, useState, useContext, useCallback } from 'react';
import Toast from '../components/Toast/Toast';

/**
 * Context để quản lý thông báo toast trong ứng dụng
 */
const ToastContext = createContext();

/**
 * Hook để sử dụng ToastContext trong các component
 * @returns {Object} Context chứa các hàm hiển thị thông báo
 */
export const useToast = () => useContext(ToastContext);

/**
 * Provider cung cấp chức năng thông báo toast cho toàn bộ ứng dụng
 * @param {Object} props - Props của component
 * @param {React.ReactNode} props.children - Các component con
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  /**
   * Thêm một thông báo toast mới
   * @param {Object} toast - Thông tin thông báo
   * @returns {string} ID của thông báo
   */
  const addToast = useCallback((toast) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, ...toast }]);
    return id;
  }, []);

  /**
   * Xóa một thông báo toast
   * @param {string} id - ID của thông báo cần xóa
   */
  const removeToast = useCallback((id) => {
    console.log('Removing toast with ID:', id);
    setToasts(prev => {
      const filtered = prev.filter(toast => toast.id !== id);
      console.log('Toasts after removal:', filtered);
      return filtered;
    });
  }, []);

  /**
   * Hiển thị thông báo thành công
   * @param {string} message - Nội dung thông báo
   * @param {string} title - Tiêu đề thông báo (mặc định: 'Thành công')
   * @returns {string} ID của thông báo
   */
  const showSuccess = useCallback((message, title = 'Thành công') => {
    return addToast({ type: 'success', title, message });
  }, [addToast]);

  /**
   * Hiển thị thông báo lỗi
   * @param {string} message - Nội dung thông báo
   * @param {string} title - Tiêu đề thông báo (mặc định: 'Lỗi')
   * @returns {string} ID của thông báo
   */
  const showError = useCallback((message, title = 'Lỗi') => {
    return addToast({ type: 'error', title, message });
  }, [addToast]);

  /**
   * Hiển thị thông báo thông tin
   * @param {string} message - Nội dung thông báo
   * @param {string} title - Tiêu đề thông báo (mặc định: 'Thông tin')
   * @returns {string} ID của thông báo
   */
  const showInfo = useCallback((message, title = 'Thông tin') => {
    return addToast({ type: 'info', title, message });
  }, [addToast]);

  /**
   * Hiển thị thông báo cảnh báo
   * @param {string} message - Nội dung thông báo
   * @param {string} title - Tiêu đề thông báo (mặc định: 'Cảnh báo')
   * @returns {string} ID của thông báo
   */
  const showWarning = useCallback((message, title = 'Cảnh báo') => {
    return addToast({ type: 'warning', title, message });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showInfo, showWarning, removeToast }}>
      {children}
      <Toast toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

export default ToastContext;
