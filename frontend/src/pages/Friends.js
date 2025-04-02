import React, { useState } from 'react';
import './Friends.css'; // Import CSS

function Friends() {
  const [friends, setFriends] = useState([
    { id: 1, name: 'Melody Marks', isFriend: true, mutualFriends: 1, avatar: '/img/avatars/1.webp' },
    { id: 2, name: 'Ken WangCj', isFriend: true, mutualFriends: 1, avatar: '/img/avatars/2.webp' },
    { id: 3, name: 'Leona', isFriend: false, mutualFriends: 3, avatar: '/img/avatars/3.webp' },
    { id: 4, name: 'Alice69', isFriend: true, mutualFriends: 2, avatar: '/img/avatars/4.webp' },
    { id: 5, name: 'Dinh Ba pHong', isFriend: false, mutualFriends: 0, avatar: '/img/avatars/5.webp' },
    { id: 6, name: 'dOAN Phong luu', isFriend: true, mutualFriends: 5, avatar: '/img/avatars/6.webp' },
    { id: 7, name: 'DPBCod', isFriend: false, mutualFriends: 1, avatar: '/img/avatars/7.webp' },
    { id: 8, name: 'do pu lu', isFriend: true, mutualFriends: 3, avatar: '/img/avatars/8.webp' },
    { id: 9, name: 'Nhin Ve Tuong LAI', isFriend: false, mutualFriends: 2, avatar: '/img/avatars/9.webp' },
    { id: 10, name: 'Cho Dia Nguc', isFriend: true, mutualFriends: 4, avatar: '/img/avatars/10.webp' },
    { id: 11, name: 'Lac Troi', isFriend: false, mutualFriends: 0, avatar: '/img/avatars/11.webp' },
    { id: 12, name: 'Vua mot COI', isFriend: true, mutualFriends: 5, avatar: '/img/avatars/12.webp' },
  ]);
  const [currentPage, setCurrentPage] = useState(1);
  const friendsPerPage = 6;
  const [activeTab, setActiveTab] = useState('requests');

  const suggestions = [
    { id: 13, name: 'Quan vu', mutualFriends: 2, avatar: '/img/avatars/13.webp' },
    { id: 14, name: 'XiaXiaxia99', mutualFriends: 4, avatar: '/img/avatars/14.webp' },
    { id: 15, name: 'Bay anh Hung', mutualFriends: 1, avatar: '/img/avatars/15.webp' },
    { id: 16, name: 'Chu nam nam', mutualFriends: 3, avatar: '/img/avatars/16.webp' },
  ];

  const handleFriendAction = (id, name, isFriend) => {
    if (isFriend) {
      const confirmUnfriend = window.confirm(`Bạn có chắc chắn muốn hủy kết bạn với ${name}?`);
      if (!confirmUnfriend) return;
    }
    setFriends(friends.map((friend) =>
      friend.id === id ? { ...friend, isFriend: !friend.isFriend } : friend
    ));
  };

  const filteredData = activeTab === 'suggestions'
    ? suggestions
    : friends.filter((friend) => activeTab === 'friends' ? friend.isFriend : !friend.isFriend);

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / friendsPerPage);
  const startIndex = (currentPage - 1) * friendsPerPage;
  const endIndex = startIndex + friendsPerPage;
  const currentItems = filteredData.slice(startIndex, endIndex);

  return (
    <div className="friends-page">
      <div className="sidebar">
        <h4>Bạn bè</h4>
        <ul className="nav flex-column">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'requests' ? 'active' : ''}`}
              onClick={() => { setActiveTab('requests'); setCurrentPage(1); }}
            >
              Yêu cầu kết bạn
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'friends' ? 'active' : ''}`}
              onClick={() => { setActiveTab('friends'); setCurrentPage(1); }}
            >
              Danh sách bạn bè
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'suggestions' ? 'active' : ''}`}
              onClick={() => { setActiveTab('suggestions'); setCurrentPage(1); }}
            >
              Gợi ý bạn bè
            </button>
          </li>
        </ul>
      </div>

      <div className="main-content">
        <h1>
          {activeTab === 'requests' ? 'Lời mời kết bạn' : activeTab === 'friends' ? 'Danh sách bạn bè' : 'Gợi ý bạn bè'}
        </h1>
        {currentItems.length === 0 ? (
          <p className="text-muted">Không có dữ liệu để hiển thị.</p>
        ) : (
          <div className="row">
            {currentItems.map((item) => (
              <div key={item.id} className="col-sm-6 col-md-4 col-lg-2 mb-4">
                <div className="card">
                  <div className="card-image-container">
                    <img
                      src={item.avatar || 'https://via.placeholder.com/150'}
                      alt={item.name}
                      className="card-img-top"
                    />
                  </div>
                  <div className="card-body">
                    <h5 className="card-title">{item.name}</h5>
                    <p className="card-text text-muted">{item.mutualFriends} bạn chung</p>
                    {activeTab === 'requests' && (
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-primary w-100"
                          onClick={() => handleFriendAction(item.id, item.name, item.isFriend)}
                        >
                          Xác nhận
                        </button>
                        <button className="btn btn-secondary w-100">Xóa</button>
                      </div>
                    )}
                    {activeTab === 'friends' && (
                      <button
                        className="btn btn-danger w-100"
                        onClick={() => handleFriendAction(item.id, item.name, item.isFriend)}
                      >
                        Hủy kết bạn
                      </button>
                    )}
                    {activeTab === 'suggestions' && (
                      <button className="btn btn-primary w-100">Thêm bạn</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Phân trang với nút Previous/Next ở hai bên */}
        {totalItems > friendsPerPage && (
          <div className="d-flex justify-content-center align-items-center mt-4 pagination">
            <button
              className="carousel-btn carousel-btn-prev"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <span className="carousel-btn-icon carousel-btn-prev-icon" aria-hidden="true"></span>
              <span className="visually-hidden">Previous</span>
            </button>
            <span className="mx-3">Trang {currentPage} trên {totalPages}</span>
            <button
              className="carousel-btn carousel-btn-next"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <span className="carousel-btn-icon carousel-btn-next-icon" aria-hidden="true"></span>
              <span className="visually-hidden">Next</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Friends;