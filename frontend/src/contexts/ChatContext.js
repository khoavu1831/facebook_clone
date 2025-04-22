import React, { createContext, useState, useEffect, useContext } from 'react';
import { webSocketService } from '../services/websocket';
import { API_ENDPOINTS } from '../config/api';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [activeChats, setActiveChats] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [currentUser, setCurrentUser] = useState(null);

  // Get current user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  // Subscribe to message notifications when user is logged in
  useEffect(() => {
    if (!currentUser?.id) return;

    const handleNewMessage = (data) => {
      console.log('New message received:', data);
      
      // Update unread counts
      if (data.type === 'NEW_MESSAGE') {
        const senderId = data.sender.id;
        setUnreadCounts(prev => ({
          ...prev,
          [senderId]: (prev[senderId] || 0) + 1
        }));
        
        // If chat is already open, add message to it
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

    // Subscribe to message notifications
    const setupMessageSubscription = async () => {
      try {
        await webSocketService.subscribeToMessages(currentUser.id, handleNewMessage);
      } catch (error) {
        console.error('Failed to subscribe to messages:', error);
      }
    };

    setupMessageSubscription();

    // Fetch initial unread counts
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
        console.error('Error fetching unread counts:', error);
      }
    };

    fetchUnreadCounts();

    // Cleanup
    return () => {
      webSocketService.unsubscribeFromMessages(currentUser.id);
    };
  }, [currentUser, activeChats]);

  // Open a chat with a friend
  const openChat = async (friend) => {
    // Check if chat is already open
    const existingChatIndex = activeChats.findIndex(
      chat => chat.friend.id === friend.id
    );
    
    if (existingChatIndex !== -1) {
      // Move this chat to the end of the array (most recent)
      const updatedChats = [...activeChats];
      const chat = updatedChats.splice(existingChatIndex, 1)[0];
      updatedChats.push(chat);
      setActiveChats(updatedChats);
      return;
    }
    
    // Fetch conversation history
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
        
        // Add new chat
        setActiveChats([
          ...activeChats,
          {
            friend,
            messages: Array.isArray(messages) ? messages : []
          }
        ]);
        
        // Mark messages as read
        await fetch(
          `${API_ENDPOINTS.BASE_URL}/api/messages/read?receiverId=${currentUser.id}&senderId=${friend.id}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('userToken')}`
            }
          }
        );
        
        // Reset unread count for this friend
        setUnreadCounts(prev => ({
          ...prev,
          [friend.id]: 0
        }));
      }
    } catch (error) {
      console.error('Error opening chat:', error);
    }
  };

  // Close a chat
  const closeChat = (friendId) => {
    setActiveChats(activeChats.filter(chat => chat.friend.id !== friendId));
  };

  // Send a message
  const sendMessage = async (receiverId, content) => {
    if (!content.trim()) return;
    
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
        
        // Add message to chat
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
      console.error('Error sending message:', error);
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

// Custom hook to use the chat context
export const useChat = () => useContext(ChatContext);
