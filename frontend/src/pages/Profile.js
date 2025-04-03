import React, { useState } from 'react';
import './Profile.css';
import PostForm from '../components/Post/PostForm';
import PostList from '../components/Post/PostList';

function Profile() {
  const [name, setName] = useState('Messi Kaiwu');
  const [email, setEmail] = useState('iamkaiwu@vv.com');
  const [bio, setBio] = useState('Siuuuuuuuuuuuuu!');
  const [avatar, setAvatar] = useState('img/messi.jpg');
  const [avatarPreview, setAvatarPreview] = useState('img/messi.jpg');
  const [coverPhoto, setCoverPhoto] = useState('img/ronaldo.webp');
  const [coverPreview, setCoverPreview] = useState('img/ronaldo.webp');
  const [isEditing, setIsEditing] = useState(false);
  const [posts, setPosts] = useState([]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    } else {
      alert('Please select an image file');
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setCoverPhoto(file);
      setCoverPreview(URL.createObjectURL(file));
    } else {
      alert('Please select an image file');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Profile updated:', { name, email, bio, avatar, coverPhoto });
    setIsEditing(false);
  };

  const handleAddPost = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const getInitial = () => name.charAt(0).toUpperCase();

  return (
    <div className="profile-container" style={{ marginTop: '62px' }}>
      <div className="cover-photo-section">
        {coverPreview ? (
          <img
            src={coverPreview}
            alt="Cover"
            className="cover-photo"
            onError={(e) => {
              e.target.src = 'img/default-cover.jpg'; // Ảnh mặc định nếu lỗi
            }}
          />
        ) : (
          <div className="cover-placeholder"></div>
        )}
        {isEditing && (
          <label className="cover-upload-button">
            {console.log('hello')}
            <span className="cover-upload-text">
              Change Cover Photo
            </span>
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
          {avatarPreview ? (
            <img src={avatarPreview} alt="Avatar" className="avatar" />
          ) : (
            <div className="avatar-placeholder">{getInitial()}</div>
          )}
          {isEditing && (
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
          <button
            className="edit-profile-button"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="profile-form-section">
          <h3 className="form-title">Update Profile</h3>
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="name" className="form-label">Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="bio" className="form-label">Bio</label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="form-textarea"
                rows="3"
              />
            </div>
            <button type="submit" className="save-button">Save Changes</button>
          </form>
        </div>
      )}

      <div className="profile-content">
        <PostForm onAddPost={handleAddPost} />
        <PostList posts={posts} setPosts={setPosts} />
      </div>
    </div>
  );
}

export default Profile;