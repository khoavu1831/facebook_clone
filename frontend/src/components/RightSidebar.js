import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';

function RightSidebar() {
  const [friends, setFriends] = useState([]);
  const currentUser = JSON.parse(localStorage.getItem('userData'));

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/friends/list/${currentUser.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('userToken')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setFriends(data);
        }
      } catch (error) {
        console.error('Error fetching friends:', error);
      }
    };

    if (currentUser?.id) {
      fetchFriends();
    }
  }, [currentUser?.id]);

  const getFullImageUrl = (path) => {
    if (!path) return '/img/default-avatar.jpg';
    if (path.startsWith('http')) return path;
    return `${API_ENDPOINTS.BASE_URL}${path}`;
  };

  return (
    <div className="col-3 p-3 position-fixed" style={{ top: '60px', right: '0', height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
      <h3 className="text-secondary mb-3">Contacts</h3>
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
                  e.target.src = '/img/default-avatar.jpg';
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
