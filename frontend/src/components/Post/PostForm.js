import React, { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import './PostForm.css';
import { useToast } from '../../context/ToastContext';

function PostForm({ onAddPost }) {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState([]);
  const [mediaPreview, setMediaPreview] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState(null);
  const [privacy, setPrivacy] = useState('PUBLIC'); // Mặc định là PUBLIC

  const { showSuccess, showError } = useToast();
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

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      // Xóa các URL object đã tạo để tránh memory leak
      mediaPreview.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [mediaPreview]);

  const getFullImageUrl = (path) => {
    if (!path) return '/default-imgs/avatar.png';
    if (path.startsWith('http') || path.startsWith('blob')) return path;
    return `${API_ENDPOINTS.BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setMedia(prevMedia => [...prevMedia, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setMediaPreview(prevPreviews => [...prevPreviews, ...newPreviews]);
    }
  };

  // Xử lý khi xóa media
  const handleRemoveMedia = (index) => {
    // Lấy URL của preview để xóa
    const previewUrl = mediaPreview[index];
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    // Cập nhật state
    setMedia(prevMedia => prevMedia.filter((_, i) => i !== index));
    setMediaPreview(prevPreviews => prevPreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && media.length === 0) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('userId', currentUser.id);
      formData.append('privacy', privacy);

      if (media.length > 0) {
        media.forEach((file, index) => {
          if (file.type.includes('image')) {
            formData.append('images', file);
          } else if (file.type.includes('video')) {
            formData.append('videos', file);
          }
        });
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
      showSuccess('Đăng bài viết thành công');

      // Reset form
      handleCancel();
    } catch (error) {
      console.error('Error creating post:', error);
      showError('Không thể đăng bài viết. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Xóa các URL object đã tạo để tránh memory leak
    mediaPreview.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });

    // Reset các state
    setContent('');
    setMedia([]);
    setMediaPreview([]);
    setPrivacy('PUBLIC');
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
            placeholder="Bạn đang nghĩ gì?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        {mediaPreview.length > 0 && (
          <div className="mb-3">
            <div className="media-grid mb-2" data-count={mediaPreview.length}>
              {mediaPreview.map((preview, index) => (
                <div key={index} className="media-item position-relative">
                  {media[index].type.includes('video') ? (
                    <video
                      src={preview}
                      controls
                      className="img-fluid rounded"
                      style={{ maxHeight: '300px', objectFit: 'cover' }}
                    />
                  ) : (
                    <img
                      src={preview}
                      alt={`Hình ảnh ${index + 1}`}
                      className="img-fluid rounded"
                      style={{ maxHeight: '300px', objectFit: 'cover' }}
                    />
                  )}
                  <button
                    type="button"
                    className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle"
                    style={{ width: '24px', height: '24px', padding: '0', lineHeight: '24px' }}
                    onClick={() => handleRemoveMedia(index)}
                    disabled={isLoading}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                </div>
              ))}
            </div>
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
              multiple
            />
          </label>
          <button className="btn btn-link text-secondary action-button" disabled={isLoading}>
            <img src="/img/icons/post-feeling.png" alt="Feeling" className="action-icon me-1" />
            Feeling/Activity
          </button>
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <div className="privacy-selector">
            <select
              className="form-select form-select-sm"
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value)}
              disabled={isLoading}
              aria-label="Chọn quyền riêng tư"
            >
              <option value="PUBLIC">Công khai</option>
              <option value="PRIVATE">Riêng tư</option>
            </select>
          </div>

          <div className="d-flex gap-2">
            {(content.trim() || media.length > 0) && (
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Hủy
              </button>
            )}
            <button
              className="btn btn-primary post-button"
              onClick={handleSubmit}
              disabled={isLoading || (!content.trim() && media.length === 0)}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  Đang đăng...
                </>
              ) : 'Đăng'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PostForm;
