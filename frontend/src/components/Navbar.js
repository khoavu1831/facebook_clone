import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Component thanh điều hướng chính
 * Hiển thị logo và các liên kết điều hướng
 */
function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/" aria-label="Trang chủ">Facebook Clone</Link>
      </div>
      <ul className="navbar-links">
        <li><Link to="/" aria-label="Đi đến trang chủ">Trang chủ</Link></li>
        <li><Link to="/profile" aria-label="Đi đến trang hồ sơ">Hồ sơ</Link></li>
        <li><Link to="/friends" aria-label="Đi đến trang bạn bè">Bạn bè</Link></li>
        <li><button className="logout-btn" aria-label="Đăng xuất">Đăng xuất</button></li>
      </ul>
    </nav>
  );
}

export default Navbar;