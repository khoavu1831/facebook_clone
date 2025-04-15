import React, { useState, useEffect, memo, useRef } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import './PostList.css';
import SharePostModal from './SharePostModal';

// Component PostContent được memo để tránh render lại không cần thiết
const PostContent = memo(({ post }) => {
  const isSharedPost = post.isShared || post.shared;

  const getFullImageUrl = (path) => {
    if (!path) return '/default-imgs/avatar.png';
    if (path.startsWith('http')) return path;
    return `${API_ENDPOINTS.BASE_URL}${path}`;
  };

  const getFullMediaUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${API_ENDPOINTS.BASE_URL}${path}`;
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

// Component PostItem để render từng bài đăng, được memo
const PostItem = memo(({ post, userData, handleLike, handleComment, handleShareClick, commentInputs, setCommentInputs, isLoading, currentUser }) => {
  const getFullImageUrl = (path) => {
    if (!path) return '/default-imgs/avatar.png';
    if (path.startsWith('http')) return path;
    return `${API_ENDPOINTS.BASE_URL}${path}`;
  };

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
            className={`btn btn-link like-button ${post.likes?.includes(userData.id) ? 'text-primary' : 'text-secondary'}`}
            onClick={() => handleLike(post.id)}
          >
            <img
              src={post.likes?.includes(userData.id) ? "/img/icons/liked.png" : "/img/icons/like.png"}
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
            <div key={index} className="d-flex gap-2 mb-2">
              <img
                src={getFullImageUrl(comment.user?.avatar)}
                alt="Người dùng"
                className="rounded-circle"
                style={{ width: '30px', height: '30px' }}
              />
              <div className="bg-light p-2 rounded comment-text flex-grow-1">
                <div className="fw-bold">
                  {comment.user ? `${comment.user.firstName} ${comment.user.lastName}` : 'Người dùng không xác định'}
                </div>
                {comment.content}
              </div>
            </div>
          ))}

          <div className="d-flex gap-2 align-items-center">
            <img
              src={getFullImageUrl(currentUser?.avatar)}
              alt="Người dùng"
              className="rounded-circle"
              style={{ width: '30px', height: '30px' }}
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
                    handleComment(post.id);
                  }
                }}
                disabled={isLoading[post.id]}
              />
              <button
                className="btn btn-link send-comment-btn"
                onClick={() => handleComment(post.id)}
                disabled={isLoading[post.id] || !commentInputs[post.id]?.trim()}
                title="Gửi bình luận"
              >
                <img
                  src="/img/icons/send-comment.png"
                  alt="Gửi"
                  className="action-icon"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

function PostList({ posts, setPosts }) {
  const [commentInputs, setCommentInputs] = useState({});
  const [isLoading, setIsLoading] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const userData = JSON.parse(localStorage.getItem('userData'));
  const listRef = useRef(null);

  // Giữ vị trí cuộn sau khi cập nhật posts
  useEffect(() => {
    if (listRef.current) {
      const scrollPosition = listRef.current.scrollTop;
      return () => {
        if (listRef.current) {
          listRef.current.scrollTop = scrollPosition;
        }
      };
    }
  }, [posts]);

  const handleShareSuccess = (newPost) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/profile/${userData.id}`);
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data);
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng:', error);
      }
    };

    if (userData?.id) {
      fetchUserProfile();
    }
  }, [userData?.id]);

  const handleLike = async (postId) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.POSTS}/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body: JSON.stringify({
          userId: JSON.parse(localStorage.getItem('userData')).id
        })
      });

      if (!response.ok) throw new Error('Không thể thích bài đăng');

      const updatedPost = await response.json();
      setPosts(prev => {
        const newPosts = [...prev];
        const index = newPosts.findIndex(post => post.id === postId);
        if (index !== -1) {
          newPosts[index] = {
            ...newPosts[index],
            ...updatedPost,
            user: updatedPost.user || newPosts[index].user,
            comments: (updatedPost.comments || []).map(newComment => ({
              ...newComment,
              user: newComment.user || newPosts[index].comments.find(c => c.userId === newComment.userId)?.user
            }))
          };
        }
        return newPosts;
      });
    } catch (error) {
      console.error('Lỗi khi thích bài đăng:', error);
      alert('Không thể thích bài đăng. Vui lòng thử lại.');
    }
  };

  const handleComment = async (postId) => {
    const comment = commentInputs[postId];
    if (!comment?.trim()) return;

    setIsLoading(prev => ({ ...prev, [postId]: true }));
    try {
      const response = await fetch(`${API_ENDPOINTS.POSTS}/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body: JSON.stringify({
          userId: JSON.parse(localStorage.getItem('userData')).id,
          content: comment
        })
      });

      if (!response.ok) throw new Error('Không thể thêm bình luận');

      const updatedPost = await response.json();
      setPosts(prev => {
        const newPosts = [...prev];
        const index = newPosts.findIndex(post => post.id === postId);
        if (index !== -1) {
          newPosts[index] = updatedPost;
        }
        return newPosts;
      });
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
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

  return (
    <div className="post-list-container" ref={listRef} style={{ overflowY: 'auto' }}>
      {posts.map((post) => (
        <PostItem
          key={post.id}
          post={post}
          userData={userData}
          handleLike={handleLike}
          handleComment={handleComment}
          handleShareClick={handleShareClick}
          commentInputs={commentInputs}
          setCommentInputs={setCommentInputs}
          isLoading={isLoading}
          currentUser={currentUser}
        />
      ))}
      <SharePostModal
        show={showShareModal}
        onHide={() => setShowShareModal(false)}
        post={selectedPost}
        onShareSuccess={handleShareSuccess}
      />
    </div>
  );
}

export default memo(PostList);