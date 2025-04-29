import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api';
import { useUser } from '../../contexts/UserContext';
import { useToast } from '../../context/ToastContext';
import { webSocketService } from '../../services/websocket';
import LeftSidebar from '../../components/LeftSidebar';
import RightSidebar from '../../components/RightSidebar';
import SharePostModal from '../../components/Post/SharePostModal';
import PostOptionsMenu from '../../components/Post/PostOptionsMenu';
import ImageViewerModal from '../../components/Post/ImageViewerModal';
import './PostDetail.css';

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const { showSuccess, showError } = useToast();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [commentInput, setCommentInput] = useState('');
  const [replyInputs, setReplyInputs] = useState({});
  const [showShareModal, setShowShareModal] = useState(false);
  const [isLoading, setIsLoading] = useState({});
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Fetch post data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        if (!postId) {
          setError('Post ID is missing');
          setLoading(false);
          return;
        }

        if (!currentUser?.id) {
          console.log('Current user not loaded yet');
          return; // Don't fetch post if user is not loaded yet
        }

        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/posts/${postId}?viewerId=${currentUser.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('userToken')}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setPost(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching post:', error);
        if (error.message.includes('403')) {
          setError('403 Forbidden: You do not have permission to view this post.');
        } else if (error.message.includes('404')) {
          setError('404 Not Found: The post you are looking for does not exist.');
        } else {
          setError('Failed to load post. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, currentUser?.id]); // Add currentUser.id as dependency

  // Fetch user profile
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
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Nếu token hết hạn, chuyển về trang login
        if (error.message.includes('401')) {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    };

    fetchUserProfile();
  }, [currentUser?.id]);

  // WebSocket subscription
  useEffect(() => {
    if (postId && currentUser?.id) {
      // Subscribe to post updates
      webSocketService.subscribeToPost(postId, (updatedPost) => {
        setPost(updatedPost);
      });

      return () => {
        // Unsubscribe when component unmounts
        webSocketService.unsubscribeFromPost(postId);
      };
    }
  }, [postId, currentUser?.id]);

  const getFullImageUrl = useCallback((path) => {
    if (!path) return '/default-imgs/avatar.png';
    if (path.startsWith('http') || path.startsWith('blob')) return path;
    return `${API_ENDPOINTS.BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  }, []);

  const handleAvatarClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handleLike = async () => {
    try {
      await fetch(`${API_ENDPOINTS.BASE_URL}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body: JSON.stringify({
          userId: currentUser.id
        })
      });
      // WebSocket will update the post
    } catch (error) {
      console.error('Error liking post:', error);
      showError('Failed to like post. Please try again.');
    }
  };

  const handleComment = async (content, parentId = null) => {
    if (!content?.trim() || isLoading[`comment_${parentId || 'new'}`]) return;

    setIsLoading(prev => ({ ...prev, [`comment_${parentId || 'new'}`]: true }));

    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body: JSON.stringify({
          content,
          userId: currentUser.id,
          parentId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      // Reset input
      if (parentId) {
        setReplyInputs(prev => ({ ...prev, [parentId]: '' }));
      } else {
        setCommentInput('');
      }

      // WebSocket will update the post
    } catch (error) {
      console.error('Error adding comment:', error);
      showError('Failed to add comment. Please try again.');
    } finally {
      setIsLoading(prev => ({ ...prev, [`comment_${parentId || 'new'}`]: false }));
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/posts/${postId}/comments/${commentId}?userId=${currentUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }

      // WebSocket will update the post
    } catch (error) {
      console.error('Error deleting comment:', error);
      showError('Failed to delete comment. Please try again.');
    }
  };

  const handleShareClick = () => {
    setShowShareModal(true);
  };

  const handleDeletePost = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/posts/${postId}?userId=${currentUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      showSuccess('Post deleted successfully');
      navigate('/'); // Redirect to home page
    } catch (error) {
      console.error('Error deleting post:', error);
      showError('Failed to delete post. Please try again.');
    }
  };

  const handleEditPost = async (content, privacy) => {
    // Cho phép nội dung trống

    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body: JSON.stringify({
          content: content || '', // Đảm bảo content không null
          userId: currentUser.id,
          privacy
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update post');
      }

      showSuccess('Post updated successfully');
      // WebSocket will update the post
      return true;
    } catch (error) {
      console.error('Error updating post:', error);
      showError('Failed to update post. Please try again.');
      return false;
    }
  };

  const handleEditPostWithMedia = async (content, privacy, media, keepImages, keepVideos) => {
    // Kiểm tra xem có ít nhất một hình ảnh/video không
    if (!content.trim() && (!media || media.length === 0) && (!keepImages || keepImages.length === 0) && (!keepVideos || keepVideos.length === 0)) {
      showError('Bài viết phải có nội dung hoặc ít nhất một hình ảnh/video');
      return false;
    }

    try {
      const formData = new FormData();
      formData.append('content', content || ''); // Đảm bảo content không null
      formData.append('userId', currentUser.id);
      formData.append('privacy', privacy);

      // Add images to keep
      if (keepImages && keepImages.length > 0) {
        keepImages.forEach(image => {
          formData.append('keepImages', image);
        });
      }

      // Add videos to keep
      if (keepVideos && keepVideos.length > 0) {
        keepVideos.forEach(video => {
          formData.append('keepVideos', video);
        });
      }

      // Add new media
      if (media && media.length > 0) {
        media.forEach(file => {
          if (file.type.includes('image')) {
            formData.append('images', file);
          } else if (file.type.includes('video')) {
            formData.append('videos', file);
          }
        });
      }

      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/posts/${postId}/update-with-media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to update post');
      }

      showSuccess('Post updated successfully');
      // WebSocket will update the post
      return true;
    } catch (error) {
      console.error('Error updating post:', error);
      showError('Failed to update post. Please try again.');
      return false;
    }
  };

  // Comment component
  const Comment = ({ comment, postId, depth = 0 }) => {
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [showReplies, setShowReplies] = useState(false);
    const MAX_DEPTH = 2;
    const isCommentOwner = currentUser?.id === comment.userId;

    const handleReplyClick = () => {
      setShowReplyInput(!showReplyInput);
    };

    const handleToggleReplies = () => {
      setShowReplies(!showReplies);
    };

    const marginLeft = depth < MAX_DEPTH ? `${depth * 32}px` : `${MAX_DEPTH * 32}px`;

    return (
      <div className="comment-thread" style={{ marginLeft }}>
        <div className="comment-main d-flex gap-2 mb-2">
          <img
            src={getFullImageUrl(comment.user?.avatar)}
            alt="Người dùng"
            className="rounded-circle"
            style={{ width: '32px', height: '32px', objectFit: 'cover', cursor: 'pointer' }}
            onClick={() => handleAvatarClick(comment.user?.id)}
          />
          <div className="flex-grow-1">
            <div className="bg-light p-2 rounded comment-text">
              <div
                className="fw-bold"
                style={{ cursor: 'pointer' }}
                onClick={() => handleAvatarClick(comment.user?.id)}
              >
                {comment.user ? `${comment.user.firstName} ${comment.user.lastName}` : 'Người dùng không xác định'}
              </div>
              {comment.content}
            </div>
            <div className="d-flex gap-2 mt-1">
              <button className="btn btn-link btn-sm p-0 text-secondary" onClick={handleReplyClick}>
                Phản hồi
              </button>
              {isCommentOwner && (
                <button
                  className="btn btn-link btn-sm p-0 text-danger"
                  onClick={() => handleDeleteComment(comment.id)}
                >
                  Xóa
                </button>
              )}
              <small className="text-secondary">
                {new Date(comment.createdAt).toLocaleString()}
              </small>
            </div>
          </div>
        </div>

        {showReplyInput && (
          <div className="reply-input d-flex gap-2 mb-2" style={{ marginLeft: '32px' }}>
            <img
              src={getFullImageUrl(userProfile?.avatar)}
              alt="Người dùng hiện tại"
              className="rounded-circle"
              style={{ width: '32px', height: '32px', objectFit: 'cover' }}
            />
            <div className="flex-grow-1">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Viết phản hồi..."
                  value={replyInputs[comment.id] || ''}
                  onChange={(e) => setReplyInputs({ ...replyInputs, [comment.id]: e.target.value })}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleComment(replyInputs[comment.id], comment.id);
                    }
                  }}
                />
                <button
                  className="btn btn-primary"
                  onClick={() => handleComment(replyInputs[comment.id], comment.id)}
                  disabled={isLoading[`comment_${comment.id}`]}
                >
                  {isLoading[`comment_${comment.id}`] ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : (
                    'Phản hồi'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <>
            <button
              className="btn btn-link btn-sm text-secondary ms-4 mb-2"
              onClick={handleToggleReplies}
            >
              {showReplies ? 'Ẩn phản hồi' : `Xem ${comment.replies.length} phản hồi`}
            </button>

            {showReplies && (
              <div className="replies-container">
                {comment.replies.map((reply, index) => (
                  <Comment
                    key={reply.id || index}
                    comment={reply}
                    postId={postId}
                    depth={depth + 1}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  if (loading || !currentUser) {
    return (
      <div className="container-fluid">
        <div className="row" style={{ paddingTop: '60px' }}>
          <LeftSidebar />
          <div className="col-6 offset-3 d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
          </div>
          <RightSidebar />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container-fluid">
        <div className="row" style={{ paddingTop: '60px' }}>
          <LeftSidebar />
          <div className="col-6 offset-3">
            <div className="card">
              <div className="card-body">
                <div className="alert alert-danger">
                  {error || 'Không tìm thấy bài viết'}
                </div>
                <p className="text-muted">
                  {error && error.includes('403')
                    ? 'Bạn không có quyền xem bài viết này. Đây có thể là bài viết riêng tư của người dùng khác.'
                    : 'Bài viết bạn đang tìm kiếm có thể đã bị xóa hoặc tạm thời không khả dụng.'}
                </p>
                <button className="btn btn-primary" onClick={() => navigate('/')}>
                  Quay lại trang chủ
                </button>
              </div>
            </div>
          </div>
          <RightSidebar />
        </div>
      </div>
    );
  }

  const isPostOwner = currentUser?.id === post.userId;
  const isSharedPost = post.isShared || post.shared;

  return (
    <div className="container-fluid">
      <div className="row" style={{ paddingTop: '60px' }}>
        <LeftSidebar />
        <div className="col-6 offset-3">
          <div className="post-detail-container">
            <div className="card">
              <div className="card-body">
                {/* Post Header */}
                <div className="d-flex align-items-center gap-2 mb-3">
                  <img
                    src={getFullImageUrl(post.user?.avatar)}
                    alt="User"
                    className="rounded-circle"
                    style={{ width: '40px', height: '40px', objectFit: 'cover', cursor: 'pointer' }}
                    onClick={() => handleAvatarClick(post.user?.id)}
                  />
                  <div className="flex-grow-1">
                    <div
                      className="fw-bold"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleAvatarClick(post.user?.id)}
                    >
                      {post.user ? `${post.user.firstName} ${post.user.lastName}` : 'Unknown User'}
                    </div>
                    <div className="d-flex align-items-center">
                      <small className="text-secondary me-2">
                        {new Date(post.createdAt).toLocaleString()}
                      </small>
                      <small className="text-secondary d-flex align-items-center">
                        <i className={`bi ${post.privacy === 'PUBLIC' ? 'bi-globe' : 'bi-lock-fill'} me-1`}></i>
                        <span>{post.privacy === 'PUBLIC' ? 'Công khai' : 'Riêng tư'}</span>
                      </small>
                    </div>
                  </div>
                  {isPostOwner && (
                    <PostOptionsMenu
                      post={post}
                      onDelete={handleDeletePost}
                      onEdit={(content, privacy) => handleEditPost(content, privacy)}
                      onEditWithMedia={(content, privacy, media, keepImages, keepVideos) =>
                        handleEditPostWithMedia(content, privacy, media, keepImages, keepVideos)
                      }
                    />
                  )}
                </div>

                {/* Post Content */}
                <div className="post-content mb-3">
                  {isSharedPost ? (
                    <div className="shared-post p-3">
                      <div className="shared-comment mb-3">
                        <p>{post.content}</p>
                      </div>
                      {post.originalPost ? (
                        <div className="original-post">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <img
                              src={getFullImageUrl(post.originalPost.user?.avatar)}
                              alt="Original author"
                              className="rounded-circle"
                              style={{ width: '32px', height: '32px', objectFit: 'cover', cursor: 'pointer' }}
                              onClick={() => handleAvatarClick(post.originalPost.user?.id)}
                            />
                            <div>
                              <div
                                className="fw-bold"
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleAvatarClick(post.originalPost.user?.id)}
                              >
                                {post.originalPost.user ? `${post.originalPost.user.firstName} ${post.originalPost.user.lastName}` : 'Unknown User'}
                              </div>
                              <div className="d-flex align-items-center">
                                <small className="text-secondary me-2">
                                  {new Date(post.originalPost.createdAt).toLocaleString()}
                                </small>
                                <small className="text-secondary d-flex align-items-center">
                                  <i className={`bi ${post.originalPost.privacy === 'PUBLIC' ? 'bi-globe' : 'bi-lock-fill'} me-1`}></i>
                                  <span>{post.originalPost.privacy === 'PUBLIC' ? 'Công khai' : 'Riêng tư'}</span>
                                </small>
                              </div>
                            </div>
                          </div>

                          <div className="original-post-content">
                            <p>{post.originalPost.content}</p>

                            {post.originalPost.images?.length > 0 && (
                              <div className="media-grid mb-3" data-count={post.originalPost.images.length}>
                                {post.originalPost.images.map((image, index) => (
                                  <div
                                    key={index}
                                    className="media-item"
                                    onClick={() => {
                                      setSelectedImageIndex(index);
                                      setShowImageViewer(true);
                                    }}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    <img
                                      src={getFullImageUrl(image)}
                                      alt="Post content"
                                      className="img-fluid rounded"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}

                            {post.originalPost.videos?.length > 0 && (
                              <div className="media-grid mb-3" data-count={post.originalPost.videos.length}>
                                {post.originalPost.videos.map((video, index) => (
                                  <div key={index} className="media-item">
                                    <video
                                      src={getFullImageUrl(video)}
                                      controls
                                      className="img-fluid rounded"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="alert alert-warning">
                          Original post no longer exists
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <p>{post.content}</p>
                      {post.images?.length > 0 && (
                        <div className="media-grid mb-3" data-count={post.images.length}>
                          {post.images.map((image, index) => (
                            <div
                              key={index}
                              className="media-item"
                              onClick={() => {
                                setSelectedImageIndex(index);
                                setShowImageViewer(true);
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                              <img
                                src={getFullImageUrl(image)}
                                alt="Post content"
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
                                src={getFullImageUrl(video)}
                                controls
                                className="img-fluid rounded"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Post Stats */}
                <div className="post-stats d-flex justify-content-between mb-3">
                  <div>
                    {post.likes?.length > 0 && (
                      <div className="likes-count">
                        <i className="bi bi-hand-thumbs-up-fill text-primary me-1"></i>
                        <span>{post.likes.length} lượt thích</span>
                      </div>
                    )}
                  </div>
                  <div>
                    {post.comments?.length > 0 && (
                      <div className="comments-count">
                        <span>{post.comments.length} bình luận</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Post Actions */}
                <div className="post-actions d-flex gap-3 mb-3 border-top border-bottom py-2">
                  <button
                    className={`btn btn-link like-button flex-grow-1 ${post.likes?.includes(currentUser.id) ? 'text-primary' : 'text-secondary'}`}
                    onClick={handleLike}
                  >
                    <img
                      src={post.likes?.includes(currentUser.id) ? "/img/icons/liked.png" : "/img/icons/like.png"}
                      alt="Thích"
                      className="action-icon me-1"
                    />
                    <span>Thích</span>
                  </button>
                  <button className="btn btn-link text-secondary flex-grow-1">
                    <img
                      src="/img/icons/comment.png"
                      alt="Bình luận"
                      className="action-icon me-1"
                    />
                    <span>Bình luận</span>
                  </button>
                  <button
                    className="btn btn-link text-secondary flex-grow-1"
                    onClick={handleShareClick}
                  >
                    <img
                      src="/img/icons/share.png"
                      alt="Chia sẻ"
                      className="action-icon me-1"
                    />
                    <span>Chia sẻ</span>
                  </button>
                </div>

                {/* Comments Section */}
                <div className="comments-section">
                  {/* Add Comment Input */}
                  <div className="d-flex gap-2 align-items-center mb-4">
                    <img
                      src={getFullImageUrl(userProfile?.avatar)}
                      alt="Người dùng hiện tại"
                      className="rounded-circle"
                      style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                    />
                    <div className="flex-grow-1">
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Viết bình luận..."
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleComment(commentInput);
                            }
                          }}
                        />
                        <button
                          className="btn btn-primary"
                          onClick={() => handleComment(commentInput)}
                          disabled={isLoading.comment_new}
                        >
                          {isLoading.comment_new ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          ) : (
                            'Bình luận'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Comments List */}
                  <div className="comments-list">
                    {post.comments?.map((comment, index) => (
                      !comment.parentId && (
                        <Comment
                          key={comment.id || index}
                          comment={comment}
                          postId={post.id}
                        />
                      )
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <RightSidebar />
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <SharePostModal
          show={showShareModal}
          onHide={() => setShowShareModal(false)}
          post={post}
          currentUser={currentUser}
        />
      )}

      {/* Image Viewer Modal */}
      {showImageViewer && post && (
        <ImageViewerModal
          show={showImageViewer}
          onHide={() => setShowImageViewer(false)}
          images={post.isShared && post.originalPost ? post.originalPost.images : post.images}
          initialIndex={selectedImageIndex}
          getFullImageUrl={getFullImageUrl}
        />
      )}
    </div>
  );
};

export default PostDetail;
