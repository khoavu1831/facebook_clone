import React from "react";
import { Link } from "react-router-dom";
import './LeftSidebar.css';

function LeftSidebar() {
  return (
    <div
      className="col-3 p-3 position-fixed"
      style={{ top: "60px", height: "calc(100vh - 60px)", overflowY: "auto" }}
    >
      <div className="d-flex align-items-center gap-2 mb-3">
        <Link to="/profile" style={{ textDecoration: "none", color: "black" }}>
          <div className="d-flex align-items-center flex-row">
            <img
              src="/img/luu.jpg"
              alt="User"
              className="rounded-circle"
              style={{ width: "30px", height: "30px" }}
            />
            <span style={{ marginLeft: '6px', fontSize: '18px' }}>MaGaming</span>
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