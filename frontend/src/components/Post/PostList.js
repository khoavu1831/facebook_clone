import React from 'react';
import './PostList.css';

function PostList({ posts, setPosts }) {
  const handleLike = (postId) => {
    setPosts(posts.map((post) =>
      post.id === postId ? { ...post, likes: post.likes + 1 } : post
    ));
  };

  const handleComment = (postId, comment) => {
    setPosts(posts.map((post) =>
      post.id === postId ? { ...post, comments: [...post.comments, comment] } : post
    ));
  };

  return (
    <div>
      {posts.map((post) => (
        <div key={post.id} className="card mb-3">
          <div className="card-body">
            <div className="d-flex align-items-center gap-2 mb-3">
              <img
                src="/img/logo.png"
                alt="User"
                className="rounded-circle"
                style={{ width: '40px', height: '40px' }}
              />
              <div className="flex-grow-1">
                <div className="fw-bold username">MaGaming</div>
                <small className="text-secondary timestamp">
                  {new Date(post.createdAt).toLocaleString()}
                </small>
              </div>
              <button className="btn btn-link text-secondary">⋯</button>
            </div>
            <p className="post-content">{post.content}</p>
            {post.media && (
              <div className="mb-3" style={{ maxWidth: '400px', margin: '0 auto' }}>
                {post.media.includes('video') ? (
                  <video
                    src={post.media}
                    controls
                    className="img-fluid rounded"
                    style={{ width: '100%', height: 'auto', maxHeight: '300px' }}
                  />
                ) : (
                  <img
                    src={post.media}
                    alt="Post Media"
                    className="img-fluid rounded"
                    style={{ width: '100%', height: 'auto', maxHeight: '700px', objectFit: 'cover' }}
                  />
                )}
              </div>
            )}
            <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
              <button
                className="btn btn-link text-secondary action-button flex-grow-1"
                onClick={() => handleLike(post.id)}
              >
                <img
                  src="/img/icons/like.png"
                  alt="Like"
                  className="action-icon me-1"
                />
                Like ({post.likes})
              </button>
              <button className="btn btn-link text-secondary action-button flex-grow-1">
                <img
                  src="/img/icons/comment.png"
                  alt="Comment"
                  className="action-icon me-1"
                />
                Comment ({post.comments.length})
              </button>
              <button className="btn btn-link text-secondary action-button flex-grow-1">
                <img
                  src="/img/icons/share.png"
                  alt="Share"
                  className="action-icon me-1"
                />
                Share
              </button>
            </div>
            {/* Comment Section */}
            <div className="mb-3">
              {post.comments.map((comment, index) => (
                <div key={index} className="d-flex gap-2 mb-2">
                  <img
                    src="/img/logo.png"
                    alt="User"
                    className="rounded-circle"
                    style={{ width: '30px', height: '30px' }}
                  />
                  <div className="bg-light p-2 rounded comment-text flex-grow-1">{comment}</div>
                </div>
              ))}
              <div className="d-flex gap-2">
                <img
                  src="/img/logo.png"
                  alt="User"
                  className="rounded-circle"
                  style={{ width: '30px', height: '30px' }}
                />
                <input
                  type="text"
                  className="form-control rounded-pill comment-input flex-grow-1"
                  placeholder="Write a comment..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      handleComment(post.id, e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default PostList;