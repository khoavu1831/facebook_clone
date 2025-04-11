import React, { createContext, useState, useContext, useEffect } from 'react';
import { getUserData } from '../utils/auth';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = () => {
      const userData = getUserData();
      if (userData) {
        setCurrentUser(userData);
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);