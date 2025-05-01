import React from 'react';
import PrivateChatWindow from './PrivateChatWindow';
import { useChat } from '../../contexts/ChatContext';
import './PrivateChatWindow.css';

/**
 * Component chứa tất cả các cửa sổ chat đang hoạt động
 * Hiển thị tối đa 3 cửa sổ chat cùng một lúc
 */
function ChatWindowsContainer() {
  const { activeChats } = useChat();

  // Giới hạn số lượng cửa sổ chat hiển thị tối đa là 3
  const visibleChats = activeChats.slice(-3);

  return (
    <div className="chat-windows-container">
      {visibleChats.map((chat, index) => (
        <div
          key={chat.friend.id}
          style={{ right: `${80 + index * 340}px` }}
          className="private-chat-window-wrapper"
        >
          <PrivateChatWindow friend={chat.friend} />
        </div>
      ))}
    </div>
  );
}

export default ChatWindowsContainer;
