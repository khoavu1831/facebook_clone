import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import './PrivateChatWindow.css';

/**
 * Component hiển thị cửa sổ chat riêng với một người bạn
 * @param {Object} props - Props của component
 * @param {Object} props.friend - Thông tin người bạn đang chat
 */
function PrivateChatWindow({ friend }) {
  const [input, setInput] = useState('');
  const { sendMessage, closeChat, activeChats } = useChat();
  const messagesEndRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Lấy thông tin người dùng từ localStorage
  useEffect(() => {
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Lỗi khi phân tích dữ liệu người dùng:', error);
    }
  }, []);

  // Tìm cuộc trò chuyện cho người bạn này
  const chat = activeChats.find(c => c.friend.id === friend.id);

  /**
   * Cuộn xuống cuối cùng của cửa sổ chat
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Cuộn xuống cuối cùng khi tin nhắn thay đổi
  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  /**
   * Xử lý khi gửi tin nhắn
   * @param {Event} e - Sự kiện submit form
   */
  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Kiểm tra người dùng hiện tại đã được tải chưa
    if (!currentUser) {
      try {
        const userData = localStorage.getItem('userData');
        if (userData) {
          setCurrentUser(JSON.parse(userData));
          // Gửi tin nhắn sau khi đã cập nhật currentUser
          setTimeout(() => {
            sendMessage(friend.id, input);
            setInput('');
          }, 100);
          return;
        } else {
          console.error('Không thể gửi tin nhắn: Chưa đăng nhập');
          return;
        }
      } catch (error) {
        console.error('Lỗi khi phân tích dữ liệu người dùng:', error);
        return;
      }
    }

    sendMessage(friend.id, input);
    setInput('');
  };

  /**
   * Lấy URL đầy đủ của hình ảnh
   * @param {string} path - Đường dẫn hình ảnh
   * @returns {string} URL đầy đủ của hình ảnh
   */
  const getFullImageUrl = (path) => {
    if (!path) return '/default-imgs/avatar.png';
    if (path.startsWith('http')) return path;
    return path;
  };

  return (
    <div className="private-chat-window">
      {/* Phần tiêu đề chat */}
      <div className="chat-header">
        <div className="chat-user-info">
          <img
            src={getFullImageUrl(friend.avatar)}
            alt={`${friend.firstName} ${friend.lastName}`}
            className="chat-avatar"
          />
          <span className="chat-username">{`${friend.firstName} ${friend.lastName}`}</span>
        </div>
        <button
          className="chat-close-btn"
          onClick={() => closeChat(friend.id)}
          aria-label="Đóng cửa sổ chat"
        >×</button>
      </div>

      {/* Phần nội dung chat */}
      <div className="chat-body">
        {chat?.messages && chat.messages.length > 0 && currentUser ? (
          chat.messages.map((message, index) => (
            <div
              key={message.id || index}
              className={`chat-message ${message.senderId === currentUser.id ? 'sent' : 'received'}`}
            >
              <div className="message-content">{message.content}</div>
              <div className="message-time">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))
        ) : (
          <div className="no-messages">
            <p>Bắt đầu cuộc trò chuyện với {friend.firstName}</p>
          </div>
        )}
        {/* Tham chiếu để cuộn xuống cuối cùng */}
        <div ref={messagesEndRef} />
      </div>

      {/* Phần nhập tin nhắn */}
      <div className="chat-footer">
        <form onSubmit={handleSend}>
          <input
            type="text"
            placeholder="Nhập tin nhắn..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Nhập tin nhắn"
          />
          <button type="submit" aria-label="Gửi tin nhắn">
            <i className="bi bi-send"></i>
          </button>
        </form>
      </div>
    </div>
  );
}

export default PrivateChatWindow;
