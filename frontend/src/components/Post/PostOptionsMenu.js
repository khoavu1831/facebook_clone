import React, { useState, useRef, useEffect } from 'react';
import './PostOptionsMenu.css';

const PostOptionsMenu = ({ postId, onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Xử lý click bên ngoài menu để đóng menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Xử lý khi click vào nút tùy chọn
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Xử lý khi click vào tùy chọn chỉnh sửa
  const handleEdit = () => {
    onEdit();
    setIsOpen(false);
  };

  // Xử lý khi click vào tùy chọn xóa
  const handleDelete = () => {
    onDelete();
    setIsOpen(false);
  };

  return (
    <div className="post-options-menu-container" ref={menuRef}>
      <button 
        className="btn btn-sm btn-link text-secondary options-button" 
        onClick={toggleMenu}
        aria-label="Post options"
      >
        <i className="bi bi-three-dots-vertical"></i>
      </button>
      
      {isOpen && (
        <div className="options-menu">
          <button className="option-item" onClick={handleEdit}>
            <i className="bi bi-pencil me-2"></i> Chỉnh sửa
          </button>
          <button className="option-item text-danger" onClick={handleDelete}>
            <i className="bi bi-trash me-2"></i> Xóa
          </button>
        </div>
      )}
    </div>
  );
};

export default PostOptionsMenu;
