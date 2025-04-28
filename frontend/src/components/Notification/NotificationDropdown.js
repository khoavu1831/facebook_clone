import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../../context/ToastContext';
import { API_ENDPOINTS } from '../../config/api';
import { webSocketService } from '../../services/websocket';
import { useUser } from '../../contexts/UserContext';
import { isUserLoggedIn } from '../../utils/auth';
import './NotificationDropdown.css';

const NotificationDropdown = ({ currentUser }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);
  const { showError } = useToast();
  const { currentUser: contextUser } = useUser();

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

  // Delete all notifications
  const deleteAllNotifications = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/notifications/all/${currentUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete all notifications');
      }

      // Clear all notifications from state
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      showError('Không thể xóa thông báo');
    }
  };

  // Mark a notification as read
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

      // Update the notification in the state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.notification.id === notificationId 
            ? { ...notification, notification: { ...notification.notification, read: true } }
            : notification
        )
      );

      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle notification click based on type
  const handleNotificationClick = (notification) => {
    // Close dropdown first
    setIsOpen(false);

    // Mark notification as read if it's unread
    if (!notification.notification.read) {
      markAsRead(notification.notification.id);
    }

    // Verify user is logged in
    if (!isUserLoggedIn()) {
      console.error('User not authenticated, redirecting to login');
      window.location.href = '/login';
      return;
    }

    // Use the user from context if available, otherwise use the prop
    const user = contextUser || currentUser;
    if (!user || !user.id) {
      console.error('User data not found, redirecting to login');
      window.location.href = '/login';
      return;
    }

    // Handle different notification types
    switch (notification.notification.type) {
      case 'FRIEND_REQUEST':
        window.location.href = '/friends';
        break;
      case 'FRIEND_ACCEPT':
        window.location.href = '/friends';
        break;
      case 'LIKE':
      case 'COMMENT':
      case 'REPLY':
      case 'SHARE':
        // Navigate to the post
        try {
          if (window.location.pathname === '/' || window.location.pathname === '') {
            const url = new URL(window.location.href);
            url.searchParams.set('postId', notification.notification.entityId);
            window.history.pushState({}, '', url);

            const postElement = document.getElementById(`post-${notification.notification.entityId}`);
            if (postElement) {
              postElement.scrollIntoView({ behavior: 'smooth' });
              postElement.classList.add('highlight-post');
              setTimeout(() => {
                postElement.classList.remove('highlight-post');
              }, 2000);
            } else {
              window.location.href = `/?postId=${notification.notification.entityId}`;
            }
          } else {
            window.location.href = `/?postId=${notification.notification.entityId}`;
          }
        } catch (error) {
          console.error('Error navigating to post:', error);
          window.location.href = `/?postId=${notification.notification.entityId}`;
        }
        break;
      case 'MESSAGE':
        // Open chat with the sender
        try {
          // Dispatch a custom event to open chat with the sender
          const event = new CustomEvent('openChat', {
            detail: {
              userId: notification.notification.senderId,
              userName: notification.notification.senderName
            }
          });
          window.dispatchEvent(event);
        } catch (error) {
          console.error('Error opening chat:', error);
        }
        break;
      default:
        // No additional action needed
        break;
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
                className="btn btn-sm btn-link text-danger"
                onClick={deleteAllNotifications}
              >
                Xóa tất cả
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
