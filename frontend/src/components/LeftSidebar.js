import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { API_ENDPOINTS } from "../config/api";
import './LeftSidebar.css';

/**
 * Component hiển thị thanh bên trái với các liên kết và thông tin người dùng
 */
function LeftSidebar() {
  const { currentUser } = useUser();
  const [userProfile, setUserProfile] = useState(null);

  /**
   * Lấy thông tin hồ sơ người dùng khi component được mount hoặc currentUser thay đổi
   */
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
        console.error('Lỗi khi lấy thông tin hồ sơ người dùng:', error);
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  /**
   * Lấy URL đầy đủ của hình ảnh
   * @param {string} path - Đường dẫn hình ảnh
   * @returns {string} URL đầy đủ của hình ảnh
   */
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
      {/* Thông tin người dùng */}
      <div className="d-flex align-items-center gap-2 mb-3">
        <Link to="/profile" style={{ textDecoration: "none", color: "black" }} aria-label="Xem hồ sơ cá nhân">
          <div className="d-flex align-items-center flex-row">
            <img
              src={getFullImageUrl(userProfile?.avatar)}
              alt="Ảnh đại diện"
              className="rounded-circle"
              style={{ width: "40px", height: "40px", objectFit: "cover" }}
            />
            <span style={{ marginLeft: '6px', fontSize: '18px' }}>
              {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'Đang tải...'}
            </span>
          </div>
        </Link>
      </div>

      {/* Danh sách liên kết */}
      <ul className="list-unstyled">
        <li className="mb-2">
          <Link
            to="/friends"
            className="text-dark text-decoration-none d-flex align-items-center gap-2 sidebar-item"
            aria-label="Xem danh sách bạn bè"
          >
            <img
              src="/img/icons/friend.png"
              alt="Biểu tượng bạn bè"
              className="action-icon"
            />
            <span>Bạn bè</span>
          </Link>
        </li>
        <li className="mb-2">
          <Link
            to="/groups"
            className="text-dark text-decoration-none d-flex align-items-center gap-2 sidebar-item"
            aria-label="Xem nhóm"
          >
            <img
              src="/img/icons/groups.png"
              alt="Biểu tượng nhóm"
              className="action-icon"
            />
            <span>Nhóm</span>
          </Link>
        </li>
        <li className="mb-2">
          <Link
            to="/marketplace"
            className="text-dark text-decoration-none d-flex align-items-center gap-2 sidebar-item"
            aria-label="Xem marketplace"
          >
            <img
              src="/img/icons/market.png"
              alt="Biểu tượng marketplace"
              className="action-icon"
            />
            <span>Marketplace</span>
          </Link>
        </li>
        <li className="mb-2">
          <Link
            to="/watch"
            className="text-dark text-decoration-none d-flex align-items-center gap-2 sidebar-item"
            aria-label="Xem video"
          >
            <img
              src="/img/icons/reel.png"
              alt="Biểu tượng video"
              className="action-icon"
            />
            <span>Watch</span>
          </Link>
        </li>
        <li className="mb-2">
          <Link
            to="/memories"
            className="text-dark text-decoration-none d-flex align-items-center gap-2 sidebar-item"
            aria-label="Xem kỷ niệm"
          >
            <img
              src="/img/icons/memories.png"
              alt="Biểu tượng kỷ niệm"
              className="action-icon"
            />
            <span>Kỷ niệm</span>
          </Link>
        </li>
        <li className="mb-2">
          <Link
            to="/more"
            className="text-dark text-decoration-none d-flex align-items-center gap-2 sidebar-item"
            aria-label="Xem thêm"
          >
            <img
              src="/img/icons/plus-sign.png"
              alt="Biểu tượng xem thêm"
              className="action-icon"
            />
            <span>Xem thêm</span>
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default LeftSidebar;
