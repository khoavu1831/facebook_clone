import React from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Thêm useNavigate

function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Logic đăng xuất (xóa token, state, v.v.) sẽ được thêm sau khi có backend
    console.log('User logged out');
    navigate('/login'); // Chuyển hướng về trang đăng nhập
  };

  return (
    <header className="bg-white shadow-sm fixed-top">
      <div className="container-fluid d-flex align-items-center justify-content-between py-2">
        {/* Left: Logo and Search */}
        <div className="d-flex align-items-center gap-3">
          <Link to="/" className="fs-2 fw-bold text-primary text-decoration-none">f</Link>
          <input
            type="text"
            className="form-control rounded-pill"
            placeholder="Search Facebook"
            style={{ width: '200px' }}
          />
        </div>

        {/* Center: Navigation Icons */}
        <div className="d-flex gap-4">
          <Link to="/" className="text-secondary fs-4 text-decoration-none">🏠</Link>
          <Link to="/friends" className="text-secondary fs-4 text-decoration-none">👥</Link>
        </div>

        {/* Right: User Info and Icons */}
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-2">
            <img
              src="/img/logo.png"
              alt="User"
              className="rounded-circle"
              style={{ width: '30px', height: '30px' }}
            />
            <span>MaGaming</span>
          </div>
          <div className="text-secondary fs-5">🔔</div>
          <div className="text-secondary fs-5">💬</div>
          <button
            className="btn btn-outline-danger btn-sm"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;