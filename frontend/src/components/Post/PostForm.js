import React, { useState } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import './PostForm.css';

function PostForm({ onAddPost }) {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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
      formData.append('userId', JSON.parse(localStorage.getItem('userData')).id);
      
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
      onAddPost(newPost);
      
      // Reset form
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

  return (
    <div className="card mb-3">
      <div className="card-body">
        <div className="d-flex align-items-center gap-2 mb-3">
          <img
            src={JSON.parse(localStorage.getItem('userData'))?.avatar || "/img/logo.png"}
            alt="User"
            className="rounded-circle"
            style={{ width: '40px', height: '40px' }}
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
          <div className="mb-3">
            {media?.type.includes('video') ? (
              <video src={mediaPreview} controls className="img-fluid rounded" />
            ) : (
              <img src={mediaPreview} alt="Preview" className="img-fluid rounded" />
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
        <button 
          className="btn btn-primary w-100 post-button" 
          onClick={handleSubmit}
          disabled={isLoading || (!content.trim() && !media)}
        >
          {isLoading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  );
}

export default PostForm;
