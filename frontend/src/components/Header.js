import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../utils/auth";
import NotificationDropdown from "./Notification/NotificationDropdown";
import { useUser } from "../contexts/UserContext";
import { API_ENDPOINTS } from "../config/api";
import { useToast } from "../context/ToastContext";
import "./Header.css";

/**
 * Component header chính của ứng dụng
 * Hiển thị logo, thanh tìm kiếm, thông báo và thông tin người dùng
 */
function Header() {
  const navigate = useNavigate();
  const { currentUser } = useUser(); // Sử dụng UserContext thay vì state cục bộ
  const [avatarKey, setAvatarKey] = useState(Date.now());
  const [searchQuery, setSearchQuery] = useState("");
  const { showError } = useToast();

  /**
   * Cập nhật lại avatar khi thông tin người dùng thay đổi
   */
  useEffect(() => {
    if (currentUser) {
      // Cập nhật key để buộc render lại avatar
      setAvatarKey(Date.now());
    }
  }, [currentUser]);

  /**
   * Xử lý đăng xuất
   * Xóa thông tin đăng nhập và chuyển hướng về trang đăng nhập
   */
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  /**
   * Xử lý tìm kiếm
   * @param {Event} e - Sự kiện submit form
   */
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      showError("Vui lòng nhập từ khóa tìm kiếm");
      return;
    }
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <header className="bg-white shadow-sm fixed-top">
      <div className="container-fluid d-flex align-items-center justify-content-between py-2">
        {/* Phần trái: Logo và ô tìm kiếm */}
        <div className="d-flex align-items-center gap-2">
          <Link to="/" className="text-decoration-none" aria-label="Trang chủ">
            <img
              src="/img/facebook-logo.png"
              alt="Logo Facebook"
              style={{ width: "40px", height: "40px" }}
            />
          </Link>
          <form onSubmit={handleSearch} className="d-flex search-input-container">
            <input
              type="text"
              className="form-control rounded-pill search-input"
              placeholder="Tìm kiếm bài viết"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Nhập từ khóa tìm kiếm"
            />
          </form>
        </div>

        {/* Phần phải: Thông tin người dùng và các biểu tượng */}
        <div className="d-flex align-items-center gap-3">
          {/* Avatar người dùng */}
          {currentUser && (
            <Link
              to="/profile"
              className="d-flex align-items-center gap-2 text-decoration-none"
              aria-label="Xem hồ sơ cá nhân"
            >
              <img
                src={currentUser.avatar
                  ? (currentUser.avatar.startsWith('blob:')
                      ? currentUser.avatar
                      : `${API_ENDPOINTS.BASE_URL}${currentUser.avatar}?t=${avatarKey}`)
                  : '/default-imgs/avatar.png'}
                alt={`Ảnh đại diện của ${currentUser.firstName} ${currentUser.lastName}`}
                className="rounded-circle"
                style={{ width: "40px", height: "40px", objectFit: "cover" }}
                onError={(e) => {
                  e.target.src = '/default-imgs/avatar.png';
                }}
                key={`header-avatar-${currentUser.id}-${avatarKey}`}
              />
              <span className="d-none d-md-inline text-dark">{currentUser.firstName}</span>
            </Link>
          )}

          {/* Thông báo */}
          {currentUser && <NotificationDropdown currentUser={currentUser} />}

          {/* Nút đăng xuất */}
          <button
            className="btn btn-sm"
            onClick={handleLogout}
            title="Đăng xuất"
            aria-label="Đăng xuất khỏi tài khoản"
          >
            <img
              src="/img/logout.png"
              alt="Biểu tượng đăng xuất"
              style={{ width: "36px", height: "36px" }}
            />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
