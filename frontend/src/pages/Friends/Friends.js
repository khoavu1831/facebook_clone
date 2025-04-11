import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import './Friends.css';

const getFullImageUrl = (path) => {
  if (!path) return 'https://via.placeholder.com/150';
  if (path.startsWith('http')) return path;
  return `${API_ENDPOINTS.BASE_URL}${path}`;
};

function Friends() {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('requests');
  const friendsPerPage = 6;
  const currentUser = JSON.parse(localStorage.getItem('userData'));

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      let endpoint;
      switch (activeTab) {
        case 'requests':
          endpoint = `${API_ENDPOINTS.BASE_URL}/api/friends/requests/${currentUser.id}`;
          const requestsResponse = await fetch(endpoint);
          const requestsData = await requestsResponse.json();
          setRequests(requestsData);
          break;
        case 'friends':
          endpoint = `${API_ENDPOINTS.BASE_URL}/api/friends/list/${currentUser.id}`;
          const friendsResponse = await fetch(endpoint);
          const friendsData = await friendsResponse.json();
          setFriends(friendsData);
          break;
        case 'suggestions':
          endpoint = `${API_ENDPOINTS.BASE_URL}/api/friends/suggestions/${currentUser.id}`;
          const suggestionsResponse = await fetch(endpoint);
          const suggestionsData = await suggestionsResponse.json();
          setSuggestions(suggestionsData);
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleFriendAction = async (id, action) => {
    try {
      let endpoint;
      let method;
      let body;

      switch (action) {
        case 'accept':
          endpoint = `${API_ENDPOINTS.BASE_URL}/api/friends/respond`;
          method = 'POST';
          body = JSON.stringify({
            requestId: id,
            response: 'ACCEPTED'
          });
          break;
        case 'reject':
          endpoint = `${API_ENDPOINTS.BASE_URL}/api/friends/respond`;
          method = 'POST';
          body = JSON.stringify({
            requestId: id,
            response: 'REJECTED'
          });
          break;
        case 'unfriend':
          endpoint = `${API_ENDPOINTS.BASE_URL}/api/friends/${currentUser.id}/${id}`;
          method = 'DELETE';
          break;
        case 'add':
          endpoint = `${API_ENDPOINTS.BASE_URL}/api/friends/request`;
          method = 'POST';
          body = JSON.stringify({
            userId: currentUser.id,
            friendId: id
          });
          break;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body
      });

      if (!response.ok) throw new Error('Action failed');

      // Refresh data after action
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to perform action. Please try again.');
    }
  };

  const filteredData = activeTab === 'suggestions' 
    ? suggestions 
    : activeTab === 'requests' 
    ? requests 
    : friends;

  const totalPages = Math.ceil(filteredData.length / friendsPerPage);
  const startIndex = (currentPage - 1) * friendsPerPage;
  const currentItems = filteredData.slice(startIndex, startIndex + friendsPerPage);

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
              Yêu cầu kết bạn ({requests.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'friends' ? 'active' : ''}`}
              onClick={() => { setActiveTab('friends'); setCurrentPage(1); }}
            >
              Danh sách bạn bè ({friends.length})
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
              <div key={item.requestId || (item.user && item.user.id) || item.id} className="col-sm-6 col-md-4 col-lg-2 mb-4">
                <div className="card">
                  <div className="card-image-container">
                    <img
                      src={getFullImageUrl(item.user?.avatar || item.avatar)}
                      alt={`${item.user?.firstName || item.firstName} ${item.user?.lastName || item.lastName}`}
                      className="card-img-top"
                    />
                  </div>
                  <div className="card-body">
                    <h5 className="card-title">
                      {item.user ? `${item.user.firstName} ${item.user.lastName}` : `${item.firstName} ${item.lastName}`}
                    </h5>
                    <div className="button-group">
                      {activeTab === 'requests' && (
                        <>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleFriendAction(item.requestId, 'accept')}
                          >
                            Chấp nhận
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleFriendAction(item.requestId, 'reject')}
                          >
                            Từ chối
                          </button>
                        </>
                      )}
                      {activeTab === 'friends' && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleFriendAction(item.id, 'unfriend')}
                        >
                          Hủy kết bạn
                        </button>
                      )}
                      {activeTab === 'suggestions' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleFriendAction(item.id, 'add')}
                        >
                          Kết bạn
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {totalPages > 1 && (
          <div className="pagination justify-content-center">
            <button
              className="btn btn-outline-primary me-2"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="mx-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="btn btn-outline-primary ms-2"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Friends;
