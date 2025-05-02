import React, { createContext, useState, useEffect, useContext } from 'react';
import { webSocketService } from '../services/websocket';
import { API_ENDPOINTS } from '../config/api';

/**
 * Context để quản lý các cuộc trò chuyện trong ứng dụng
 */
export const ChatContext = createContext();

/**
 * Provider cung cấp chức năng chat cho toàn bộ ứng dụng
 * @param {Object} props - Props của component
 * @param {React.ReactNode} props.children - Các component con
 */
export const ChatProvider = ({ children }) => {
  const [activeChats, setActiveChats] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [currentUser, setCurrentUser] = useState(null);

  // Lấy thông tin người dùng hiện tại từ localStorage
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        setCurrentUser(JSON.parse(userData));
      } catch (error) {
        console.error('Lỗi khi phân tích dữ liệu người dùng:', error);
      }
    }

    // Lắng nghe sự kiện storage để cập nhật khi userData thay đổi
    const handleStorageChange = (e) => {
      if (e.key === 'userData') {
        if (e.newValue) {
          try {
            setCurrentUser(JSON.parse(e.newValue));
          } catch (error) {
            console.error('Lỗi khi phân tích dữ liệu người dùng từ storage event:', error);
          }
        } else {
          setCurrentUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Đăng ký nhận thông báo tin nhắn khi người dùng đã đăng nhập
  useEffect(() => {
    if (!currentUser?.id) return;

    /**
     * Xử lý khi nhận được tin nhắn mới
     * @param {Object} data - Dữ liệu tin nhắn
     */
    const handleNewMessage = (data) => {
      // Cập nhật số lượng tin nhắn chưa đọc
      if (data.type === 'NEW_MESSAGE') {
        const senderId = data.sender.id;
        setUnreadCounts(prev => ({
          ...prev,
          [senderId]: (prev[senderId] || 0) + 1
        }));

        // Nếu cuộc trò chuyện đã mở, thêm tin nhắn vào
        const existingChatIndex = activeChats.findIndex(
          chat => chat.friend.id === senderId
        );

        if (existingChatIndex !== -1) {
          const updatedChats = [...activeChats];
          updatedChats[existingChatIndex].messages.push(data.message);
          setActiveChats(updatedChats);
        }
      }
    };

    // Đăng ký nhận thông báo tin nhắn
    const setupMessageSubscription = async () => {
      try {
        await webSocketService.subscribeToMessages(currentUser.id, handleNewMessage);
      } catch (error) {
        console.error('Lỗi khi đăng ký nhận tin nhắn:', error);
      }
    };

    setupMessageSubscription();

    // Lấy số lượng tin nhắn chưa đọc ban đầu
    const fetchUnreadCounts = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/messages/unread/${currentUser.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('userToken')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUnreadCounts(data);
        }
      } catch (error) {
        console.error('Lỗi khi lấy số lượng tin nhắn chưa đọc:', error);
      }
    };

    fetchUnreadCounts();

    // Dọn dẹp khi component unmount
    return () => {
      webSocketService.unsubscribeFromMessages(currentUser.id);
    };
  }, [currentUser, activeChats]);

  /**
   * Mở cuộc trò chuyện với một người bạn
   * @param {Object} friend - Thông tin người bạn
   */
  const openChat = async (friend) => {
    // Kiểm tra người dùng hiện tại đã được tải chưa
    if (!currentUser || !currentUser.id) {
      // Nếu chưa có thông tin người dùng, thử lấy từ localStorage
      const userData = localStorage.getItem('userData');
      if (!userData) {
        console.error('Lỗi khi mở cuộc trò chuyện: Chưa đăng nhập');
        return;
      }

      // Cập nhật currentUser từ localStorage
      try {
        const parsedUserData = JSON.parse(userData);
        setCurrentUser(parsedUserData);

        // Không tiếp tục xử lý trong lần gọi này, sẽ được xử lý sau khi currentUser được cập nhật
        return;
      } catch (error) {
        console.error('Lỗi khi phân tích dữ liệu người dùng:', error);
        return;
      }
    }

    // Kiểm tra xem cuộc trò chuyện đã mở chưa
    const existingChatIndex = activeChats.findIndex(
      chat => chat.friend.id === friend.id
    );

    if (existingChatIndex !== -1) {
      // Di chuyển cuộc trò chuyện này đến cuối mảng (gần đây nhất)
      const updatedChats = [...activeChats];
      const chat = updatedChats.splice(existingChatIndex, 1)[0];
      updatedChats.push(chat);
      setActiveChats(updatedChats);
      return;
    }

    // Lấy lịch sử cuộc trò chuyện
    try {
      const response = await fetch(
        `${API_ENDPOINTS.BASE_URL}/api/messages/conversation?userId1=${currentUser.id}&userId2=${friend.id}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('userToken')}`
          }
        }
      );

      if (response.ok) {
        const messages = await response.json();

        // Thêm cuộc trò chuyện mới
        setActiveChats([
          ...activeChats,
          {
            friend,
            messages: Array.isArray(messages) ? messages : []
          }
        ]);

        // Đánh dấu tin nhắn đã đọc
        await fetch(
          `${API_ENDPOINTS.BASE_URL}/api/messages/read?receiverId=${currentUser.id}&senderId=${friend.id}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('userToken')}`
            }
          }
        );

        // Đặt lại số lượng tin nhắn chưa đọc cho người bạn này
        setUnreadCounts(prev => ({
          ...prev,
          [friend.id]: 0
        }));
      }
    } catch (error) {
      console.error('Lỗi khi mở cuộc trò chuyện:', error);
    }
  };

  /**
   * Đóng cuộc trò chuyện
   * @param {string} friendId - ID của người bạn
   */
  const closeChat = (friendId) => {
    setActiveChats(activeChats.filter(chat => chat.friend.id !== friendId));
  };

  /**
   * Gửi tin nhắn
   * @param {string} receiverId - ID của người nhận
   * @param {string} content - Nội dung tin nhắn
   */
  const sendMessage = async (receiverId, content) => {
    if (!content.trim()) return;

    // Kiểm tra người dùng hiện tại đã được tải chưa
    if (!currentUser || !currentUser.id) {
      // Nếu chưa có thông tin người dùng, thử lấy từ localStorage
      const userData = localStorage.getItem('userData');
      if (!userData) {
        console.error('Lỗi khi gửi tin nhắn: Chưa đăng nhập');
        return;
      }

      // Cập nhật currentUser từ localStorage
      try {
        const parsedUserData = JSON.parse(userData);
        setCurrentUser(parsedUserData);

        // Không tiếp tục xử lý trong lần gọi này, sẽ được xử lý sau khi currentUser được cập nhật
        return;
      } catch (error) {
        console.error('Lỗi khi phân tích dữ liệu người dùng:', error);
        return;
      }
    }

    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId,
          content
        })
      });

      if (response.ok) {
        const message = await response.json();

        // Thêm tin nhắn vào cuộc trò chuyện
        const updatedChats = activeChats.map(chat => {
          if (chat.friend.id === receiverId) {
            return {
              ...chat,
              messages: [...chat.messages, message]
            };
          }
          return chat;
        });

        setActiveChats(updatedChats);
      }
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        activeChats,
        unreadCounts,
        openChat,
        closeChat,
        sendMessage
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

/**
 * Hook để sử dụng ChatContext trong các component
 * @returns {Object} Context chứa thông tin chat và các hàm liên quan
 */
export const useChat = () => useContext(ChatContext);
