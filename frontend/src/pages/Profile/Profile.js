import React, { useState, useEffect } from 'react';
import './Profile.css'; // Sử dụng CSS thông thường thay vì CSS module
import { useUser } from '../../contexts/UserContext';
import { API_ENDPOINTS } from '../../config/api';
import PostForm from "../../components/Post/PostForm";
import PostList from "../../components/Post/PostList";

function Profile() {
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
  
  const currentUser = JSON.parse(localStorage.getItem('userData'));

  useEffect(() => {
    const fetchProfileAndPosts = async () => {
      try {
        setIsLoading(true);
        
        // Fetch profile data
        const profileResponse = await fetch(`${API_ENDPOINTS.BASE_URL}/api/profile/${currentUser.id}`);
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setName(`${profileData.firstName} ${profileData.lastName}`);
          setEmail(profileData.email);
          setBio(profileData.bio || '');
          setGender(profileData.gender || '');
          setAvatarPreview(profileData.avatar ? `${API_ENDPOINTS.BASE_URL}${profileData.avatar}` : '/img/default-avatar.jpg');
          setCoverPreview(profileData.coverPhoto ? `${API_ENDPOINTS.BASE_URL}${profileData.coverPhoto}` : '/img/default-cover.jpg');
        }

        // Fetch user's posts
        const postsResponse = await fetch(`${API_ENDPOINTS.BASE_URL}/api/posts?userId=${currentUser.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('userToken')}`
          }
        });
        
        if (postsResponse.ok) {
          const postsData = await postsResponse.json();
          setPosts(postsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser?.id) {
      fetchProfileAndPosts();
    }
  }, [currentUser?.id]);

  const handleAddPost = (newPost) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverPhoto(file);
      setCoverPreview(URL.createObjectURL(file));
      
      const formData = new FormData();
      formData.append('userId', currentUser.id);
      formData.append('name', name);
      formData.append('email', email);
      formData.append('bio', bio);
      formData.append('gender', gender);
      formData.append('coverPhoto', file);

      try {
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/profile/update`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('userToken')}`
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error('Failed to update cover photo');
        }

        const updatedProfile = await response.json();
        setCoverPreview(`${API_ENDPOINTS.BASE_URL}${updatedProfile.coverPhoto}`);
      } catch (error) {
        console.error('Error updating cover photo:', error);
        // Revert preview if update fails
        setCoverPreview(coverPreview);
      }
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
      
      const formData = new FormData();
      formData.append('userId', currentUser.id);
      formData.append('name', name);
      formData.append('email', email);
      formData.append('bio', bio);
      formData.append('gender', gender);
      formData.append('avatar', file);

      try {
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/profile/update`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('userToken')}`
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error('Failed to update avatar');
        }

        const updatedProfile = await response.json();
        setAvatarPreview(`${API_ENDPOINTS.BASE_URL}${updatedProfile.avatar}`);
      } catch (error) {
        console.error('Error updating avatar:', error);
        // Revert preview if update fails
        setAvatarPreview(avatarPreview);
      }
    }
  };

  if (isLoading) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  return (
    <div className="profile-container" style={{ marginTop: "62px" }}>
      <div className="cover-photo-section">
        {coverPreview && (
          <img
            src={coverPreview}
            alt="Cover"
            className="cover-photo"
            onError={(e) => {
              e.target.src = "/img/default-cover.jpg";
            }}
          />
        )}
        {isEditing && (
          <label className="cover-upload-button">
            <span className="cover-upload-text">Change Cover Photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              style={{ display: "none" }}
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
                e.target.src = "/img/default-avatar.jpg";
              }}
            />
          )}
          {isEditing && (
            <div className="avatar-upload-wrapper">
              <label className="avatar-upload-button">
                Change Avatar
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          )}
        </div>
        <div className="profile-info" style={{ marginTop: "86px" }}>
          <h1 className="profile-name">{name}</h1>
          <p className="profile-bio">{bio}</p>
          {!isEditing && (
            <button
              className="edit-profile-button"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Profile content section */}
      <div className="profile-content">
        <PostForm onAddPost={handleAddPost} />
        {posts.length > 0 ? (
          <PostList posts={posts} setPosts={setPosts} />
        ) : (
          <p className="text-center mt-3">No posts yet</p>
        )}
      </div>
    </div>
  );
}

export default Profile;
