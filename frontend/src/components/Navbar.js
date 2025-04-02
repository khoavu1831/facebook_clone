import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">Facebook Clone</Link>
      </div>
      <ul className="navbar-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/profile">Profile</Link></li>
        <li><Link to="/friends">Friends</Link></li>
        <li><button className="logout-btn">Logout</button></li>
      </ul>
    </nav>
  );
}

export default Navbar;