import React, { useState, useEffect, memo, useRef, useCallback } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import './PostList.css';
import SharePostModal from './SharePostModal';
import { webSocketService } from '../../services/websocket';
import { useToast } from '../../context/ToastContext';
import PostOptionsMenu from './PostOptionsMenu';
import { useNavigate } from 'react-router-dom';

// Component PostContent được memo để tránh render lại không cần thiết
const PostContent = memo(({ post }) => {
  const isSharedPost = post.isShared || post.shared;

  const getFullImageUrl = (path) => {
    if (!path) return '/default-imgs/avatar.png';
    if (path.startsWith('http') || path.startsWith('blob')) return path;
    return `${API_ENDPOINTS.BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const getFullMediaUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('blob')) return path;
    return `${API_ENDPOINTS.BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  return (
    <div className="post-content">
      {isSharedPost && (
        <div className="shared-comment mb-3">
          <p>{post.content}</p>
        </div>
      )}

      {isSharedPost && post.originalPost ? (
        <div className="shared-post border rounded p-3">
          <div className="d-flex align-items-center mb-2">
            <img
              src={getFullImageUrl(post.originalPost.user?.avatar)}
              alt={post.originalPost.user?.firstName || 'User'}
              className="rounded-circle me-2"
              style={{ width: '32px', height: '32px', objectFit: 'cover' }}
            />
            <div>
              <div className="fw-bold">
                {post.originalPost.user
                  ? `${post.originalPost.user.firstName || ''} ${post.originalPost.user.lastName || ''}`
                  : 'Người dùng không xác định'}
              </div>
              <div className="text-muted small">
                {post.originalPost.createdAt
                  ? new Date(post.originalPost.createdAt).toLocaleString()
                  : ''}
              </div>
            </div>
          </div>

          <div className="original-post-content">
            <p>{post.originalPost.content}</p>

            {post.originalPost.images?.length > 0 && (
              <div className="media-grid mb-3">
                {post.originalPost.images.map((image, index) => (
                  <img
                    key={index}
                    src={getFullMediaUrl(image)}
                    alt="Nội dung bài đăng"
                    className="img-fluid rounded mb-2"
                    style={{ maxHeight: '300px', objectFit: 'cover' }}
                  />
                ))}
              </div>
            )}

            {post.originalPost.videos?.length > 0 && (
              <div className="media-grid mb-3">
                {post.originalPost.videos.map((video, index) => (
                  <video
                    key={index}
                    src={getFullMediaUrl(video)}
                    controls
                    className="img-fluid rounded mb-2"
                    style={{ maxHeight: '300px' }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : !isSharedPost ? (
        <>
          <p>{post.content}</p>
          {post.images?.length > 0 && (
            <div className="media-grid mb-3">
              {post.images.map((image, index) => (
                <img
                  key={index}
                  src={getFullMediaUrl(image)}
                  alt="Nội dung bài đăng"
                  className="img-fluid rounded mb-2"
                  style={{ maxHeight: '300px', objectFit: 'cover' }}
                />
              ))}
            </div>
          )}
          {post.videos?.length > 0 && (
            <div className="media-grid mb-3">
              {post.videos.map((video, index) => (
                <video
                  key={index}
                  src={getFullMediaUrl(video)}
                  controls
                  className="img-fluid rounded mb-2"
                  style={{ maxHeight: '300px' }}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="alert alert-warning">
          Bài đăng gốc không còn tồn tại
        </div>
      )}
    </div>
  );
});

const Comment = ({ comment, postId, onReply, onDelete, currentUser, userProfile, getFullImageUrl, depth = 0 }) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false);

  const MAX_REPLY_DEPTH = 4; // Giới hạn độ sâu tối đa (0,1,2,3 = 4 tầng)

  // Kiểm tra xem có thể reply tiếp không
  const canReply = depth < MAX_REPLY_DEPTH;

  // Kiểm tra xem người dùng hiện tại có phải là chủ sở hữu bình luận không
  const isCommentOwner = currentUser?.id === comment.userId;

  if (!currentUser) {
    return null;
  }

  const MAX_VISIBLE_REPLIES = 0; // Mặc định không hiển thị phản hồi con
  const MAX_DEPTH = 4; // Giới hạn độ sâu của nested replies để tránh quá nhiều indent

  const handleReply = async () => {
    if (!replyContent.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await onReply(postId, replyContent, comment.id);
      setReplyContent('');
      setShowReplyInput(false);
    } catch (error) {
      // Không cần hiển thị alert ở đây nữa vì đã được xử lý ở handleComment
      console.error('Error in handleReply:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const displayedReplies = showAllReplies
    ? comment.replies
    : comment.replies?.slice(0, MAX_VISIBLE_REPLIES);

  // Luôn hiển thị nút "Xem thêm phản hồi" nếu có phản hồi con
  const hasMoreReplies = comment.replies?.length > 0;
  const marginLeft = depth < MAX_DEPTH ? `${depth * 32}px` : `${MAX_DEPTH * 32}px`;

  return (
    <div className="comment-thread" style={{ marginLeft }}>
      <div className="comment-main d-flex gap-2 mb-2">
        <img
          src={getFullImageUrl(comment.user?.avatar)}
          alt="User"
          className="rounded-circle"
          style={{ width: '32px', height: '32px', objectFit: 'cover' }}
        />
        <div className="flex-grow-1">
          <div className="bg-light p-2 rounded comment-text">
            <div className="fw-bold">
              {comment.user ? `${comment.user.firstName} ${comment.user.lastName}` : 'Unknown User'}
            </div>
            {comment.content}
          </div>

          <div className="comment-actions mt-1 d-flex align-items-center">
            <button
              className="btn btn-link btn-sm p-0 text-muted me-2"
              onClick={() => setShowReplyInput(!showReplyInput)}
            >
              Phản hồi
            </button>
            {isCommentOwner && (
              <button
                className="btn btn-link btn-sm p-0 text-danger me-2"
                onClick={() => onDelete(postId, comment.id)}
              >
                <i className="bi bi-trash-fill"></i> Xóa
              </button>
            )}
            <small className="text-muted ms-auto">
              {new Date(comment.createdAt).toLocaleString()}
            </small>
          </div>

          {showReplyInput && (
            <div className="reply-input-container d-flex gap-2 mt-2">
              <img
                src={userProfile?.avatar ? getFullImageUrl(userProfile.avatar) : '/default-imgs/avatar.png'}
                alt="Current user"
                className="rounded-circle"
                style={{ width: '28px', height: '28px', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.src = '/default-imgs/avatar.png';  // Fallback khi load ảnh lỗi
                }}
              />
              <div className="flex-grow-1">
                <div className="position-relative">
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-pill"
                    placeholder={`Phản hồi ${comment.user?.firstName}...`}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                        e.preventDefault();
                        handleReply();
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hiển thị replies */}
      {comment.replies && comment.replies.length > 0 && (
        <>
          {!showAllReplies && (
            <div className="view-replies-wrapper">
              <button
                className="btn btn-link btn-sm text-primary mb-2 view-replies-btn"
                onClick={() => setShowAllReplies(true)}
              >
                <span className="view-replies-icon"><i className="bi bi-arrow-return-right"></i></span>
                <span className="view-replies-text">Xem {comment.replies.length} phản hồi</span>
              </button>
            </div>
          )}

          {showAllReplies && (
            <div className="replies-container">
              {displayedReplies?.map((reply, index) => (
                <Comment
                  key={reply.id || index}
                  comment={reply}
                  postId={postId}
                  onReply={onReply}
                  onDelete={onDelete}
                  currentUser={currentUser}
                  userProfile={userProfile}
                  getFullImageUrl={getFullImageUrl}
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

// Component PostItem để render từng bài đăng, được memo
const PostItem = memo(({ post, currentUser, userProfile, handleLike, handleComment, handleShareClick, handleDeletePost, handleEditPost, handleDeleteComment, commentInputs, setCommentInputs, isLoading }) => {
  const navigate = useNavigate();
  const getFullImageUrl = useCallback((path) => {
    if (!path) return '/default-imgs/avatar.png';
    if (path.startsWith('http') || path.startsWith('blob')) return path;
    return `${API_ENDPOINTS.BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  }, []);

  const handleAvatarClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  // Kiểm tra xem người dùng hiện tại có phải là chủ sở hữu bài viết không
  const isPostOwner = currentUser?.id === post.userId;

  // State cho chế độ chỉnh sửa
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editPrivacy, setEditPrivacy] = useState(post.privacy || 'PUBLIC');

  if (!currentUser) {
    return null;
  }

  return (
    <div id={`post-${post.id}`} key={post.id} className="card mb-3">
      <div className="card-body">
        <div className="d-flex align-items-center gap-2 mb-3">
          <img
            src={getFullImageUrl(post.user?.avatar)}
            alt="Người dùng"
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
              {post.user ? `${post.user.firstName} ${post.user.lastName}` : 'Người dùng không xác định'}
            </div>
            <small className="text-secondary">
              {new Date(post.createdAt).toLocaleString()}
            </small>
          </div>

          {isPostOwner && (
            <div className="post-options">
              <PostOptionsMenu
                postId={post.id}
                onEdit={() => setIsEditing(true)}
                onDelete={() => handleDeletePost(post.id)}
              />
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="edit-post-container mb-3">
            <textarea
              className="form-control mb-2"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows="3"
            ></textarea>

            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="privacy-selector">
                <select
                  className="form-select form-select-sm"
                  value={editPrivacy}
                  onChange={(e) => setEditPrivacy(e.target.value)}
                  aria-label="Chọn quyền riêng tư"
                >
                  <option value="PUBLIC">Công khai</option>
                  <option value="PRIVATE">Riêng tư</option>
                </select>
              </div>

              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(post.content);
                    setEditPrivacy(post.privacy || 'PUBLIC');
                  }}
                >
                  Hủy
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    handleEditPost(post.id, editContent, editPrivacy);
                    setIsEditing(false);
                  }}
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <PostContent post={post} />
            {post.privacy === 'PRIVATE' && (
              <div className="privacy-indicator mt-1">
                <small className="text-muted">
                  <i className="bi bi-lock-fill me-1"></i> Riêng tư
                </small>
              </div>
            )}
          </div>
        )}

        <div className="d-flex gap-3 mb-3">
          <button
            className={`btn btn-link like-button ${post.likes?.includes(currentUser.id) ? 'text-primary' : 'text-secondary'}`}
            onClick={() => handleLike(post.id)}
          >
            <img
              src={post.likes?.includes(currentUser.id) ? "/img/icons/liked.png" : "/img/icons/like.png"}
              alt="Thích"
              className="action-icon"
            />
            <span>{post.likes?.length || 0} Thích</span>
          </button>
          <button className="btn btn-link text-secondary">
            <img
              src="/img/icons/comment.png"
              alt="Bình luận"
              className="action-icon"
            />
            <span>{post.comments?.length || 0} Bình luận</span>
          </button>
          <button
            className="btn btn-link text-secondary"
            onClick={() => handleShareClick(post)}
          >
            <img
              src="/img/icons/share.png"
              alt="Chia sẻ"
              className="action-icon"
            />
            <span>Chia sẻ</span>
          </button>
        </div>

        <div className="comments-section">
          {post.comments?.map((comment, index) => (
            !comment.parentId && (
              <Comment
                key={comment.id || index}
                comment={comment}
                postId={post.id}
                onReply={handleComment}
                onDelete={handleDeleteComment}
                currentUser={currentUser}
                userProfile={userProfile}
                getFullImageUrl={getFullImageUrl}
              />
            )
          ))}

          {/* Input để thêm comment mới */}
          <div className="d-flex gap-2 align-items-center mt-3">
            <img
              src={userProfile?.avatar ? getFullImageUrl(userProfile.avatar) : '/default-imgs/avatar.png'}
              alt="Current user"
              className="rounded-circle"
              style={{ width: '30px', height: '30px', objectFit: 'cover' }}
              onError={(e) => {
                e.target.src = '/default-imgs/avatar.png';
              }}
            />
            <div className="flex-grow-1 position-relative">
              <div className="d-flex align-items-center">
                <input
                  type="text"
                  className="form-control rounded-pill comment-input"
                  placeholder="Viết bình luận..."
                  value={commentInputs[post.id] || ''}
                  onChange={(e) => setCommentInputs(prev => ({
                    ...prev,
                    [post.id]: e.target.value
                  }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isLoading[post.id]) {
                      handleComment(post.id, e.target.value);
                    }
                  }}
                />
                <button
                  className="btn btn-link text-primary ms-2"
                  onClick={() => !isLoading[post.id] && handleComment(post.id, commentInputs[post.id])}
                  disabled={isLoading[post.id] || !commentInputs[post.id]?.trim()}
                >
                  <i className="bi bi-send-fill"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const PostList = ({ posts: initialPosts, currentUser }) => {
  const [posts, setPosts] = useState(initialPosts || []);
  const [commentInputs, setCommentInputs] = useState({});
  const [isLoading, setIsLoading] = useState({});
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const listRef = useRef(null);
  const subscribedPosts = useRef(new Set());
  const [isLoggedIn, setIsLoggedIn] = useState(!!currentUser);
  const { showSuccess, showError } = useToast();

  // Sort posts by createdAt in descending order (newest first)
  useEffect(() => {
    if (Array.isArray(initialPosts)) {
      const sortedPosts = [...initialPosts].sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA;
      });
      setPosts(sortedPosts.filter(post => post && post.id));
    }
  }, [initialPosts]);

  // Sort posts when receiving WebSocket updates
  const handleWebSocketUpdate = useCallback((updatedPost) => {
    setPosts(prevPosts => {
      const newPosts = prevPosts.map(post => 
        post.id === updatedPost.id ? updatedPost : post
      );
      return newPosts.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA;
      });
    });
  }, []);

  // Handle post highlighting when postId is in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('postId');
    
    if (postId) {
      // Check if we're coming from a notification click
      const isFromNotification = document.referrer.includes('/notifications') || 
                               document.referrer.includes('/friends') ||
                               document.referrer.includes('/profile');
      
      if (isFromNotification) {
        // Wait for posts to be loaded
      const checkAndHighlightPost = () => {
          const postElement = document.getElementById(`post-${postId}`);
        if (postElement) {
          postElement.scrollIntoView({ behavior: 'smooth' });
          postElement.classList.add('highlight-post');
          setTimeout(() => {
            postElement.classList.remove('highlight-post');
          }, 2000);
        } else {
            // If post not found yet, try again after a short delay
          setTimeout(checkAndHighlightPost, 100);
        }
      };
      
      checkAndHighlightPost();
    }
    }
  }, [posts]); // Re-run when posts change

  // Fetch user profile to get avatar
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (!currentUser?.id) return;

        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/profile/${currentUser.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('userToken')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUserProfile(data);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [currentUser?.id]);

  const handleShareSuccess = (newPost) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  const handleLike = async (postId) => {
    try {
      await fetch(`${API_ENDPOINTS.POSTS}/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body: JSON.stringify({
          userId: JSON.parse(localStorage.getItem('userData')).id
        })
      });
      // Không cần setPosts vì sẽ nhận update qua WebSocket
    } catch (error) {
      console.error('Lỗi khi thích bài đăng:', error);
      alert('Không thể thích bài đăng. Vui lòng thử lại.');
    }
  };

  const handleComment = async (postId, content, parentId = null) => {
    if (!content?.trim() || isLoading[postId]) return;

    setIsLoading(prev => ({ ...prev, [postId]: true }));
    try {
      const response = await fetch(`${API_ENDPOINTS.POSTS}/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body: JSON.stringify({
          content: content,
          parentId: parentId,
          userId: currentUser.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Kiểm tra message từ backend
        if (data === "Maximum reply depth reached") {
          throw new Error("Maximum reply depth reached");
        }
        throw new Error(data || 'Lỗi kết nối mạng');
      }

      // Không cần thêm comment vào UI ngay lập tức vì sẽ nhận update qua WebSocket
      // Chỉ cần xóa nội dung input
      if (!parentId) {
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      }
    } catch (error) {
      console.error('Lỗi khi bình luận:', error);
      if (error.message === "Maximum reply depth reached") {
        alert('Không thể trả lời thêm. Đã đạt giới hạn độ sâu của bình luận.');
      } else {
        alert("Đã đạt giới hạn phản hồi bình luận");
      }
      throw error; // Thêm dòng này để propagate error lên component cha
    } finally {
      setIsLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleShareClick = (post) => {
    setSelectedPost(post);
    setShowShareModal(true);
  };

  // Xử lý xóa bài viết
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      return;
    }

    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/posts/${postId}?userId=${currentUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Bạn không có quyền xóa bài viết này');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Không thể xóa bài viết');
      }

      // Xóa bài viết khỏi UI
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      showSuccess('Xóa bài viết thành công');

      // Hủy đăng ký WebSocket
      webSocketService.unsubscribeFromPost(postId);
      subscribedPosts.current.delete(postId);
    } catch (error) {
      console.error('Lỗi khi xóa bài viết:', error);
      showError(error.message || 'Không thể xóa bài viết. Vui lòng thử lại.');
    }
  };

  // Xử lý sửa bài viết
  const handleEditPost = async (postId, content, privacy) => {
    if (!content.trim()) {
      showError('Nội dung bài viết không được để trống');
      return;
    }

    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body: JSON.stringify({
          content: content,
          userId: currentUser.id,
          privacy: privacy
        })
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Bạn không có quyền sửa bài viết này');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Không thể cập nhật bài viết');
      }

      const updatedPost = await response.json();

      // Cập nhật bài viết trong UI
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId ? { ...post, content: updatedPost.content, privacy: updatedPost.privacy } : post
        )
      );

      showSuccess('Cập nhật bài viết thành công');
    } catch (error) {
      console.error('Lỗi khi cập nhật bài viết:', error);
      showError(error.message || 'Không thể cập nhật bài viết. Vui lòng thử lại.');
    }
  };

  // Xử lý xóa bình luận
  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
      return;
    }

    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/posts/${postId}/comments/${commentId}?userId=${currentUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Bạn không có quyền xóa bình luận này');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Không thể xóa bình luận');
      }

      const updatedPost = await response.json();

      // Cập nhật bài viết với bình luận đã xóa
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId ? updatedPost : post
        )
      );

      showSuccess('Xóa bình luận thành công');
    } catch (error) {
      console.error('Lỗi khi xóa bình luận:', error);
      showError(error.message || 'Không thể xóa bình luận. Vui lòng thử lại.');
    }
  };

  // WebSocket setup for real-time updates
  useEffect(() => {
    let isComponentMounted = true;
    let retryTimeout = null;
    const currentSubscribedPosts = subscribedPosts.current;

    const setupWebSocket = async () => {
      try {
        console.log('PostList: Setting up WebSocket connection');
        await webSocketService.connect();

        if (!isComponentMounted) return;

        if (posts && posts.length > 0) {
          // Unsubscribe from posts that are no longer in the list
          const currentPostIds = new Set(posts.map(post => post?.id).filter(Boolean));
          const postsToUnsubscribe = [...currentSubscribedPosts].filter(postId => !currentPostIds.has(postId));

          postsToUnsubscribe.forEach(postId => {
            console.log(`PostList: Unsubscribing from post ${postId} as it's no longer in the list`);
            webSocketService.unsubscribeFromPost(postId);
            currentSubscribedPosts.delete(postId);
          });

          // Subscribe to new posts
          for (const post of posts) {
            if (!post?.id || currentSubscribedPosts.has(post.id)) continue;

            console.log(`PostList: Subscribing to post ${post.id}`);
            currentSubscribedPosts.add(post.id);
            try {
              await webSocketService.subscribeToPost(post.id, handleWebSocketUpdate);
            } catch (error) {
              console.error(`PostList: Failed to subscribe to post ${post.id}:`, error);
            }
          }
        }
      } catch (error) {
        console.error('PostList: Failed to setup WebSocket:', error);
        if (isComponentMounted) {
          retryTimeout = setTimeout(setupWebSocket, 5000);
        }
      }
    };

    setupWebSocket();

    return () => {
      console.log('PostList: Cleaning up WebSocket subscriptions');
      isComponentMounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }

      currentSubscribedPosts.forEach(postId => {
        console.log(`PostList: Unsubscribing from post ${postId} during cleanup`);
        webSocketService.unsubscribeFromPost(postId);
      });
      currentSubscribedPosts.clear();
    };
  }, [posts, handleWebSocketUpdate]);

  // Cập nhật isLoggedIn khi currentUser thay đổi
  useEffect(() => {
    setIsLoggedIn(!!currentUser);
  }, [currentUser]);

  if (!isLoggedIn) {
    return <div className="alert alert-warning">Vui lòng đăng nhập để xem bài viết</div>;
  }

  return (
    <div className="post-list-container" ref={listRef} style={{ overflowY: 'auto' }}>
      {Array.isArray(posts) && posts.map((post) => (
        post && post.id ? (
          <PostItem
            key={post.id}
            post={post}
            currentUser={currentUser}
            userProfile={userProfile}
            handleLike={handleLike}
            handleComment={handleComment}
            handleShareClick={handleShareClick}
            handleDeletePost={handleDeletePost}
            handleEditPost={handleEditPost}
            handleDeleteComment={handleDeleteComment}
            commentInputs={commentInputs}
            setCommentInputs={setCommentInputs}
            isLoading={isLoading}
          />
        ) : null
      ))}
      {showShareModal && selectedPost && (
        <SharePostModal
          show={showShareModal}
          onHide={() => setShowShareModal(false)}
          post={selectedPost}
          onShareSuccess={handleShareSuccess}
        />
      )}
    </div>
  );
}

export default memo(PostList);
