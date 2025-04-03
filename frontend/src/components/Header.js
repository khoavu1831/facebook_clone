import React from "react";
import { Link, useNavigate } from "react-router-dom";

function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    console.log("User logged out");
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
          {/* User */}
          {/* <div className="d-flex align-items-center gap-2">
              <img
                src="/img/luu.jpg"
                alt="User"
                className="rounded-circle"
                style={{ width: "40px", height: "40px" }}
              />
              <span>MaGaming</span>
          </div> */}
          
          {/* Notify */}
          <div className="text-secondary fs-5">
            <Link to="/">
              <img
                src="/img/icons/notify.png"
                alt="Notification Logo"
                style={{ width: "36px", height: "36px" }}
              />
            </Link>
          </div>

          {/* Messenger */}
          <div className="text-secondary fs-5">
            <Link to="/">
              <img
                src="/img/icons/messenger.png"
                alt="Messenger Logo"
                style={{ width: "36px", height: "36px" }}
              />
            </Link>
          </div>
          <button
            className="btn btn-sm"
            onClick={handleLogout}
          >
            <img
              src="/img/logout.png"
              alt="Logout Logo"
              style={{ width: "36px", height: "36px" }}
            />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
