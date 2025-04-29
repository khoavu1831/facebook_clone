import React, { useState, useEffect } from 'react';
import './Profile.css';
import { useUser } from '../../contexts/UserContext';
import { API_ENDPOINTS } from '../../config/api';
import PostForm from '../../components/Post/PostForm';
import PostList from '../../components/Post/PostList';
import { useParams } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import EditProfileModal from '../../components/Profile/EditProfileModal';

function Profile() {
  const { userId } = useParams();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [imageVersion, setImageVersion] = useState(Date.now()); // State to track image version for cache busting
  const [showEditModal, setShowEditModal] = useState(false);

  // Sử dụng UserContext thay vì lấy trực tiếp từ localStorage
  const { currentUser, updateUser } = useUser();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    const fetchProfileAndPosts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Xác định profileId dựa trên userId từ URL, currentUser, hoặc localStorage
        let profileId = userId;

        if (!profileId) {
          // Nếu không có userId trong URL, thử lấy từ currentUser
          profileId = currentUser?.id;

          // Nếu vẫn không có, thử lấy từ localStorage
          if (!profileId) {
            try {
              const userData = JSON.parse(localStorage.getItem('userData'));
              profileId = userData?.id;
            } catch (e) {
              console.error('Error parsing userData from localStorage:', e);
            }
          }
        }

        if (!profileId) {
          setError('User not found');
          setIsLoading(false);
          return;
        }

        // Kiểm tra xem có phải profile của chính mình không
        // Nếu currentUser không có, thử lấy từ localStorage
        let currentUserId = currentUser?.id;
        if (!currentUserId) {
          try {
            const userData = JSON.parse(localStorage.getItem('userData'));
            currentUserId = userData?.id;
          } catch (e) {
            console.error('Error parsing userData for isOwnProfile check:', e);
          }
        }
        setIsOwnProfile(profileId === currentUserId);

        // Fetch profile data
        const profileResponse = await fetch(`${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.PROFILE}/${profileId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('userToken')}`
          }
        });

        if (!profileResponse.ok) {
          throw new Error('Failed to fetch profile');
        }

        const profileData = await profileResponse.json();

        // Store the complete profile data
        setProfileData(profileData);

        // Update imageVersion to force re-render of images
        setImageVersion(Date.now());

        // Fetch user's posts using the new endpoint
        const postsResponse = await fetch(
          `${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.POSTS}/user/${profileId}?viewerId=${currentUser?.id}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('userToken')}`
            }
          }
        );

        if (!postsResponse.ok) {
          throw new Error('Failed to fetch posts');
        }

        const postsData = await postsResponse.json();
        setPosts(Array.isArray(postsData) ? postsData : []);

      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    // Always try to fetch profile data if there's a token
    const hasToken = !!localStorage.getItem('userToken');
    if (hasToken) {
      fetchProfileAndPosts();
    }
  }, [userId, currentUser?.id]);

  // Nếu không có user data, sử dụng cached data từ localStorage thay vì redirect
  useEffect(() => {
    // Kiểm tra xem có token không thay vì kiểm tra currentUser
    const hasToken = !!localStorage.getItem('userToken');

    // Chỉ redirect nếu không có token
    if (!hasToken) {
      console.log("No token found in Profile, redirecting to login");
      window.location.href = '/login';
    }
  }, []);

  if (error) {
    return <div className="alert alert-danger m-3">{error}</div>;
  }

  if (isLoading) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  const handleAddPost = (newPost) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  const handleProfileUpdate = (updatedUserData) => {
    // Update the profile data state
    setProfileData(updatedUserData);

    // Update the user context
    updateUser(updatedUserData);

    // Force re-render of images with a new timestamp
    setImageVersion(Date.now());
  };

  // Get formatted name and prepare image URLs
  const getFullImageUrl = (path) => {
    if (!path) return '/default-imgs/avatar.png';
    if (path.startsWith('http') || path.startsWith('blob')) return path;
    return `${API_ENDPOINTS.BASE_URL}${path.startsWith('/') ? '' : '/'}${path}?v=${imageVersion}`;
  };

  // Format user data for display
  const fullName = profileData ? `${profileData.firstName} ${profileData.lastName}` : '';
  const bio = profileData?.bio || '';
  const avatarUrl = profileData?.avatar ? getFullImageUrl(profileData.avatar) : '/default-imgs/avatar.png';
  const coverUrl = profileData?.coverPhoto ? getFullImageUrl(profileData.coverPhoto) : '/default-imgs/cover.jpg';

  return (
    <div className="profile-container" style={{ marginTop: '62px' }}>
      <div className="cover-photo-section">
        <img
          src={coverUrl}
          alt="Cover"
          className="cover-photo"
          onError={(e) => {
            e.target.src = '/default-imgs/cover.jpg';
          }}
          key={`cover-${imageVersion}`}
        />
      </div>

      <div className="profile-header">
        <div className="avatar-section">
          <img
            src={avatarUrl}
            alt="Avatar"
            className="avatar"
            onError={(e) => {
              e.target.src = '/default-imgs/avatar.png';
            }}
            key={`avatar-${imageVersion}`}
          />
        </div>
        <div className="profile-info" style={{ marginTop: '86px' }}>
          <h1 className="profile-name">{fullName}</h1>
          <p className="profile-bio">{bio}</p>
          {isOwnProfile && (
            <button
              className="edit-profile-button"
              onClick={() => setShowEditModal(true)}
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="profile-content">
        {isOwnProfile && <PostForm onAddPost={handleAddPost} />}
        {posts.length > 0 ? (
          <PostList
            posts={posts}
            setPosts={setPosts}
            currentUser={currentUser}
          />
        ) : (
          <p className="text-center mt-3">No posts yet</p>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isOwnProfile && (
        <EditProfileModal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          userData={profileData}
          onProfileUpdate={handleProfileUpdate}
          onSuccess={(message) => showSuccess(message)}
          onError={(message) => showError(message)}
        />
      )}
    </div>
  );
}

export default Profile;
