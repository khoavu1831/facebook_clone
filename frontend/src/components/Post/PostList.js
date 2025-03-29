import React, { useState } from 'react';

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
                <div className="fw-bold">MaGaming</div>
                <small className="text-secondary">{new Date(post.createdAt).toLocaleString()}</small>
              </div>
              <button className="btn btn-link text-secondary">⋯</button>
            </div>
            <p>{post.content}</p>
            {post.media && (
              <div className="mb-3">
                {post.media.includes('video') ? (
                  <video src={post.media} controls className="img-fluid rounded" />
                ) : (
                  <img src={post.media} alt="Post Media" className="img-fluid rounded" />
                )}
              </div>
            )}
            <div className="d-flex gap-3 mb-3">
              <button
                className="btn btn-link text-secondary"
                onClick={() => handleLike(post.id)}
              >
                👍 Like ({post.likes})
              </button>
              <button className="btn btn-link text-secondary">
                💬 Comment ({post.comments.length})
              </button>
              <button className="btn btn-link text-secondary">📤 Share</button>
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
                  <div className="bg-light p-2 rounded">{comment}</div>
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
                  className="form-control rounded-pill"
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