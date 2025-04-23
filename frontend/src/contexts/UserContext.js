import React, { createContext, useState, useContext, useEffect } from 'react';
import { getUserData } from '../utils/auth';
import { API_ENDPOINTS } from '../config/api';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const userData = getUserData();
      console.log("Loading user data:", userData); // Debug log

      if (userData) {
        setCurrentUser(userData);
        setLoading(false);
      } else {
        // Check if token exists but userData doesn't
        const token = localStorage.getItem('userToken');
        if (token) {
          try {
            // Try to fetch user data from API using the token
            console.log("Token found, fetching user data from API");
            const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/users/me`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (response.ok) {
              const userData = await response.json();
              console.log("User data fetched from API:", userData);
              // Save user data to localStorage
              localStorage.setItem('userData', JSON.stringify(userData));
              setCurrentUser(userData);
            } else if (response.status === 401) {
              // Token is invalid, clear it
              console.log("Token is invalid, clearing");
              localStorage.removeItem('userToken');
              localStorage.removeItem('userData');
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
        }
        setLoading(false);
      }
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