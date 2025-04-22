import React, { useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS } from '../config/api';

function RightSidebar() {
  const [friends, setFriends] = useState([]);

  // Get user data directly from localStorage
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  };

  const user = getUserData();

  // Reference to track if component is mounted
  const isMounted = useRef(true);

  const fetchFriends = async () => {
    try {
      if (!user?.id) {
        return;
      }

      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/friends/list/${user.id}`);

      if (isMounted.current && response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setFriends(data);
        }
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  useEffect(() => {
    if (user?.id) {
      // Fetch friends when component mounts
      fetchFriends();
    }

    return () => {
      isMounted.current = false;
    };
  }, [user?.id]);



  const getFullImageUrl = (path) => {
    if (!path) return '/default-imgs/avatar.png';
    if (path.startsWith('http')) return path;
    return `${API_ENDPOINTS.BASE_URL}${path}`;
  };

  return (
    <div className="col-3 p-3 position-fixed" style={{ top: '60px', right: '0', height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
      <div className="mb-3">
        <h3 className="text-secondary">Contacts</h3>
      </div>
      <ul className="list-unstyled">
        {friends.length > 0 ? (
          friends.map(friend => (
            <li key={friend.id} className="mb-3 d-flex align-items-center gap-2">
              <img
                src={getFullImageUrl(friend.avatar)}
                alt={`${friend.firstName} ${friend.lastName}`}
                className="rounded-circle"
                style={{ width: '30px', height: '30px', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.src = '/default-imgs/avatar.png';
                }}
              />
              <span>{`${friend.firstName} ${friend.lastName}`}</span>
            </li>
          ))
        ) : (
          <li className="text-muted">No friends yet</li>
        )}
      </ul>
    </div>
  );
}

export default RightSidebar;
