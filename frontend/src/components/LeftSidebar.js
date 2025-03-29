import React from 'react';
import { Link } from 'react-router-dom';

function LeftSidebar() {
  return (
    <div className="col-3 p-3 position-fixed" style={{ top: '60px', height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
      <div className="d-flex align-items-center gap-2 mb-3">
        <img
          src="/img/logo.png"
          alt="User"
          className="rounded-circle"
          style={{ width: '30px', height: '30px' }}
        />
        <span>MaGaming</span>
      </div>
      <ul className="list-unstyled">
        <li className="mb-3">
          <Link to="/friends" className="text-dark text-decoration-none d-flex align-items-center gap-2">
            👥 Friends
          </Link>
        </li>
        <li className="mb-3">
          <Link to="/groups" className="text-dark text-decoration-none d-flex align-items-center gap-2">
            👥 Groups
          </Link>
        </li>
        <li className="mb-3">
          <Link to="/marketplace" className="text-dark text-decoration-none d-flex align-items-center gap-2">
            🏪 Marketplace
          </Link>
        </li>
        <li className="mb-3">
          <Link to="/watch" className="text-dark text-decoration-none d-flex align-items-center gap-2">
            📺 Watch
          </Link>
        </li>
        <li className="mb-3">
          <Link to="/memories" className="text-dark text-decoration-none d-flex align-items-center gap-2">
            ⏳ Memories
          </Link>
        </li>
        <li className="mb-3">
          <Link to="/more" className="text-dark text-decoration-none d-flex align-items-center gap-2">
            ➕ See more
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default LeftSidebar;