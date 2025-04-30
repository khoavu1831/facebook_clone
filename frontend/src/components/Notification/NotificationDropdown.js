import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../../context/ToastContext';
import { API_ENDPOINTS } from '../../config/api';
import { webSocketService } from '../../services/websocket';
import { useUser } from '../../contexts/UserContext';
import { isUserLoggedIn } from '../../utils/auth';
import { useNavigate } from 'react-router-dom';
import './NotificationDropdown.css';

const NotificationDropdown = ({ currentUser }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);
  const { showError } = useToast();
  const { currentUser: contextUser } = useUser();
  const navigate = useNavigate();

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
      navigate('/login');
      return;
    }

    // Use the user from context if available, otherwise use the prop
    const user = contextUser || currentUser;
    if (!user || !user.id) {
      console.error('User data not found, redirecting to login');
      navigate('/login');
      return;
    }

    // Handle different notification types
    switch (notification.notification.type) {
      case 'FRIEND_REQUEST':
        navigate('/friends');
        break;
      case 'FRIEND_ACCEPT':
        navigate('/friends');
        break;
      case 'LIKE':
        // Navigate to the post for likes
        try {
          navigateToPost(notification.notification.entityId);
        } catch (error) {
          console.error('Error navigating to post:', error);
          navigate(`/?postId=${notification.notification.entityId}`);
        }
        break;
      case 'COMMENT':
        // Navigate to the post and highlight the comment
        try {
          // For comments, entityId is the comment ID
          const commentId = notification.notification.entityId;

          // First navigate to post detail page
          // We need to fetch the post ID from the comment
          fetch(`${API_ENDPOINTS.BASE_URL}/api/comments/${commentId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('userToken')}`
            }
          })
          .then(response => {
            if (!response.ok) throw new Error('Failed to fetch comment');
            return response.json();
          })
          .then(data => {
            const postId = data.postId;

            // Navigate to post detail page using React Router
            navigate(`/posts/${postId}?commentId=${commentId}`);
          })
          .catch(error => {
            console.error('Error fetching comment:', error);
            // Fallback to home page if we can't get the post ID
            navigate('/');
          });
        } catch (error) {
          console.error('Error navigating to comment:', error);
          navigate('/');
        }
        break;
      case 'REPLY':
        // Navigate to the post and highlight the reply
        try {
          // For replies, entityId is the reply comment ID
          const replyId = notification.notification.entityId;

          // First navigate to post detail page
          // We need to fetch the post ID from the reply comment
          fetch(`${API_ENDPOINTS.BASE_URL}/api/comments/${replyId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('userToken')}`
            }
          })
          .then(response => {
            if (!response.ok) throw new Error('Failed to fetch reply');
            return response.json();
          })
          .then(data => {
            const postId = data.postId;
            const parentId = data.parentId; // Get parent comment ID

            // Navigate to post detail page with both comment IDs using React Router
            navigate(`/posts/${postId}?commentId=${parentId}&replyId=${replyId}`);
          })
          .catch(error => {
            console.error('Error fetching reply:', error);
            // Fallback to home page if we can't get the post ID
            navigate('/');
          });
        } catch (error) {
          console.error('Error navigating to reply:', error);
          navigate('/');
        }
        break;
      case 'COMMENT_LIKE':
        // Navigate to the post and highlight the comment that was liked
        try {
          // For comment likes, entityId is the comment ID
          const commentId = notification.notification.entityId;

          // First navigate to post detail page
          // We need to fetch the post ID from the comment
          fetch(`${API_ENDPOINTS.BASE_URL}/api/comments/${commentId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('userToken')}`
            }
          })
          .then(response => {
            if (!response.ok) throw new Error('Failed to fetch comment');
            return response.json();
          })
          .then(data => {
            const postId = data.postId;
            const parentId = data.parentId; // Check if it's a reply

            if (parentId) {
              // This is a reply comment
              navigate(`/posts/${postId}?commentId=${parentId}&replyId=${commentId}`);
            } else {
              // This is a parent comment
              navigate(`/posts/${postId}?commentId=${commentId}`);
            }
          })
          .catch(error => {
            console.error('Error fetching comment:', error);
            // Fallback to home page if we can't get the post ID
            navigate('/');
          });
        } catch (error) {
          console.error('Error navigating to liked comment:', error);
          navigate('/');
        }
        break;
      case 'SHARE':
        // Navigate to the post for shares
        try {
          navigateToPost(notification.notification.entityId);
        } catch (error) {
          console.error('Error navigating to post:', error);
          navigate(`/?postId=${notification.notification.entityId}`);
        }
        break;
      case 'MESSAGE':
        // Open chat with the sender
        try {
          // Get sender information
          fetch(`${API_ENDPOINTS.BASE_URL}/api/users/${notification.notification.senderId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('userToken')}`
            }
          })
          .then(response => {
            if (!response.ok) throw new Error('Failed to fetch sender info');
            return response.json();
          })
          .then(sender => {
            // Create a friend object with the sender's information
            const friend = {
              id: sender.id,
              firstName: sender.firstName,
              lastName: sender.lastName,
              avatar: sender.avatar
            };

            // Dispatch a custom event to open chat with the sender
            const event = new CustomEvent('openChat', {
              detail: {
                friend: friend,
                messageId: notification.notification.entityId // Pass the message ID
              }
            });
            window.dispatchEvent(event);
          })
          .catch(error => {
            console.error('Error fetching sender info:', error);
          });
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
      case 'COMMENT_LIKE':
        return <i className="bi bi-hand-thumbs-up-fill text-primary"></i>;
      case 'MESSAGE':
        return <i className="bi bi-envelope-fill text-warning"></i>;
      default:
        return <i className="bi bi-bell-fill text-secondary"></i>;
    }
  };

  // Helper function to navigate to a post
  const navigateToPost = (postId) => {
    // Luôn điều hướng đến trang chi tiết bài viết
    navigate(`/posts/${postId}`);
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
            <h6 className="m-0">Notifications</h6>
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
                No notifications
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
