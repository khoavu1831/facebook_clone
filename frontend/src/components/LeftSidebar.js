import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { API_ENDPOINTS } from "../config/api";
import './LeftSidebar.css';

function LeftSidebar() {
  const { currentUser } = useUser();
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (currentUser?.id) {
          const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/profile/${currentUser.id}`);
          if (response.ok) {
            const data = await response.json();
            setUserProfile(data);
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  const getFullImageUrl = (path) => {
    if (!path) return '/default-imgs/avatar.png';
    if (path.startsWith('http')) return path;
    return `${API_ENDPOINTS.BASE_URL}${path}`;
  };

  return (
    <div
      className="col-3 p-3 position-fixed"
      style={{ top: "60px", height: "calc(100vh - 60px)", overflowY: "auto" }}
    >
      <div className="d-flex align-items-center gap-2 mb-3">
        <Link to="/profile" style={{ textDecoration: "none", color: "black" }}>
          <div className="d-flex align-items-center flex-row">
            <img
              src={getFullImageUrl(userProfile?.avatar)}
              alt="User"
              className="rounded-circle"
              style={{ width: "40px", height: "40px", objectFit: "cover" }}
            />
            <span style={{ marginLeft: '6px', fontSize: '18px' }}>
              {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'Loading...'}
            </span>
          </div>
        </Link>
      </div>
      <ul className="list-unstyled">
        <li className="mb-2">
          <Link
            to="/friends"
            className="text-dark text-decoration-none d-flex align-items-center gap-2 sidebar-item"
          >
            <img
              src="/img/icons/friend.png"
              alt="Friends"
              className="action-icon"
            />
            <span>Friends</span>
          </Link>
        </li>
        <li className="mb-2">
          <Link
            to="/groups"
            className="text-dark text-decoration-none d-flex align-items-center gap-2 sidebar-item"
          >
            <img
              src="/img/icons/groups.png"
              alt="Groups"
              className="action-icon"
            />
            <span>Groups</span>
          </Link>
        </li>
        <li className="mb-2">
          <Link
            to="/marketplace"
            className="text-dark text-decoration-none d-flex align-items-center gap-2 sidebar-item"
          >
            <img
              src="/img/icons/market.png" 
              alt="Marketplace"
              className="action-icon"
            />
            <span>Marketplace</span>
          </Link>
        </li>
        <li className="mb-2">
          <Link
            to="/watch"
            className="text-dark text-decoration-none d-flex align-items-center gap-2 sidebar-item"
          >
            <img
              src="/img/icons/reel.png" 
              alt="Watch"
              className="action-icon"
            />
            <span>Watch</span>
          </Link>
        </li>
        <li className="mb-2">
          <Link
            to="/memories"
            className="text-dark text-decoration-none d-flex align-items-center gap-2 sidebar-item"
          >
            <img
              src="/img/icons/memories.png" 
              alt="Memories"
              className="action-icon"
            />
            <span>Memories</span>
          </Link>
        </li>
        <li className="mb-2">
          <Link
            to="/more"
            className="text-dark text-decoration-none d-flex align-items-center gap-2 sidebar-item"
          >
            <img
              src="/img/icons/plus-sign.png" 
              alt="More"
              className="action-icon"
            />
            <span>See more</span>
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default LeftSidebar;
