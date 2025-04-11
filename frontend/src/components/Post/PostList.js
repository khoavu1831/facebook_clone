import React, { useState } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import './PostList.css';

function PostList({ posts, setPosts }) {
  const [commentInputs, setCommentInputs] = useState({});
  const [isLoading, setIsLoading] = useState({});

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
        post.id === postId ? updatedPost : post
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

  return (
    <div>
      {posts.map((post) => (
        <div key={post.id} className="card mb-3">
          <div className="card-body">
            <div className="d-flex align-items-center gap-2 mb-3">
              <img
                src={post.user?.avatar || "/img/logo.png"}
                alt="User"
                className="rounded-circle"
                style={{ width: '40px', height: '40px' }}
              />
              <div className="flex-grow-1">
                <div className="fw-bold">{post.user?.firstName} {post.user?.lastName}</div>
                <small className="text-secondary">
                  {new Date(post.createdAt).toLocaleString()}
                </small>
              </div>
            </div>
            
            <p className="post-content">{post.content}</p>
            
            {post.images?.length > 0 && (
              <div className="mb-3">
                {post.images.map((image, index) => (
                  <img 
                    key={index}
                    src={`${API_ENDPOINTS.BASE_URL}${image}`}
                    alt="Post content" 
                    className="img-fluid rounded mb-2"
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
                  />
                ))}
              </div>
            )}

            <div className="d-flex gap-3 mb-3">
              <button 
                className={`btn btn-link ${post.likes.includes(JSON.parse(localStorage.getItem('userData')).id) ? 'text-primary' : 'text-secondary'}`}
                onClick={() => handleLike(post.id)}
              >
                👍 {post.likes.length} Like
              </button>
              <button className="btn btn-link text-secondary">
                💬 {post.comments.length} Comment
              </button>
              <button className="btn btn-link text-secondary">
                ↗️ Share
              </button>
            </div>

            <div className="comments-section">
              {post.comments.map((comment, index) => (
                <div key={index} className="d-flex gap-2 mb-2">
                  <img
                    src={comment.user?.avatar || "/img/logo.png"}
                    alt="User"
                    className="rounded-circle"
                    style={{ width: '30px', height: '30px' }}
                  />
                  <div className="bg-light p-2 rounded comment-text flex-grow-1">
                    <div className="fw-bold">{comment.user?.firstName} {comment.user?.lastName}</div>
                    {comment.content}
                  </div>
                </div>
              ))}
              
              <div className="d-flex gap-2">
                <img
                  src={JSON.parse(localStorage.getItem('userData'))?.avatar || "/img/logo.png"}
                  alt="User"
                  className="rounded-circle"
                  style={{ width: '30px', height: '30px' }}
                />
                <div className="flex-grow-1">
                  <input
                    type="text"
                    className="form-control rounded-pill"
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
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default PostList;
