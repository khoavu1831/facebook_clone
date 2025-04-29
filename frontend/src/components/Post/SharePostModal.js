import React, { useState, memo } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { API_ENDPOINTS } from '../../config/api';

const SharePostModal = memo(({ show, onHide, post, onShareSuccess }) => {
  const [shareContent, setShareContent] = useState('');
  const userData = JSON.parse(localStorage.getItem('userData'));

  const handleShare = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/posts/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body: JSON.stringify({
          userId: userData.id,
          originalPostId: post?.id,
          content: shareContent
        })
      });

      if (!response.ok) {
        throw new Error('Không thể chia sẻ bài đăng');
      }

      const newPost = await response.json();
      console.log('Phản hồi chia sẻ bài đăng:', newPost);

      const enrichedPost = {
        ...newPost,
        isShared: true,
        originalPost: post
      };

      onShareSuccess(enrichedPost);
      onHide();
      setShareContent('');
    } catch (error) {
      console.error('Lỗi khi chia sẻ bài đăng:', error);
      alert('Không thể chia sẻ bài đăng. Vui lòng thử lại.');
    }
  };

  if (!post) return null;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Chia sẻ bài đăng</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Viết gì đó về bài đăng này..."
            value={shareContent}
            onChange={(e) => setShareContent(e.target.value)}
          />
        </Form.Group>

        <div className="shared-post-preview border rounded p-3 bg-light">
          <div className="d-flex align-items-center mb-2">
            <img
              src={post.user?.avatar 
                ? `${API_ENDPOINTS.BASE_URL}${post.user.avatar}` 
                : '/default-imgs/avatar.png'}
              alt={post.user?.firstName || 'Người dùng'}
              className="rounded-circle me-2"
              style={{ width: '32px', height: '32px' }}
            />
            <div>
              <strong>
                {post.user 
                  ? `${post.user.firstName || ''} ${post.user.lastName || ''}`
                  : 'Người dùng không xác định'}
              </strong>
              <div className="text-muted small">
                {post.createdAt ? new Date(post.createdAt).toLocaleString() : ''}
              </div>
            </div>
          </div>
          
          <p>{post.content}</p>
          
          {post.images?.length > 0 && (
            <div className="media-grid mb-3" data-count={post.images.length}>
              {post.images.map((image, index) => (
                <div key={index} className="media-item">
                  <img
                    src={`${API_ENDPOINTS.BASE_URL}${image}`}
                    alt="Nội dung bài đăng"
                    className="img-fluid rounded"
                  />
                </div>
              ))}
            </div>
          )}
          
          {post.videos?.length > 0 && (
            <div className="media-grid mb-3" data-count={post.videos.length}>
              {post.videos.map((video, index) => (
                <div key={index} className="media-item">
                  <video
                    src={`${API_ENDPOINTS.BASE_URL}${video}`}
                    controls
                    className="img-fluid rounded"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Hủy
        </Button>
        <Button variant="primary" onClick={handleShare}>
          Chia sẻ bài đăng
        </Button>
      </Modal.Footer>
    </Modal>
  );
});

export default SharePostModal;
