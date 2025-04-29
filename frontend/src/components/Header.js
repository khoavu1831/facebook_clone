import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../utils/auth";
import NotificationDropdown from "./Notification/NotificationDropdown";
import { useUser } from "../contexts/UserContext";
import { API_ENDPOINTS } from "../config/api";

function Header() {
  const navigate = useNavigate();
  const { currentUser } = useUser(); // Use UserContext instead of local state
  const [avatarKey, setAvatarKey] = useState(Date.now());

  // Force re-render when currentUser changes
  useEffect(() => {
    if (currentUser) {
      // Update the key to force re-render of the avatar
      setAvatarKey(Date.now());
      console.log("Header detected user change, updating avatar");
    }
  }, [currentUser]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-white shadow-sm fixed-top">
      <div className="container-fluid d-flex align-items-center justify-content-between py-2">
        {/* Left: Logo and Search */}
        <div className="d-flex align-items-center gap-2">
          <Link to="/" className="text-decoration-none">
            <img
              src="/img/facebook-logo.png"
              alt="Facebook Logo"
              style={{ width: "40px", height: "40px" }}
            />
          </Link>
          <input
            type="text"
            className="form-control rounded-pill"
            placeholder="Search Facebook"
            style={{ width: "200px" }}
          />
        </div>

        {/* Center: Navigation Icons
        <div className="d-flex gap-4">
          <Link to="/" className="text-secondary fs-4 text-decoration-none">🏠</Link>
          <Link to="/friends" className="text-secondary fs-4 text-decoration-none">👥</Link>
        </div> */}

        {/* Right: User Info and Icons */}
        <div className="d-flex align-items-center gap-3">
          {/* User Avatar */}
          {currentUser && (
            <Link to="/profile" className="d-flex align-items-center gap-2 text-decoration-none">
              <img
                src={currentUser.avatar
                  ? (currentUser.avatar.startsWith('blob:')
                      ? currentUser.avatar
                      : `${API_ENDPOINTS.BASE_URL}${currentUser.avatar}?t=${avatarKey}`)
                  : '/default-imgs/avatar.png'}
                alt={`${currentUser.firstName} ${currentUser.lastName}`}
                className="rounded-circle"
                style={{ width: "40px", height: "40px", objectFit: "cover" }}
                onError={(e) => {
                  e.target.src = '/default-imgs/avatar.png';
                }}
                // Add key to force re-render when user changes
                key={`header-avatar-${currentUser.id}-${avatarKey}`}
              />
              <span className="d-none d-md-inline text-dark">{currentUser.firstName}</span>
            </Link>
          )}

          {/* Notify */}
          {currentUser && <NotificationDropdown currentUser={currentUser} />}

          {/* Logout Button */}
          <button
            className="btn btn-sm"
            onClick={handleLogout}
            title="Logout"
          >
            <img
              src="/img/logout.png"
              alt="Logout"
              style={{ width: "36px", height: "36px" }}
            />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
