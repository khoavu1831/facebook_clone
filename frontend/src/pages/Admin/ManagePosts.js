import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { Table, Button, Modal, Form, Alert } from 'react-bootstrap';
import axios from 'axios';

const ManagePosts = () => {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentPost, setCurrentPost] = useState({ id: '', content: '', userId: '', likes: [], comments: [], images: [], videos: [], isShared: false, originalPostId: null });
  const [selectedPost, setSelectedPost] = useState(null);

  // Fetch posts on component mount
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/posts');
        setPosts(response.data);
      } catch (err) {
        setError('Failed to fetch posts');
      }
    };
    fetchPosts();
  }, []);

  // Handle post deletion
  const deletePost = async (postId) => {
    try {
      await axios.delete(`http://localhost:8080/api/posts/${postId}`);
      setPosts(posts.filter((post) => post.id !== postId));
    } catch (err) {
      setError('Failed to delete post');
    }
  };

  // Open edit modal
  const openEditModal = (post) => {
    setCurrentPost(post);
    setShowEditModal(true);
  };

  // Handle post update
  const updatePost = async () => {
    try {
      await axios.put(`http://localhost:8080/api/posts/${currentPost.id}`, {
        content: currentPost.content,
        userId: currentPost.userId,
      });
      setPosts(posts.map((post) => (post.id === currentPost.id ? currentPost : post)));
      setShowEditModal(false);
    } catch (err) {
      setError('Failed to update post');
    }
  };

  // Open details modal
  const openDetailsModal = (post) => {
    setSelectedPost(post);
    setShowDetailsModal(true);
  };

  return (
    <AdminLayout>
      <h2 className="mb-4 text-xl font-semibold">Manage Posts</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Table bordered className="content-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Content</th>
            <th>User</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {posts.length > 0 ? (
            posts.map((post) => (
              <tr
                key={post.id}
                onClick={() => openDetailsModal(post)}
                className="cursor-pointer hover:bg-gray-100"
              >
                <td>{post.id}</td>
                <td>{post.content}</td>
                <td>{post.user ? `${post.user.firstName} ${post.user.lastName}` : 'Unknown'}</td>
                <td
                  onClick={(e) => e.stopPropagation()} // Prevent row click from triggering
                >
                  <Button
                    variant="warning"
                    size="sm"
                    className="mr-2"
                    onClick={() => openEditModal(post)}
                  >
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => deletePost(post.id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center">
                No posts available
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Post</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Content</Form.Label>
              <Form.Control
                as="textarea"
                value={currentPost.content}
                onChange={(e) =>
                  setCurrentPost({ ...currentPost, content: e.target.value })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={updatePost}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Post Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPost && (
            <div className="space-y-4">
              <div>
                <strong>Content:</strong>
                <p>{selectedPost.content}</p>
              </div>
              <div>
                <strong>Author:</strong>
                <p>{selectedPost.user ? `${selectedPost.user.firstName} ${selectedPost.user.lastName}` : 'Unknown'}</p>
              </div>
              <div>
                <strong>Likes:</strong>
                <p>{selectedPost.likes ? selectedPost.likes.length : 0}</p>
              </div>
              <div>
                <strong>Comments:</strong>
                <p>{selectedPost.comments ? selectedPost.comments.length : 0}</p>
                {selectedPost.comments && selectedPost.comments.length > 0 && (
                  <ul className="list-disc pl-5">
                    {selectedPost.comments.map((comment, index) => (
                      <li key={index}>
                        {comment.content} by {comment.user ? `${comment.user.firstName} ${comment.user.lastName}` : 'Unknown'}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <strong>Images:</strong>
                <p>{selectedPost.images && selectedPost.images.length > 0 ? selectedPost.images.length : 'None'}</p>
                {selectedPost.images && selectedPost.images.length > 0 && (
                  <div className="flex space-x-2">
                    {selectedPost.images.map((image, index) => (
                      <img
                      key={index}
                      src={`http://localhost:8080${image}`}
                      alt={`Post image ${index}`}
                      className="w-24 h-24 object-cover rounded shadow"
                      style={{width: '200px', height: '200px'}}
                    />
                    
                    ))}
                  </div>
                )}
              </div>
              <div>
                <strong>Videos:</strong>
                <p>{selectedPost.videos && selectedPost.videos.length > 0 ? selectedPost.videos.length : 'None'}</p>
                {selectedPost.videos && selectedPost.videos.length > 0 && (
                  <div className="space-y-2">
                    {selectedPost.videos.map((video, index) => (
                      <video key={index} src={video} controls className="w-48" />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <strong>Shared Post:</strong>
                <p>{selectedPost.isShared ? `Yes (Original Post ID: ${selectedPost.originalPostId})` : 'No'}</p>
                {selectedPost.isShared && selectedPost.originalPost && (
                  <div className="border p-4 mt-2">
                    <strong>Original Post Content:</strong>
                    <p>{selectedPost.originalPost.content}</p>
                    <strong>Original Author:</strong>
                    <p>{selectedPost.originalPost.user ? `${selectedPost.originalPost.user.firstName} ${selectedPost.originalPost.user.lastName}` : 'Unknown'}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </AdminLayout>
  );
};

export default ManagePosts;