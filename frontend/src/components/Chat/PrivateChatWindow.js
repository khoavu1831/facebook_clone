import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import './PrivateChatWindow.css';

function PrivateChatWindow({ friend }) {
  const [input, setInput] = useState('');
  const { sendMessage, closeChat, activeChats } = useChat();
  const messagesEndRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem('userData'));
  
  // Find the chat for this friend
  const chat = activeChats.find(c => c.friend.id === friend.id);
  
  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);
  
  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    sendMessage(friend.id, input);
    setInput('');
  };
  
  const getFullImageUrl = (path) => {
    if (!path) return '/default-imgs/avatar.png';
    if (path.startsWith('http')) return path;
    return path;
  };
  
  return (
    <div className="private-chat-window">
      <div className="chat-header">
        <div className="chat-user-info">
          <img 
            src={getFullImageUrl(friend.avatar)} 
            alt={`${friend.firstName} ${friend.lastName}`}
            className="chat-avatar"
          />
          <span className="chat-username">{`${friend.firstName} ${friend.lastName}`}</span>
        </div>
        <button className="chat-close-btn" onClick={() => closeChat(friend.id)}>×</button>
      </div>
      
      <div className="chat-body">
        {chat?.messages && chat.messages.length > 0 ? (
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
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-footer">
        <form onSubmit={handleSend}>
          <input
            type="text"
            placeholder="Nhập tin nhắn..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit">
            <i className="bi bi-send"></i>
          </button>
        </form>
      </div>
    </div>
  );
}

export default PrivateChatWindow;
