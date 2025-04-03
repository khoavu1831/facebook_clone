import React, { useState } from 'react';
import './PostForm.css';

function PostForm({ onAddPost }) {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMedia(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() && !media) return;
    const newPost = {
      id: Date.now(),
      content,
      media: mediaPreview,
      likes: 0,
      comments: [],
      createdAt: new Date().toISOString(),
    };
    onAddPost(newPost);
    setContent('');
    setMedia(null);
    setMediaPreview(null);
  };

  return (
    <div className="card mb-3">
      <div className="card-body">
        <div className="d-flex align-items-center gap-2 mb-3">
          <img
            src="/img/logo.png"
            alt="User"
            className="rounded-circle"
            style={{ width: '40px', height: '40px' }}
          />
          <input
            type="text"
            className="form-control rounded-pill post-input"
            placeholder="What's on your mind, Althrun Sun?"
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
          <button className="btn btn-link text-secondary action-button">
            <img
              src="/img/icons/post-live.png"
              alt="Live"
              className="action-icon me-1"
            />
            Live Video
          </button>
          <label htmlFor="media-upload" className="btn btn-link text-secondary action-button">
            <img
              src="/img/icons/post-picture.png"
              alt="Photo/Video"
              className="action-icon me-1"
            />
            Photo/Video
            <input
              id="media-upload"
              type="file"
              accept="image/*,video/*"
              onChange={handleMediaChange}
              style={{ display: 'none' }}
            />
          </label>
          <button className="btn btn-link text-secondary action-button">
            <img
              src="/img/icons/post-feeling.png"
              alt="Feeling"
              className="action-icon me-1"
            />
            Feeling/Activity
          </button>
        </div>
        <button className="btn btn-primary w-100 post-button" onClick={handleSubmit}>
          Post
        </button>
      </div>
    </div>
  );
}

export default PostForm;