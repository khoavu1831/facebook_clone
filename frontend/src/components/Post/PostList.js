import React, { useState, useEffect, memo, useRef, useContext, useCallback } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import './PostList.css';
import SharePostModal from './SharePostModal';
import { webSocketService } from '../../services/websocket';
import { UserContext } from '../../contexts/UserContext';

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

const Comment = ({ comment, postId, onReply, currentUser, getFullImageUrl, depth = 0 }) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false);

  if (!currentUser) {
    return null;
  }

  const MAX_VISIBLE_REPLIES = 2; // Số lượng replies hiển thị mặc định
  const MAX_DEPTH = 6; // Giới hạn độ sâu của nested replies để tránh quá nhiều indent

  const handleReply = async () => {
    if (!replyContent.trim() || isLoading) return;
    
    setIsLoading(true);
    try {
      await onReply(postId, replyContent, comment.id);
      setReplyContent('');
      setShowReplyInput(false);
    } finally {
      setIsLoading(false);
    }
  };

  const displayedReplies = showAllReplies 
    ? comment.replies 
    : comment.replies?.slice(0, MAX_VISIBLE_REPLIES);

  const hasMoreReplies = comment.replies?.length > MAX_VISIBLE_REPLIES;
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
          
          <div className="comment-actions mt-1">
            <button 
              className="btn btn-link btn-sm p-0 text-muted me-2"
              onClick={() => setShowReplyInput(!showReplyInput)}
            >
              Phản hồi
            </button>
            <small className="text-muted">
              {new Date(comment.createdAt).toLocaleString()}
            </small>
          </div>

          {showReplyInput && (
            <div className="reply-input-container d-flex gap-2 mt-2">
              <img
                src={getFullImageUrl(currentUser?.avatar)}
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
                    onKeyPress={(e) => {
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
        <div className="replies-container">
          {!showAllReplies && hasMoreReplies && (
            <button
              className="btn btn-link btn-sm text-primary mb-2"
              onClick={() => setShowAllReplies(true)}
            >
              Xem thêm {comment.replies.length - MAX_VISIBLE_REPLIES} phản hồi...
            </button>
          )}
          
          {displayedReplies?.map((reply, index) => (
            <Comment
              key={reply.id || index}
              comment={reply}
              postId={postId}
              onReply={onReply}
              currentUser={currentUser}
              getFullImageUrl={getFullImageUrl}
              depth={depth + 1}
            />
          ))}
          
          {showAllReplies && hasMoreReplies && (
            <button
              className="btn btn-link btn-sm text-primary mt-1"
              onClick={() => setShowAllReplies(false)}
            >
              Ẩn bớt phản hồi
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Component PostItem để render từng bài đăng, được memo
const PostItem = memo(({ post, currentUser, handleLike, handleComment, handleShareClick, commentInputs, setCommentInputs, isLoading }) => {
  const getFullImageUrl = useCallback((path) => {
    if (!path) return '/default-imgs/avatar.png';
    if (path.startsWith('http') || path.startsWith('blob')) return path;
    return `${API_ENDPOINTS.BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  }, []);

  if (!currentUser) {
    return null;
  }

  return (
    <div key={post.id} className="card mb-3">
      <div className="card-body">
        <div className="d-flex align-items-center gap-2 mb-3">
          <img
            src={getFullImageUrl(post.user?.avatar)}
            alt="Người dùng"
            className="rounded-circle"
            style={{ width: '40px', height: '40px' }}
          />
          <div className="flex-grow-1">
            <div className="fw-bold">
              {post.user ? `${post.user.firstName} ${post.user.lastName}` : 'Người dùng không xác định'}
            </div>
            <small className="text-secondary">
              {new Date(post.createdAt).toLocaleString()}
            </small>
          </div>
        </div>

        <PostContent post={post} />

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
                currentUser={currentUser}
                getFullImageUrl={getFullImageUrl}
              />
            )
          ))}
          
          {/* Input để thêm comment mới */}
          <div className="d-flex gap-2 align-items-center mt-3">
            <img
              src={currentUser?.avatar ? getFullImageUrl(currentUser.avatar) : '/default-imgs/avatar.png'}
              alt="Current user"
              className="rounded-circle"
              style={{ width: '30px', height: '30px', objectFit: 'cover' }}
              onError={(e) => {
                e.target.src = '/default-imgs/avatar.png';
              }}
            />
            <div className="flex-grow-1 position-relative">
              <input
                type="text"
                className="form-control rounded-pill comment-input"
                placeholder="Viết bình luận..."
                value={commentInputs[post.id] || ''}
                onChange={(e) => setCommentInputs(prev => ({
                  ...prev,
                  [post.id]: e.target.value
                }))}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isLoading[post.id]) {
                    handleComment(post.id, e.target.value);
                  }
                }}
              />
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
  const listRef = useRef(null);
  const subscribedPosts = useRef(new Set()); // Track subscribed posts

  if (!currentUser) {
    return <div className="alert alert-warning">Vui lòng đăng nhập để xem bài viết</div>;
  }

  // Validate posts when initialPosts changes
  useEffect(() => {
    if (Array.isArray(initialPosts)) {
      setPosts(initialPosts.filter(post => post && post.id));
    }
  }, [initialPosts]);

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
          parentId: parentId
        })
      });

      if (!response.ok) {
        throw new Error('Lỗi kết nối mạng');
      }

      // Thêm comment mới vào UI ngay lập tức với thông tin người dùng
      const newComment = {
        id: Date.now().toString(), // ID tạm thời cho đến khi WebSocket cập nhật
        content: content,
        createdAt: new Date().toISOString(),
        userId: currentUser.id,
        parentId: parentId,
        user: {
          id: currentUser.id,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          avatar: currentUser.avatar
        }
      };

      setPosts(prevPosts => {
        return prevPosts.map(post => {
          if (post.id === postId) {
            if (parentId) {
              // Xử lý trả lời comment
              const updateReplies = (comments) => {
                return comments.map(comment => {
                  if (comment.id === parentId) {
                    return {
                      ...comment,
                      replies: [...(comment.replies || []), newComment]
                    };
                  }
                  if (comment.replies) {
                    return {
                      ...comment,
                      replies: updateReplies(comment.replies)
                    };
                  }
                  return comment;
                });
              };
              
              return {
                ...post,
                comments: updateReplies(post.comments || [])
              };
            } else {
              // Xử lý comment mới
              return {
                ...post,
                comments: [...(post.comments || []), newComment]
              };
            }
          }
          return post;
        });
      });

      // Xóa nội dung input sau khi comment thành công
      if (!parentId) {
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      }
    } catch (error) {
      console.error('Lỗi khi bình luận:', error);
      alert('Không thể thêm bình luận. Vui lòng thử lại.');
    } finally {
      setIsLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleShareClick = (post) => {
    setSelectedPost(post);
    setShowShareModal(true);
  };

  useEffect(() => {
    let isComponentMounted = true;
    let retryTimeout = null;
    
    const setupWebSocket = async () => {
      try {
        await webSocketService.connect();
        
        if (!isComponentMounted) return;
        
        posts.forEach(async (post) => {
          if (!post?.id || subscribedPosts.current.has(post.id)) return;
          
          subscribedPosts.current.add(post.id);
          await webSocketService.subscribeToPost(post.id, updatedPost => {
            if (!isComponentMounted) return;
            
            setPosts(prevPosts => {
              const newPosts = [...prevPosts];
              const index = newPosts.findIndex(p => p?.id === updatedPost.id);
              if (index !== -1) {
                newPosts[index] = {
                  ...newPosts[index],
                  ...updatedPost,
                  user: updatedPost.user || newPosts[index].user,
                  comments: (updatedPost.comments || []).map(comment => ({
                    ...comment,
                    user: comment.user || newPosts[index].comments?.find(c => c.userId === comment.userId)?.user
                  }))
                };
              }
              return newPosts;
            });
          });
        });
      } catch (error) {
        console.error('Failed to setup WebSocket:', error);
        if (isComponentMounted) {
          retryTimeout = setTimeout(setupWebSocket, 5000);
        }
      }
    };

    if (posts?.length > 0) {
      setupWebSocket();
    }

    return () => {
      isComponentMounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      subscribedPosts.current.forEach(postId => {
        webSocketService.unsubscribeFromPost(postId);
      });
      subscribedPosts.current.clear();
      webSocketService.disconnect();
    };
  }, [posts]); // Consider changing this dependency if posts updates too frequently

  return (
    <div className="post-list-container" ref={listRef} style={{ overflowY: 'auto' }}>
      {Array.isArray(posts) && posts.map((post) => (
        post && post.id ? (
          <PostItem
            key={post.id}
            post={post}
            currentUser={currentUser}
            handleLike={handleLike}
            handleComment={handleComment}
            handleShareClick={handleShareClick}
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
