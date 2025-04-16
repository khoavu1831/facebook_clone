import React, { createContext, useState, useContext, useEffect } from 'react';
import { getUserData } from '../utils/auth';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = () => {
      const userData = getUserData();
      console.log("Loading user data:", userData); // Debug log
      if (userData) {
        setCurrentUser(userData);
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const value = {
    currentUser,
    setCurrentUser,
    loading
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};