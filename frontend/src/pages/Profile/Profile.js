import React, { useState, useEffect } from 'react';
import './Profile.css';
import { useUser } from '../../contexts/UserContext';
import { API_ENDPOINTS } from '../../config/api';
import PostForm from '../../components/Post/PostForm';
import PostList from '../../components/Post/PostList';
import { useParams } from 'react-router-dom';

function Profile() {
  const { userId } = useParams();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  // Lưu trữ giá trị ban đầu để khôi phục khi hủy
  const [originalAvatarPreview, setOriginalAvatarPreview] = useState('');
  const [originalCoverPreview, setOriginalCoverPreview] = useState('');

  // Get userData from localStorage
  const userData = localStorage.getItem('userData');
  const currentUser = userData ? JSON.parse(userData) : null;

  useEffect(() => {
    const fetchProfileAndPosts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Xác định profileId dựa trên userId từ URL hoặc currentUser
        const profileId = userId || currentUser?.id;

        if (!profileId) {
          setError('User not found');
          setIsLoading(false);
          return;
        }

        // Kiểm tra xem có phải profile của chính mình không
        setIsOwnProfile(profileId === currentUser?.id);

        // Fetch profile data
        const profileResponse = await fetch(`${API_ENDPOINTS.BASE_URL}/api/profile/${profileId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('userToken')}`
          }
        });

        if (!profileResponse.ok) {
          throw new Error('Failed to fetch profile');
        }

        const profileData = await profileResponse.json();
        setName(`${profileData.firstName} ${profileData.lastName}`);
        setEmail(profileData.email);
        setBio(profileData.bio || '');
        setGender(profileData.gender || '');
        const avatarUrl = profileData.avatar ? `${API_ENDPOINTS.BASE_URL}${profileData.avatar}` : '/default-imgs/avatar.png';
        const coverUrl = profileData.coverPhoto ? `${API_ENDPOINTS.BASE_URL}${profileData.coverPhoto}` : '/default-imgs/cover.jpg';

        setAvatarPreview(avatarUrl);
        setCoverPreview(coverUrl);

        // Lưu trữ giá trị ban đầu
        setOriginalAvatarPreview(avatarUrl);
        setOriginalCoverPreview(coverUrl);

        // Fetch user's posts using the new endpoint
        const postsResponse = await fetch(
          `${API_ENDPOINTS.BASE_URL}/api/posts/user/${profileId}?viewerId=${currentUser?.id}`, 
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

    fetchProfileAndPosts();
  }, [userId, currentUser?.id]);

  // Nếu không có user data, redirect về login
  useEffect(() => {
    if (!currentUser) {
      window.location.href = '/login';
    }
  }, [currentUser]);

  // Xử lý khi người dùng thoát ra mà không lưu
  useEffect(() => {
    // Khi component unmount hoặc khi isEditing thay đổi từ true sang false
    return () => {
      if (isEditing) {
        // Đặt lại giá trị ban đầu nếu đang trong chế độ chỉnh sửa
        setAvatarPreview(originalAvatarPreview);
        setCoverPreview(originalCoverPreview);
        setAvatar(null);
        setCoverPhoto(null);
      }
    };
  }, [isEditing, originalAvatarPreview, originalCoverPreview]);

  if (error) {
    return <div className="alert alert-danger m-3">{error}</div>;
  }

  if (isLoading) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  const handleAddPost = (newPost) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverPhoto(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('userId', currentUser.id);
    formData.append('name', name);
    formData.append('email', email);
    formData.append('bio', bio);
    formData.append('gender', gender);
    if (avatar) formData.append('avatar', avatar);
    if (coverPhoto) formData.append('coverPhoto', coverPhoto);

    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/profile/update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedProfile = await response.json();

      // Cập nhật giá trị hiển thị
      setName(updatedProfile.firstName + ' ' + updatedProfile.lastName);
      setBio(updatedProfile.bio || '');

      const newAvatarPreview = updatedProfile.avatar ? `${API_ENDPOINTS.BASE_URL}${updatedProfile.avatar}` : avatarPreview;
      const newCoverPreview = updatedProfile.coverPhoto ? `${API_ENDPOINTS.BASE_URL}${updatedProfile.coverPhoto}` : coverPreview;

      setAvatarPreview(newAvatarPreview);
      setCoverPreview(newCoverPreview);

      // Cập nhật giá trị ban đầu sau khi lưu thành công
      setOriginalAvatarPreview(newAvatarPreview);
      setOriginalCoverPreview(newCoverPreview);

      // Xóa các file đã chọn
      setAvatar(null);
      setCoverPhoto(null);

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Đặt lại tất cả các trường về giá trị ban đầu
    setName(currentUser.firstName + ' ' + currentUser.lastName);
    setBio(currentUser.bio || '');

    // Đặt lại avatar và ảnh bìa
    setAvatarPreview(originalAvatarPreview);
    setCoverPreview(originalCoverPreview);

    // Xóa các file đã chọn
    setAvatar(null);
    setCoverPhoto(null);
  };

  return (
    <div className="profile-container" style={{ marginTop: '62px' }}>
      <div className="cover-photo-section">
        {coverPreview && (
          <img
            src={coverPreview}
            alt="Cover"
            className="cover-photo"
            onError={(e) => {
              e.target.src = '/default-imgs/cover.jpg';
            }}
          />
        )}
        {isEditing && isOwnProfile && (
          <label className="cover-upload-button">
            <span className="cover-upload-text">Change Cover Photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              style={{ display: 'none' }}
            />
          </label>
        )}
      </div>

      <div className="profile-header">
        <div className="avatar-section">
          {avatarPreview && (
            <img
              src={avatarPreview}
              alt="Avatar"
              className="avatar"
              onError={(e) => {
                e.target.src = '/default-imgs/avatar.png';
              }}
            />
          )}
          {isEditing && isOwnProfile && (
            <div className="avatar-upload-wrapper">
              <label className="avatar-upload-button">
                Change Avatar
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          )}
        </div>
        <div className="profile-info" style={{ marginTop: '86px' }}>
          <h1 className="profile-name">{name}</h1>
          <p className="profile-bio">{bio}</p>
          {!isEditing && isOwnProfile && (
            <button
              className="edit-profile-button"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {isEditing && isOwnProfile && (
        <div className="profile-form-section">
          <h2 className="form-title">Edit Profile</h2>
          <form className="profile-form" onSubmit={handleSaveProfile}>
            <div className="form-group">
              <label className="form-label" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                className="form-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="bio">
                Bio
              </label>
              <textarea
                id="bio"
                className="form-textarea"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows="4"
              />
            </div>
            <div className="form-buttons">
              <button
                type="button"
                className="cancel-button save-button"
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
              <button type="submit" className="save-button">
                Save
              </button>
            </div>
          </form>
        </div>
      )}

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
    </div>
  );
}

export default Profile;
