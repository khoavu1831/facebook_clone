import React, { useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import './Friends.css';

const getFullImageUrl = (path) => {
  if (!path) return '/default-imgs/avatar.png';
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

  // Reference to track if component is mounted
  const isMounted = useRef(true);

  const fetchData = async () => {
    try {
      let endpoint;
      switch (activeTab) {
        case 'requests':
          endpoint = `${API_ENDPOINTS.BASE_URL}/api/friends/requests/${currentUser.id}`;
          console.log('Fetching friend requests from:', endpoint);
          const requestsResponse = await fetch(endpoint);
          const requestsData = await requestsResponse.json();
          console.log('Friend requests data:', requestsData);
          setRequests(requestsData);
          break;
        case 'friends':
          endpoint = `${API_ENDPOINTS.BASE_URL}/api/friends/list/${currentUser.id}`;
          console.log('Fetching friends list from:', endpoint);
          const friendsResponse = await fetch(endpoint);
          const friendsData = await friendsResponse.json();
          console.log('Friends data:', friendsData);
          setFriends(friendsData);
          break;
        case 'suggestions':
          endpoint = `${API_ENDPOINTS.BASE_URL}/api/friends/suggestions/${currentUser.id}`;
          console.log('Fetching friend suggestions from:', endpoint);
          const suggestionsResponse = await fetch(endpoint);
          const suggestionsData = await suggestionsResponse.json();
          console.log('Friend suggestions data:', suggestionsData);
          setSuggestions(suggestionsData);
          break;
        default:
          console.log('Unknown tab:', activeTab);
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };



  // Thêm hàm để lấy danh sách bạn bè định kỳ
  const setupPeriodicDataFetch = () => {
    // Lấy dữ liệu mới mỗi 10 giây
    return setInterval(() => {
      if (isMounted.current && currentUser?.id) {
        console.log('Periodic data fetch in Friends component');
        fetchData();
      }
    }, 10000); // 10 giây
  };

  useEffect(() => {
    console.log('Friends component: Fetching data for tab', activeTab);
    fetchData();

    // Thiết lập lấy dữ liệu định kỳ
    const periodicFetchInterval = setupPeriodicDataFetch();

    // Cleanup function
    return () => {
      clearInterval(periodicFetchInterval);
      isMounted.current = false;
    };
  }, [activeTab, currentUser.id]);

  const handleFriendAction = async (id, action) => {
    try {
      let endpoint;
      let method;
      let body;

      // Cập nhật UI ngay lập tức trước khi gửi request để tạo trải nghiệm mượt mà hơn
      switch (action) {
        case 'accept':
          // Xóa khỏi danh sách yêu cầu và thêm vào danh sách bạn bè
          if (activeTab === 'requests') {
            const requestToAccept = requests.find(req => req.requestId === id);
            if (requestToAccept && requestToAccept.user) {
              // Xóa khỏi danh sách yêu cầu
              setRequests(prev => prev.filter(req => req.requestId !== id));

              // Thêm vào danh sách bạn bè ngay lập tức
              const newFriend = requestToAccept.user;
              console.log('Adding new friend to friends list:', newFriend);

              // Thêm vào danh sách bạn bè ngay lập tức
              setFriends(prev => {
                const exists = prev.some(friend => friend.id === newFriend.id);
                if (!exists) {
                  return [...prev, newFriend];
                }
                return prev;
              });
            }
          }
          endpoint = `${API_ENDPOINTS.BASE_URL}/api/friends/respond`;
          method = 'POST';
          body = JSON.stringify({
            requestId: id,
            response: 'ACCEPTED'
          });
          break;

        case 'reject':
          // Xóa khỏi danh sách yêu cầu
          if (activeTab === 'requests') {
            setRequests(prev => prev.filter(req => req.requestId !== id));
          }
          endpoint = `${API_ENDPOINTS.BASE_URL}/api/friends/respond`;
          method = 'POST';
          body = JSON.stringify({
            requestId: id,
            response: 'REJECTED'
          });
          break;

        case 'unfriend':
          // Xóa khỏi danh sách bạn bè
          if (activeTab === 'friends') {
            setFriends(prev => prev.filter(friend => friend.id !== id));
          }
          endpoint = `${API_ENDPOINTS.BASE_URL}/api/friends/${currentUser.id}/${id}`;
          method = 'DELETE';
          break;

        case 'add':
          // Đánh dấu đã gửi lời mời kết bạn
          if (activeTab === 'suggestions') {
            // Có thể thêm trạng thái "Đã gửi lời mời" cho người dùng này
            // hoặc xóa khỏi danh sách gợi ý
            setSuggestions(prev => prev.filter(user => user.id !== id));
          }
          endpoint = `${API_ENDPOINTS.BASE_URL}/api/friends/request`;
          method = 'POST';
          body = JSON.stringify({
            userId: currentUser.id,
            friendId: id
          });
          break;
      }

      console.log(`Sending ${method} request to ${endpoint}`);
      console.log('Request body:', body);
      console.log('Auth token:', localStorage.getItem('userToken'));

      try {
        // Gửi request API
        const response = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('userToken')}`
          },
          body
        });

        console.log('Response status:', response.status);

        // Log the full response for debugging
        const responseText = await response.text();
        console.log('Response text:', responseText);

        // Parse the response if it's JSON
        let responseData;
        try {
          responseData = JSON.parse(responseText);
          console.log('Parsed response data:', responseData);
        } catch (e) {
          console.log('Response is not JSON');
        }

        if (!response.ok) {
          throw new Error(responseData?.error || responseData?.message || 'Action failed');
        }

        console.log(`${action} action completed successfully`);

        // Lấy dữ liệu mới nhất từ server sau khi thực hiện hành động
        // để đảm bảo UI đồng bộ với server
        setTimeout(() => {
          console.log('Refreshing data after action');
          fetchData();
        }, 500); // Đợi 500ms để server có thời gian xử lý

        return responseData;
      } catch (error) {
        console.error('Network or parsing error:', error);
        throw error;
      }

    } catch (error) {
      console.error('Error in handleFriendAction:', error);
      alert(`Failed to perform action: ${error.message}. Please try again.`);
      // Nếu có lỗi, cập nhật lại dữ liệu để đồng bộ với server
      fetchData();
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
          <p className="text-muted">Chưa có lời mời kết bạn nào.</p>
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
                        <div className="button-group request-buttons">
                          <button
                            className="btn btn-primary"
                            onClick={() => handleFriendAction(item.requestId, 'accept')}
                          >
                            Chấp nhận
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleFriendAction(item.requestId, 'reject')}
                          >
                            Từ chối
                          </button>
                        </div>
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
          <div className="pagination d-flex align-items-center justify-content-center">
            <button
              className="btn btn-outline-primary pagination-arrow"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              &lt;
            </button>
            <span className="pagination-text mx-3">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="btn btn-outline-primary pagination-arrow"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              &gt;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Friends;
