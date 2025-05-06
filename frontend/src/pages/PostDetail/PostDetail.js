import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api';
import { useUser } from '../../contexts/UserContext';
import { useToast } from '../../context/ToastContext';
import { webSocketService } from '../../services/websocket';
import LeftSidebar from '../../components/LeftSidebar';
import RightSidebar from '../../components/RightSidebar';
import SharePostModal from '../../components/Post/SharePostModal';
import PostOptionsMenu from '../../components/Post/PostOptionsMenu';
import ImageViewerModal from '../../components/Post/ImageViewerModal';
import { Modal, Button } from 'react-bootstrap';
import './PostDetail.css';
import CommentSuggestions from '../../components/CommentSuggestions';

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useUser();
  const { showSuccess, showError } = useToast();

  // Get query parameters for comment highlighting
  const queryParams = new URLSearchParams(location.search);
  const highlightCommentId = queryParams.get('commentId');

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [commentInput, setCommentInput] = useState('');
  // Không cần các state này nữa vì đã được xử lý trong component Comment
  const [showShareModal, setShowShareModal] = useState(false);
  const [isLoading, setIsLoading] = useState({});
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false);

  // Ref for highlighted comment
  const highlightedCommentRef = useRef(null);

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

  // Biến để theo dõi xem người dùng có đang nhập liệu không
  const isUserTyping = useRef(false);

  // Biến để theo dõi xem có đang hiển thị ô nhập phản hồi không
  const isReplyInputVisible = useRef(false);

  // WebSocket subscription
  useEffect(() => {
    if (postId && currentUser?.id) {
      // Subscribe to post updates
      webSocketService.subscribeToPost(postId, (updatedPost) => {
        // Kiểm tra xem có đang nhập liệu không
        const isTyping = isUserTyping.current;

        // Kiểm tra xem có ô nhập phản hồi nào đang hiển thị không
        const isReplyVisible = isReplyInputVisible.current;

        // Chỉ cập nhật khi không đang nhập liệu và không có ô nhập phản hồi nào đang hiển thị
        if (!isTyping && !isReplyVisible) {
          setPost(prevPost => {
            // Nếu không có post trước đó, thì cập nhật
            if (!prevPost) {
              return updatedPost;
            }

            // Tạo bản sao của updatedPost để tránh tham chiếu trực tiếp
            const newPost = { ...updatedPost };

            // Giữ nguyên các đường dẫn hình ảnh và video từ post cũ
            // để tránh việc tải lại không cần thiết
            if (prevPost.images && newPost.images) {
              newPost.images = [...prevPost.images];
            }
            if (prevPost.videos && newPost.videos) {
              newPost.videos = [...prevPost.videos];
            }

            // Giữ nguyên các bình luận đang được hiển thị
            if (prevPost.comments && newPost.comments) {
              // Chỉ cập nhật nội dung bình luận, không thay đổi trạng thái hiển thị
              newPost.comments = newPost.comments.map(newComment => {
                const oldComment = prevPost.comments.find(c => c.id === newComment.id);
                if (oldComment) {
                  // Giữ lại các trạng thái hiển thị từ bình luận cũ
                  return {
                    ...newComment,
                    // Giữ nguyên các thuộc tính UI nếu có
                  };
                }
                return newComment;
              });
            }

            // Nếu là bài đăng chia sẻ, cũng giữ nguyên hình ảnh của bài gốc
            if (prevPost.originalPost && newPost.originalPost) {
              newPost.originalPost = { ...newPost.originalPost };
              if (prevPost.originalPost.images && newPost.originalPost.images) {
                newPost.originalPost.images = [...prevPost.originalPost.images];
              }
              if (prevPost.originalPost.videos && newPost.originalPost.videos) {
                newPost.originalPost.videos = [...prevPost.originalPost.videos];
              }
            }

            return newPost;
          });
        }
      });

      return () => {
        // Unsubscribe when component unmounts
        webSocketService.unsubscribeFromPost(postId);
      };
    }
  }, [postId, currentUser?.id]);

  // Không cần useEffect này nữa vì việc hiển thị replies được xử lý trong component Comment

  // Cache for image URLs to prevent unnecessary reloads
  const imageUrlCache = useRef(new Map());

  const getFullImageUrl = useCallback((path) => {
    if (!path) return '/default-imgs/avatar.png';
    if (path.startsWith('http') || path.startsWith('blob')) return path;

    // Check if we already have this URL in our cache
    if (imageUrlCache.current.has(path)) {
      return imageUrlCache.current.get(path);
    }

    // Create the full URL
    const fullUrl = `${API_ENDPOINTS.BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;

    // Store in cache
    imageUrlCache.current.set(path, fullUrl);

    return fullUrl;
  }, []);

  // Memoized component for avatar to prevent unnecessary re-renders
  const MemoizedAvatar = memo(({ src, alt, className, style, onClick }) => {
    // Use a stable reference for the src to prevent unnecessary re-renders
    const srcRef = useRef(src);

    // Only update the ref if the src has actually changed
    useEffect(() => {
      if (src !== srcRef.current) {
        srcRef.current = src;
      }
    }, [src]);

    return (
      <img
        src={srcRef.current}
        alt={alt}
        className={className}
        style={style}
        onClick={onClick}
        loading="lazy"
      />
    );
  }, (prevProps, nextProps) => {
    // Custom comparison function for memo
    // Only re-render if the src actually changes and is different
    return prevProps.src === nextProps.src;
  });

  // Memoized component for post images to prevent unnecessary re-renders
  const MemoizedPostImage = memo(({ src, alt, className, onClick }) => {
    // Use a stable reference for the src to prevent unnecessary re-renders
    const srcRef = useRef(src);

    // Only update the ref if the src has actually changed
    useEffect(() => {
      if (src !== srcRef.current) {
        srcRef.current = src;
      }
    }, [src]);

    return (
      <img
        src={srcRef.current}
        alt={alt}
        className={className}
        onClick={onClick}
        loading="lazy"
        onError={(e) => {
          console.log('Image load error, using default:', e.target.src);
          e.target.src = '/default-imgs/image-placeholder.png';
        }}
      />
    );
  }, (prevProps, nextProps) => {
    // Custom comparison function for memo
    // Only re-render if the src actually changes
    return prevProps.src === nextProps.src;
  });

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

    // Đánh dấu người dùng đã ngừng nhập liệu
    isUserTyping.current = false;
    isReplyInputVisible.current = false;

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
      if (!parentId) {
        setCommentInput('');
      }

      // WebSocket will update the post
    } catch (error) {
      console.error('Error adding comment:', error);
      showError('Failed to add comment. Please try again.');
      throw error; // Rethrow error to be caught by the caller
    } finally {
      setIsLoading(prev => ({ ...prev, [`comment_${parentId || 'new'}`]: false }));
    }
  };

  const handleDeleteComment = async (commentId) => {
    setCommentToDelete(commentId);
    setShowDeleteCommentModal(true);
  };

  const confirmDeleteComment = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/posts/${postId}/comments/${commentToDelete}?userId=${currentUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }

      showSuccess('Bình luận đã được xóa thành công');
      // WebSocket will update the post
    } catch (error) {
      console.error('Error deleting comment:', error);
      showError('Không thể xóa bình luận. Vui lòng thử lại.');
    } finally {
      setShowDeleteCommentModal(false);
      setCommentToDelete(null);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body: JSON.stringify({
          userId: currentUser.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to like comment');
      }

      // WebSocket will update the post
    } catch (error) {
      console.error('Error liking comment:', error);
      showError('Failed to like comment. Please try again.');
    }
  };

  // Không cần các hàm này nữa vì đã được xử lý trong component Comment

  const handleShareClick = () => {
    setShowShareModal(true);
  };

  const handleDeletePost = async () => {
    setShowDeleteModal(true);
  };

  const confirmDeletePost = async () => {
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
      setShowDeleteModal(false);
      navigate('/'); // Redirect to home page
    } catch (error) {
      console.error('Error deleting post:', error);
      showError('Failed to delete post. Please try again.');
      setShowDeleteModal(false);
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

  // Comment component - Rewritten to match PostList.js
  const Comment = ({ comment, postId, depth = 0 }) => {
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [isCommentLoading, setIsCommentLoading] = useState(false);
    const [showAllReplies, setShowAllReplies] = useState(false);

    // For highlighting
    const isHighlightedComment = comment.id === highlightCommentId;
    const [hasScrolled, setHasScrolled] = useState(false);
    const commentRef = isHighlightedComment ? highlightedCommentRef : null;

    const MAX_REPLY_DEPTH = 4; // Giới hạn độ sâu tối đa (0,1,2,3 = 4 tầng)
    const MAX_VISIBLE_REPLIES = 0; // Mặc định không hiển thị phản hồi con

    // Kiểm tra xem có thể reply tiếp không
    const canReply = depth < MAX_REPLY_DEPTH;

    // Kiểm tra xem người dùng hiện tại có phải là chủ sở hữu bình luận không
    const isCommentOwner = currentUser?.id === comment.userId;

    // Scroll to highlighted comment when it's rendered - only once
    useEffect(() => {
      if (isHighlightedComment && highlightedCommentRef.current && !hasScrolled) {
        setHasScrolled(true);

        const scrollTimeout = setTimeout(() => {
          if (highlightedCommentRef.current) {
            highlightedCommentRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Auto-show reply input for highlighted comment
            setShowReplyInput(true);
          }
        }, 500);

        return () => clearTimeout(scrollTimeout);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleReply = async () => {
      if (!replyContent.trim() || isCommentLoading) return;

      setIsCommentLoading(true);
      try {
        await handleComment(replyContent, comment.id);
        setReplyContent('');
        setShowReplyInput(false);
      } catch (error) {
        console.error('Error in handleReply:', error);
      } finally {
        setIsCommentLoading(false);
      }
    };

    const displayedReplies = showAllReplies
      ? comment.replies
      : comment.replies?.slice(0, MAX_VISIBLE_REPLIES);

    // Luôn hiển thị nút "Xem thêm phản hồi" nếu có phản hồi con
    const hasMoreReplies = comment.replies?.length > 0;
    const marginLeft = depth < MAX_REPLY_DEPTH ? `${depth * 32}px` : `${MAX_REPLY_DEPTH * 32}px`;

    if (!currentUser) {
      return null;
    }

    return (
      <div className="comment-thread" style={{ marginLeft }} ref={commentRef}>
        <div className="comment-main d-flex gap-2 mb-2">
          <MemoizedAvatar
            src={getFullImageUrl(comment.user?.avatar)}
            alt="User"
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
                {comment.user ? `${comment.user.firstName} ${comment.user.lastName}` : 'Unknown User'}
              </div>
              {comment.content}
            </div>

            <div className="comment-actions mt-1 d-flex align-items-center">
              <button
                className={`btn btn-link btn-sm p-0 ${comment.likes?.includes(currentUser.id) ? 'text-primary' : 'text-secondary'} me-2`}
                onClick={() => handleLikeComment(comment.id)}
              >
                Thích {comment.likes?.length > 0 && `(${comment.likes.length})`}
              </button>
              {canReply && (
                <button
                  className="btn btn-link btn-sm p-0 text-secondary me-2"
                  onClick={() => setShowReplyInput(!showReplyInput)}
                >
                  Phản hồi
                </button>
              )}
              {isCommentOwner && (
                <button
                  className="btn btn-link btn-sm p-0 text-danger me-2"
                  onClick={() => handleDeleteComment(comment.id)}
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
                <MemoizedAvatar
                  src={getFullImageUrl(userProfile?.avatar)}
                  alt="Current user"
                  className="rounded-circle"
                  style={{ width: '28px', height: '28px', objectFit: 'cover' }}
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
                        if (e.key === 'Enter' && !e.shiftKey && !isCommentLoading) {
                          e.preventDefault();
                          handleReply();
                        }
                      }}
                    />
                    <button
                      className="btn btn-link text-primary position-absolute"
                      style={{ right: '8px', top: '50%', transform: 'translateY(-50%)' }}
                      onClick={handleReply}
                      disabled={isCommentLoading || !replyContent.trim()}
                    >
                      {isCommentLoading ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      ) : (
                        <i className="bi bi-send-fill"></i>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {hasMoreReplies && (
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
                    depth={depth + 1}
                  />
                ))}

                {showAllReplies && comment.replies?.length > 0 && (
                  <button
                    className="btn btn-link btn-sm text-primary"
                    onClick={() => setShowAllReplies(false)}
                  >
                    <i className="bi bi-chevron-up me-1"></i>
                    Ẩn phản hồi
                  </button>
                )}
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
                  <MemoizedAvatar
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
                                    <MemoizedPostImage
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
                              <MemoizedPostImage
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

                    <div className="flex-grow-1 position-relative">
                      <div className="d-flex align-items-center">
                        <MemoizedAvatar
                          src={getFullImageUrl(userProfile?.avatar)}
                          alt="Người dùng hiện tại"
                          className="rounded-circle"
                          style={{ width: '32px', height: '32px', objectFit: 'cover', marginRight: '8px'}}
                        />
                        <input
                          type="text"
                          className="form-control rounded-pill comment-input"
                          placeholder="Viết bình luận..."
                          value={commentInput}
                          onChange={(e) => {
                            isUserTyping.current = true;
                            setCommentInput(e.target.value);
                          }}
                          onFocus={() => {
                            isUserTyping.current = true;
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleComment(commentInput);
                            }
                          }}
                        />
                        <button
                          className="btn btn-link text-primary ms-2"
                          onClick={() => handleComment(commentInput)}
                          disabled={isLoading.comment_new || !commentInput?.trim()}
                        >
                          <i className="bi bi-send-fill"></i>
                        </button>
                      </div>

                      {/* Thêm component gợi ý bình luận */}
                      <CommentSuggestions
                        postContent={post?.content}
                        imageUrl={post?.images && post.images.length > 0 ? post.images[0] : null}
                        onSelectSuggestion={(suggestion) => setCommentInput(suggestion)}
                      />
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

      {/* Image Viewer Modal - Only render when needed */}
      {showImageViewer && post && (
        <ImageViewerModal
          key="image-viewer-modal" // Add a key to ensure proper mounting/unmounting
          show={showImageViewer}
          onHide={() => setShowImageViewer(false)}
          images={post.isShared && post.originalPost ? post.originalPost.images : post.images}
          initialIndex={selectedImageIndex}
          getFullImageUrl={getFullImageUrl}
        />
      )}

      {/* Thêm modal xác nhận xóa bài viết */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn muốn xóa bài viết này?</p>
          <p className="text-danger">Lưu ý: Hành động này không thể hoàn tác và sẽ xóa tất cả dữ liệu liên quan đến bài viết này.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Hủy
          </Button>
          <Button variant="danger" onClick={confirmDeletePost}>
            Xóa
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Comment Confirmation Modal */}
      <Modal show={showDeleteCommentModal} onHide={() => setShowDeleteCommentModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xóa bình luận</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn muốn xóa bình luận này?</p>
          <p className="text-danger">Lưu ý: Hành động này không thể hoàn tác.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteCommentModal(false)}>
            Hủy
          </Button>
          <Button variant="danger" onClick={confirmDeleteComment}>
            Xóa
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PostDetail;
