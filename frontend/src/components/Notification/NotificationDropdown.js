import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../../context/ToastContext';
import { API_ENDPOINTS } from '../../config/api';
import { webSocketService } from '../../services/websocket';
import './NotificationDropdown.css';

const NotificationDropdown = ({ currentUser }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);
  const { showError } = useToast();

  // Fetch notifications when component mounts
  useEffect(() => {
    if (currentUser?.id) {
      fetchNotifications();
      fetchUnreadCount();
      subscribeToNotifications();
    }
  }, [currentUser?.id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Subscribe to WebSocket notifications
  const subscribeToNotifications = async () => {
    try {
      await webSocketService.connect();
      
      webSocketService.subscribeToNotifications(currentUser.id, (data) => {
        console.log('Received notification:', data);
        // Add new notification to the list
        if (data.notification) {
          setNotifications(prev => [data, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      });
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);
    }
  };

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/notifications/${currentUser.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      showError('Không thể tải thông báo');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch unread count from API
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/notifications/unread-count/${currentUser.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }

      const data = await response.json();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/notifications/mark-read/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // Update local state
      setNotifications(prev => 
        prev.map(item => 
          item.notification.id === notificationId 
            ? { ...item, notification: { ...item.notification, read: true } } 
            : item
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/notifications/mark-all-read/${currentUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      // Update local state
      setNotifications(prev => 
        prev.map(item => ({ 
          ...item, 
          notification: { ...item.notification, read: true } 
        }))
      );
      
      // Reset unread count
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Handle notification click based on type
  const handleNotificationClick = (notification) => {
    // Mark as read first
    if (!notification.notification.read) {
      markAsRead(notification.notification.id);
    }

    // Handle different notification types
    switch (notification.notification.type) {
      case 'FRIEND_REQUEST':
        window.location.href = '/friends';
        break;
      case 'FRIEND_ACCEPT':
        window.location.href = '/friends';
        break;
      case 'COMMENT':
      case 'REPLY':
        // Navigate to the post
        window.location.href = `/?postId=${notification.notification.entityId}`;
        break;
      case 'MESSAGE':
        // Open chat with the sender
        // This would be handled by your chat system
        break;
      default:
        // Default action is to close the dropdown
        setIsOpen(false);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'FRIEND_REQUEST':
        return <i className="bi bi-person-plus-fill text-primary"></i>;
      case 'FRIEND_ACCEPT':
        return <i className="bi bi-person-check-fill text-success"></i>;
      case 'COMMENT':
        return <i className="bi bi-chat-fill text-info"></i>;
      case 'REPLY':
        return <i className="bi bi-reply-fill text-info"></i>;
      case 'MESSAGE':
        return <i className="bi bi-envelope-fill text-warning"></i>;
      default:
        return <i className="bi bi-bell-fill text-secondary"></i>;
    }
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      // Mark all as read when opening the dropdown
      markAllAsRead();
    }
  };

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      <div className="notification-icon" onClick={toggleDropdown}>
        <img
          src="/img/icons/notify.png"
          alt="Notification Logo"
          style={{ width: "36px", height: "36px" }}
        />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </div>

      {isOpen && (
        <div className="notification-menu">
          <div className="notification-header">
            <h6 className="m-0">Thông báo</h6>
            {notifications.length > 0 && (
              <button 
                className="btn btn-sm btn-link text-primary" 
                onClick={markAllAsRead}
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          <div className="notification-list">
            {isLoading ? (
              <div className="text-center p-3">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((item) => (
                <div 
                  key={item.notification.id} 
                  className={`notification-item ${!item.notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(item)}
                >
                  <div className="notification-icon-wrapper">
                    {getNotificationIcon(item.notification.type)}
                  </div>
                  <div className="notification-content">
                    <p className="notification-text">{item.notification.content}</p>
                    <small className="notification-time">
                      {new Date(item.notification.createdAt).toLocaleString()}
                    </small>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-3 text-muted">
                Không có thông báo nào
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
