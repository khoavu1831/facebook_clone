import React, { useState, useEffect, useCallback } from 'react';
import './Toast.css';

// Toast component
const ToastItem = ({ id, type, title, message, onClose, autoClose = true, duration = 5000 }) => {
  const [removing, setRemoving] = useState(false);

  const closeToast = useCallback(() => {
    setRemoving(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Match animation duration
  }, [id, onClose]);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        closeToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, closeToast]);

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

  return (
    <div className={`toast-item ${type} ${removing ? 'removing' : ''}`}>
      <div className="toast-icon">{getIcon()}</div>
      <div className="toast-content">
        {title && <div className="toast-title">{title}</div>}
        {message && <div className="toast-message">{message}</div>}
      </div>
      <button className="toast-close" onClick={closeToast}>×</button>
    </div>
  );
};

// Toast container
const Toast = ({ toasts, removeToast }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
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
