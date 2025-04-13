import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import './PostList.css';
import SharePostModal from './SharePostModal';

function PostList({ posts, setPosts }) {
  const [commentInputs, setCommentInputs] = useState({});
  const [isLoading, setIsLoading] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const userData = JSON.parse(localStorage.getItem('userData'));

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
        console.error('Error fetching user profile:', error);
      }
    };

    if (userData?.id) {
      fetchUserProfile();
    }
  }, []);

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

      if (!response.ok) throw new Error('Failed to like post');

      const updatedPost = await response.json();
      setPosts(posts.map(post =>
        post.id === postId ? {
          ...post,
          ...updatedPost,
          user: updatedPost.user || post.user,
          comments: (updatedPost.comments || []).map(newComment => ({
            ...newComment,
            user: newComment.user || post.comments.find(c => c.userId === newComment.userId)?.user
          }))
        } : post
      ));
    } catch (error) {
      console.error('Error liking post:', error);
      alert('Failed to like post. Please try again.');
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

      if (!response.ok) throw new Error('Failed to add comment');

      const updatedPost = await response.json();
      setPosts(posts.map(post =>
        post.id === postId ? updatedPost : post
      ));
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    } catch (error) {
      console.error('Error commenting:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setIsLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleShareClick = (post) => {
    setSelectedPost(post);
    setShowShareModal(true);
  };

  const PostContent = ({ post }) => {
    const isSharedPost = post.isShared || post.shared; // Check both flags

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
                    : 'Unknown User'}
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
                      alt="Post content"
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
                    alt="Post content"
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
            Original post is no longer available
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {posts.map((post) => (
        <div key={post.id} className="card mb-3">
          <div className="card-body">
            <div className="d-flex align-items-center gap-2 mb-3">
              <img
                src={getFullImageUrl(post.user?.avatar)}
                alt="User"
                className="rounded-circle"
                style={{ width: '40px', height: '40px' }}
              />
              <div className="flex-grow-1">
                <div className="fw-bold">
                  {post.user ? `${post.user.firstName} ${post.user.lastName}` : 'Unknown User'}
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
                  alt="Marketplace"
                  className="action-icon"
                />
                <span>{post.likes?.length || 0} Like</span>
              </button>
              <button className="btn btn-link text-secondary">
                <img
                  src="/img/icons/comment.png"
                  alt="Marketplace"
                  className="action-icon"
                />
                <span>{post.comments?.length || 0} Comment</span>
              </button>
              <button
                className="btn btn-link text-secondary"
                onClick={() => handleShareClick(post)}
              >
                <img
                  src="/img/icons/share.png"
                  alt="Marketplace"
                  className="action-icon"
                />
                <span>Share</span>
              </button>
            </div>

            <div className="comments-section">
              {post.comments?.map((comment, index) => (
                <div key={index} className="d-flex gap-2 mb-2">
                  <img
                    src={getFullImageUrl(comment.user?.avatar)}
                    alt="User"
                    className="rounded-circle"
                    style={{ width: '30px', height: '30px' }}
                  />
                  <div className="bg-light p-2 rounded comment-text flex-grow-1">
                    <div className="fw-bold">
                      {comment.user ? `${comment.user.firstName} ${comment.user.lastName}` : 'Unknown User'}
                    </div>
                    {comment.content}
                  </div>
                </div>
              ))}

              <div className="d-flex gap-2 align-items-center">
                <img
                  src={getFullImageUrl(currentUser?.avatar)}
                  alt="User"
                  className="rounded-circle"
                  style={{ width: '30px', height: '30px' }}
                />
                <div className="flex-grow-1 position-relative">
                  <input
                    type="text"
                    className="form-control rounded-pill comment-input"
                    placeholder="Write a comment..."
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
                    title="Send comment"
                  >
                    <img
                      src="/img/icons/send-comment.png"
                      alt="Send"
                      className="action-icon"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
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

export default PostList;
