import React from 'react';
import PrivateChatWindow from './PrivateChatWindow';
import { useChat } from '../../contexts/ChatContext';
import './PrivateChatWindow.css';

function ChatWindowsContainer() {
  const { activeChats } = useChat();
  
  // Limit the number of visible chat windows to 3
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
