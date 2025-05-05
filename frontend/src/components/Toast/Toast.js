import React, { useState, useEffect, useCallback, useRef } from 'react';
import './Toast.css';

/**
 * Component hiển thị một thông báo toast
 * @param {Object} props - Props của component
 * @param {string} props.id - ID của thông báo
 * @param {string} props.type - Loại thông báo (success, error, warning, info)
 * @param {string} props.title - Tiêu đề thông báo
 * @param {string} props.message - Nội dung thông báo
 * @param {Function} props.onClose - Hàm xử lý khi đóng thông báo
 * @param {boolean} props.autoClose - Tự động đóng thông báo sau một khoảng thời gian (mặc định: true)
 * @param {number} props.duration - Thời gian hiển thị thông báo (ms) (mặc định: 5000)
 */
const ToastItem = ({ id, type, title, message, onClose, autoClose = true, duration = 5000 }) => {
  const [removing, setRemoving] = useState(false);

  /**
   * Đóng thông báo với hiệu ứng
   */
  const closeToast = useCallback(() => {
    setRemoving(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Thời gian khớp với thời lượng animation
  }, [id, onClose]);

  // Tự động đóng thông báo sau một khoảng thời gian
  useEffect(() => {
    let timer;
    if (autoClose) {
      timer = setTimeout(() => {
        closeToast();
      }, duration);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [autoClose, duration, closeToast]);

  /**
   * Lấy biểu tượng tương ứng với loại thông báo
   * @returns {string} Biểu tượng
   */
  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  /**
   * Xử lý sự kiện click nút đóng
   * @param {Event} e - Sự kiện click
   */
  const handleCloseClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeToast();
  };

  return (
    <div 
      className={`toast-item ${type} ${removing ? 'removing' : ''}`}
      onClick={(e) => e.stopPropagation()} // Ngăn sự kiện click lan truyền
    >
      <div className="toast-icon">{getIcon()}</div>
      <div className="toast-content">
        {title && <div className="toast-title">{title}</div>}
        {message && <div className="toast-message">{message}</div>}
      </div>
      <button 
        className="toast-close" 
        onClick={handleCloseClick} 
        aria-label="Đóng thông báo"
        type="button"
      >×</button>
    </div>
  );
};

/**
 * Component hiển thị container chứa các thông báo toast
 * @param {Object} props - Props của component
 * @param {Array} props.toasts - Danh sách các thông báo
 * @param {Function} props.removeToast - Hàm xử lý khi đóng thông báo
 */
const Toast = ({ toasts, removeToast }) => {
  const containerRef = useRef(null);
  
  // Theo dõi vị trí cuộn và cập nhật vị trí của toast
  useEffect(() => {
    if (!toasts || toasts.length === 0) return;
    
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollTop = window.scrollY;
        containerRef.current.style.top = `${Math.max(20, scrollTop + 20)}px`;
      }
    };
    
    // Thiết lập vị trí ban đầu
    handleScroll();
    
    // Thêm event listener
    window.addEventListener('scroll', handleScroll);
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [toasts]);
  
  if (!toasts || toasts.length === 0) return null;

  return (
    <div 
      className="toast-container" 
      ref={containerRef}
      onClick={(e) => e.stopPropagation()} // Ngăn sự kiện click lan truyền
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={removeToast}
          autoClose={toast.autoClose !== false}
          duration={toast.duration || 5000}
        />
      ))}
    </div>
  );
};

export default Toast;
