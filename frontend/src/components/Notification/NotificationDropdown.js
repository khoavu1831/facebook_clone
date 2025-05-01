import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../../context/ToastContext';
import { API_ENDPOINTS } from '../../config/api';
import { webSocketService } from '../../services/websocket';
import { useUser } from '../../contexts/UserContext';
import { isUserLoggedIn } from '../../utils/auth';
import { useNavigate } from 'react-router-dom';
import './NotificationDropdown.css';

/**
 * Component hiển thị dropdown thông báo
 * @param {Object} props - Props của component
 * @param {Object} props.currentUser - Thông tin người dùng hiện tại
 */
const NotificationDropdown = ({ currentUser }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);
  const { showError } = useToast();
  const { currentUser: contextUser } = useUser();
  const navigate = useNavigate();

  // Lấy thông báo khi component được mount
  useEffect(() => {
    if (currentUser?.id) {
      fetchNotifications();
      fetchUnreadCount();
      subscribeToNotifications();
    }
  }, [currentUser?.id]);

  // Đóng dropdown khi click bên ngoài
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

  /**
   * Đăng ký nhận thông báo qua WebSocket
   */
  const subscribeToNotifications = async () => {
    try {
      await webSocketService.connect();

      webSocketService.subscribeToNotifications(currentUser.id, (data) => {
        // Thêm thông báo mới vào danh sách
        if (data.notification) {
          setNotifications(prev => [data, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      });
    } catch (error) {
      console.error('Lỗi khi đăng ký nhận thông báo:', error);
    }
  };

  /**
   * Lấy danh sách thông báo từ API
   */
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/notifications/${currentUser.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Không thể lấy thông báo');
      }

      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Lỗi khi lấy thông báo:', error);
      showError('Không thể tải thông báo');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Lấy số lượng thông báo chưa đọc từ API
   */
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/notifications/unread-count/${currentUser.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Không thể lấy số lượng thông báo chưa đọc');
      }

      const data = await response.json();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Lỗi khi lấy số lượng thông báo chưa đọc:', error);
    }
  };

  /**
   * Xóa tất cả thông báo
   */
  const deleteAllNotifications = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/notifications/all/${currentUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Không thể xóa tất cả thông báo');
      }

      // Xóa tất cả thông báo khỏi state
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Lỗi khi xóa tất cả thông báo:', error);
      showError('Không thể xóa thông báo');
    }
  };

  /**
   * Đánh dấu thông báo đã đọc
   * @param {string} notificationId - ID của thông báo
   */
  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/notifications/mark-read/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Không thể đánh dấu thông báo đã đọc');
      }

      // Cập nhật thông báo trong state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.notification.id === notificationId
            ? { ...notification, notification: { ...notification.notification, read: true } }
            : notification
        )
      );

      // Cập nhật số lượng thông báo chưa đọc
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Lỗi khi đánh dấu thông báo đã đọc:', error);
    }
  };

  /**
   * Xử lý khi click vào thông báo dựa trên loại
   * @param {Object} notification - Thông tin thông báo
   */
  const handleNotificationClick = (notification) => {
    // Đóng dropdown trước
    setIsOpen(false);

    // Đánh dấu thông báo đã đọc nếu chưa đọc
    if (!notification.notification.read) {
      markAsRead(notification.notification.id);
    }

    // Kiểm tra người dùng đã đăng nhập chưa
    if (!isUserLoggedIn()) {
      navigate('/login');
      return;
    }

    // Sử dụng người dùng từ context nếu có, nếu không thì sử dụng từ prop
    const user = contextUser || currentUser;
    if (!user || !user.id) {
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

  /**
   * Lấy biểu tượng thông báo dựa trên loại
   * @param {string} type - Loại thông báo
   * @returns {JSX.Element} Biểu tượng tương ứng
   */
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

  /**
   * Hàm hỗ trợ điều hướng đến bài đăng
   * @param {string} postId - ID của bài đăng
   */
  const navigateToPost = (postId) => {
    // Luôn điều hướng đến trang chi tiết bài viết
    navigate(`/posts/${postId}`);
  };

  /**
   * Bật/tắt dropdown
   */
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      <div className="notification-icon" onClick={toggleDropdown}>
        <img
          src="/img/icons/notify.png"
          alt="Biểu tượng thông báo"
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
                aria-label="Xóa tất cả thông báo"
              >
                Xóa tất cả
              </button>
            )}
          </div>

          <div className="notification-list">
            {isLoading ? (
              <div className="text-center p-3">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Đang tải...</span>
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
                Không có thông báo
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
