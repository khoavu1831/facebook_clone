import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import './PostForm.css';

function PostForm({ onAddPost }) {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('userData'));

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (!currentUser?.id) {
          console.log('No user ID found');
          return;
        }

        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/profile/${currentUser.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('userToken')}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setUserProfile(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError('Failed to load user profile');
        // Nếu token hết hạn, chuyển về trang login
        if (error.message.includes('401')) {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    };

    fetchUserProfile();
  }, [currentUser?.id]);

  const getFullImageUrl = (path) => {
    if (!path) return '/default-imgs/avatar.png';
    if (path.startsWith('http')) return path;
    return `${API_ENDPOINTS.BASE_URL}${path}`;
  };

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMedia(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !media) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('userId', currentUser.id);

      if (media) {
        if (media.type.includes('image')) {
          formData.append('images', media);
        } else if (media.type.includes('video')) {
          formData.append('videos', media);
        }
      }

      const response = await fetch(`${API_ENDPOINTS.POSTS}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      const newPost = await response.json();

      if (!newPost.user) {
        newPost.user = {
          id: currentUser.id,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          avatar: userProfile?.avatar
        };
      }

      if (newPost.images) {
        newPost.images = newPost.images.map(image =>
          image.startsWith('http') ? image : `${API_ENDPOINTS.BASE_URL}${image}`
        );
      }
      if (newPost.videos) {
        newPost.videos = newPost.videos.map(video =>
          video.startsWith('http') ? video : `${API_ENDPOINTS.BASE_URL}${video}`
        );
      }

      onAddPost(newPost);

      setContent('');
      setMedia(null);
      setMediaPreview(null);
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setContent('');
    setMedia(null);
    setMediaPreview(null);
  };

  return (
    <div className="card mb-3">
      <div className="card-body">
        <div className="d-flex align-items-center gap-2 mb-3">
          <img
            src={getFullImageUrl(userProfile?.avatar)}
            alt="User"
            className="rounded-circle"
            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
            onError={(e) => {
              e.target.src = '/default-imgs/avatar.png';
            }}
          />
          <input
            type="text"
            className="form-control rounded-pill post-input"
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        {mediaPreview && (
          <div className="mb-3 text-center">
            {media?.type.includes('video') ? (
              <video
                src={mediaPreview}
                controls
                className="img-fluid rounded"
                style={{ maxWidth: '300px', display: 'block', margin: '0 auto' }}
              />
            ) : (
              <img
                src={mediaPreview}
                alt="Preview"
                className="img-fluid rounded"
                style={{ maxWidth: '300px', display: 'block', margin: '0 auto' }}
              />
            )}
          </div>
        )}
        <div className="d-flex justify-content-between mb-3">
          <button className="btn btn-link text-secondary action-button" disabled={isLoading}>
            <img src="/img/icons/post-live.png" alt="Live" className="action-icon me-1" />
            Live Video
          </button>
          <label htmlFor="media-upload" className="btn btn-link text-secondary action-button">
            <img src="/img/icons/post-picture.png" alt="Photo/Video" className="action-icon me-1" />
            Photo/Video
            <input
              id="media-upload"
              type="file"
              accept="image/*,video/*"
              onChange={handleMediaChange}
              style={{ display: 'none' }}
              disabled={isLoading}
            />
          </label>
          <button className="btn btn-link text-secondary action-button" disabled={isLoading}>
            <img src="/img/icons/post-feeling.png" alt="Feeling" className="action-icon me-1" />
            Feeling/Activity
          </button>
        </div>
        <div className="d-flex justify-content-end gap-2">
          {(content.trim() || media) && (
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
          )}
          <button
            className="btn btn-primary post-button"
            onClick={handleSubmit}
            disabled={isLoading || (!content.trim() && !media)}
          >
            {isLoading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PostForm;
