import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { API_ENDPOINTS } from '../../config/config';

const SharePostModal = ({ show, onHide, post, onShareSuccess }) => {
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
                throw new Error('Failed to share post');
            }

            const newPost = await response.json();
            // Thêm log để kiểm tra response
            console.log('Share post response:', newPost);
            
            // Đảm bảo các trường cần thiết được set
            const enrichedPost = {
                ...newPost,
                isShared: true,
                originalPost: post
            };
            
            onShareSuccess(enrichedPost);
            onHide();
            setShareContent('');
        } catch (error) {
            console.error('Error sharing post:', error);
            alert('Failed to share post. Please try again.');
        }
    };

    // Nếu không có post, không render modal
    if (!post) return null;

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Share Post</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form.Group className="mb-3">
                    <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="Write something about this post..."
                        value={shareContent}
                        onChange={(e) => setShareContent(e.target.value)}
                    />
                </Form.Group>

                <div className="shared-post-preview border rounded p-3 bg-light">
                    <div className="d-flex align-items-center mb-2">
                        <img
                            src={post.user?.avatar 
                                ? `${API_ENDPOINTS.BASE_URL}${post.user.avatar}` 
                                : '/default-avatar.png'}
                            alt={post.user?.firstName || 'User'}
                            className="rounded-circle me-2"
                            style={{ width: '32px', height: '32px' }}
                        />
                        <div>
                            <strong>
                                {post.user 
                                    ? `${post.user.firstName || ''} ${post.user.lastName || ''}`
                                    : 'Unknown User'}
                            </strong>
                            <div className="text-muted small">
                                {post.createdAt ? new Date(post.createdAt).toLocaleString() : ''}
                            </div>
                        </div>
                    </div>
                    
                    <p>{post.content}</p>
                    
                    {post.images?.length > 0 && (
                        <div className="mb-3">
                            {post.images.map((image, index) => (
                                <img
                                    key={index}
                                    src={`${API_ENDPOINTS.BASE_URL}${image}`}
                                    alt="Post content"
                                    className="img-fluid rounded mb-2"
                                    style={{ maxHeight: '150px' }}
                                />
                            ))}
                        </div>
                    )}
                    
                    {post.videos?.length > 0 && (
                        <div className="mb-3">
                            {post.videos.map((video, index) => (
                                <video
                                    key={index}
                                    src={`${API_ENDPOINTS.BASE_URL}${video}`}
                                    controls
                                    className="img-fluid rounded mb-2"
                                    style={{ maxHeight: '150px' }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleShare}>
                    Share Post
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default SharePostModal;



