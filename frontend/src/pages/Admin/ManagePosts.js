import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { Table, Button, Modal, Alert, Card, Row, Col, Badge, InputGroup, FormControl, Pagination } from 'react-bootstrap';
import axios from 'axios';
import { FaTrashAlt, FaSearch, FaUserCircle, FaInfoCircle, FaImage, FaVideo, FaComment, FaHeart } from 'react-icons/fa';

const ManagePosts = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPost, setCurrentPost] = useState({ id: '', content: '', userId: '', likes: [], comments: [], images: [], videos: [], isShared: false, originalPostId: null });
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(10);

  // Fetch posts on component mount
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:8080/api/posts');
        setPosts(response.data);
        setFilteredPosts(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch posts');
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // Filter posts when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPosts(posts);
    } else {
      const filtered = posts.filter(
        post =>
          (post.content && post.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (post.user && `${post.user.firstName} ${post.user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredPosts(filtered);
    }
    setCurrentPage(1); // Reset to first page on new search
  }, [searchTerm, posts]);

  // Get current posts for pagination
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Handle post deletion with confirmation
  const confirmDeletePost = (post) => {
    setCurrentPost(post);
    setShowDeleteModal(true);
  };

  const deletePost = async () => {
    try {
      // Thêm tham số userId vào URL để admin có thể xóa bất kỳ bài viết nào
      await axios.delete(`http://localhost:8080/api/posts/${currentPost.id}?userId=admin`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      setPosts(posts.filter((post) => post.id !== currentPost.id));
      setFilteredPosts(filteredPosts.filter((post) => post.id !== currentPost.id));
      setShowDeleteModal(false);
      setError(''); // Xóa thông báo lỗi nếu có
    } catch (err) {
      console.error('Error deleting post:', err);
      setError('Failed to delete post: ' + (err.response?.data || err.message));
    }
  };

  // Open details modal
  const openDetailsModal = (post) => {
    setCurrentPost(post);
    setShowDetailsModal(true);
  };

  // Generate pagination items
  const paginationItems = [];
  for (let number = 1; number <= totalPages; number++) {
    paginationItems.push(
      <Pagination.Item key={number} active={number === currentPage} onClick={() => paginate(number)}>
        {number}
      </Pagination.Item>
    );
  };

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-xl font-semibold">Quản lý bài viết</h2>
        <div className="d-flex" style={{ width: '28%' }}>
          <InputGroup className="w-100">
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <FormControl
              placeholder="Tìm kiếm theo nội dung hoặc tác giả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Đang tải dữ liệu bài viết...</p>
        </div>
      ) : (
        <>
          <Table hover responsive className="content-table mb-4">
            <thead className="bg-light">
              <tr>
                <th className="text-center" style={{ width: '8%' }}>#</th>
                <th style={{ width: '55%' }}>Nội dung</th>
                <th style={{ width: '22%' }}>Tác giả</th>
                <th className="text-center" style={{ width: '15%' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentPosts.length > 0 ? (
                currentPosts.map((post) => (
                  <tr key={post.id} className="align-middle">
                    <td className="text-center">{post.id}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        {post.images && post.images.length > 0 ? (
                          <img
                            src={`http://localhost:8080${post.images[0]}`}
                            alt="Ảnh bài viết"
                            className="rounded me-2"
                            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="bg-light rounded me-2 d-flex align-items-center justify-content-center"
                               style={{ width: '40px', height: '40px' }}>
                            <FaImage className="text-secondary" />
                          </div>
                        )}
                        <div>
                          <div className="fw-bold text-truncate" style={{ maxWidth: '600px' }}>
                            {post.content || 'Không có nội dung'}
                          </div>
                          <small className="text-muted d-flex align-items-center">
                            {post.images && post.images.length > 0 && (
                              <span className="me-2"><FaImage /> {post.images.length}</span>
                            )}
                            {post.videos && post.videos.length > 0 && (
                              <span className="me-2"><FaVideo /> {post.videos.length}</span>
                            )}
                            {post.comments && (
                              <span className="me-2"><FaComment /> {post.comments.length}</span>
                            )}
                            {post.likes && (
                              <span><FaHeart /> {post.likes.length}</span>
                            )}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      {post.user ? (
                        <div className="d-flex align-items-center">
                          {post.user.avatar ? (
                            <img
                              src={`http://localhost:8080${post.user.avatar}`}
                              alt={`${post.user.firstName} ${post.user.lastName}`}
                              className="rounded-circle me-2"
                              style={{ width: '30px', height: '30px', objectFit: 'cover' }}
                            />
                          ) : (
                            <FaUserCircle size={30} className="text-secondary me-2" />
                          )}
                          <span>{`${post.user.firstName} ${post.user.lastName}`}</span>
                        </div>
                      ) : (
                        'Unknown'
                      )}
                    </td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center">
                        <Button
                          variant="info"
                          size="sm"
                          className="me-2"
                          onClick={() => openDetailsModal(post)}
                          title="Xem chi tiết"
                        >
                          <FaInfoCircle />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => confirmDeletePost(post)}
                          title="Xóa"
                        >
                          <FaTrashAlt />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-4">
                    {searchTerm ? 'Không tìm thấy bài viết phù hợp' : 'Không có bài viết nào'}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>

          {/* Pagination */}
          {filteredPosts.length > postsPerPage && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                <Pagination.Prev onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} />
                {paginationItems}
                <Pagination.Next onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} />
                <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
              </Pagination>
            </div>
          )}
        </>
      )}

      {/* Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Thông tin chi tiết bài viết</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentPost && (
            <Row>
              <Col md={4} className="text-center mb-4 mb-md-0">
                {currentPost.images && currentPost.images.length > 0 ? (
                  <img
                    src={`http://localhost:8080${currentPost.images[0]}`}
                    alt="Ảnh bài viết"
                    className="img-fluid rounded mb-3"
                    style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="bg-light rounded mb-3 d-flex align-items-center justify-content-center"
                       style={{ height: '200px', width: '100%' }}>
                    <FaImage size={50} className="text-secondary" />
                  </div>
                )}
                {currentPost.user && (
                  <div className="d-flex align-items-center justify-content-center mb-2">
                    {currentPost.user.avatar ? (
                      <img
                        src={`http://localhost:8080${currentPost.user.avatar}`}
                        alt={`${currentPost.user.firstName} ${currentPost.user.lastName}`}
                        className="rounded-circle me-2"
                        style={{ width: '30px', height: '30px', objectFit: 'cover' }}
                      />
                    ) : (
                      <FaUserCircle size={30} className="text-secondary me-2" />
                    )}
                    <h5 className="mb-0">{`${currentPost.user.firstName} ${currentPost.user.lastName}`}</h5>
                  </div>
                )}
                <div className="d-flex justify-content-center gap-2 mb-3">
                  <Badge bg="primary" className="d-flex align-items-center gap-1">
                    <FaHeart /> {currentPost.likes ? currentPost.likes.length : 0}
                  </Badge>
                  <Badge bg="info" className="d-flex align-items-center gap-1">
                    <FaComment /> {currentPost.comments ? currentPost.comments.length : 0}
                  </Badge>
                </div>
              </Col>
              <Col md={8}>
                <Card className="mb-3">
                  <Card.Body>
                    <h5 className="card-title">Thông tin bài viết</h5>
                    <hr />
                    <Row className="mb-2">
                      <Col sm={4} className="fw-bold">ID:</Col>
                      <Col sm={8}>{currentPost.id}</Col>
                    </Row>
                    <Row className="mb-2">
                      <Col sm={4} className="fw-bold">Nội dung:</Col>
                      <Col sm={8}>{currentPost.content || 'Không có nội dung'}</Col>
                    </Row>
                    <Row className="mb-2">
                      <Col sm={4} className="fw-bold">Tác giả:</Col>
                      <Col sm={8}>
                        {currentPost.user ? `${currentPost.user.firstName} ${currentPost.user.lastName}` : 'Unknown'}
                      </Col>
                    </Row>
                    <Row className="mb-2">
                      <Col sm={4} className="fw-bold">Chia sẻ từ:</Col>
                      <Col sm={8}>
                        {currentPost.isShared ? `Bài viết #${currentPost.originalPostId}` : 'Không'}
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {currentPost.images && currentPost.images.length > 0 && (
                  <Card className="mb-3">
                    <Card.Body>
                      <h5 className="card-title">Hình ảnh ({currentPost.images.length})</h5>
                      <hr />
                      <div className="d-flex flex-wrap gap-2">
                        {currentPost.images.map((image, index) => (
                          <img
                            key={index}
                            src={`http://localhost:8080${image}`}
                            alt={`Bài viết ${index + 1}`}
                            className="rounded shadow"
                            style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                          />
                        ))}
                      </div>
                    </Card.Body>
                  </Card>
                )}

                {currentPost.videos && currentPost.videos.length > 0 && (
                  <Card className="mb-3">
                    <Card.Body>
                      <h5 className="card-title">Video ({currentPost.videos.length})</h5>
                      <hr />
                      <div className="d-flex flex-wrap gap-2">
                        {currentPost.videos.map((video, index) => (
                          <video
                            key={index}
                            src={`http://localhost:8080${video}`}
                            controls
                            className="rounded"
                            style={{ maxWidth: '200px' }}
                          />
                        ))}
                      </div>
                    </Card.Body>
                  </Card>
                )}

                {currentPost.comments && currentPost.comments.length > 0 && (
                  <Card className="mb-3">
                    <Card.Body>
                      <h5 className="card-title">Bình luận ({currentPost.comments.length})</h5>
                      <hr />
                      <div className="comment-list">
                        {currentPost.comments.map((comment, index) => (
                          <div key={index} className="d-flex mb-2 pb-2 border-bottom">
                            {comment.user && comment.user.avatar ? (
                              <img
                                src={`http://localhost:8080${comment.user.avatar}`}
                                alt={`${comment.user.firstName} ${comment.user.lastName}`}
                                className="rounded-circle me-2"
                                style={{ width: '30px', height: '30px', objectFit: 'cover' }}
                              />
                            ) : (
                              <FaUserCircle size={30} className="text-secondary me-2" />
                            )}
                            <div>
                              <div className="fw-bold">
                                {comment.user ? `${comment.user.firstName} ${comment.user.lastName}` : 'Unknown'}
                              </div>
                              <p className="mb-0">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card.Body>
                  </Card>
                )}
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
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
          <Button variant="danger" onClick={deletePost}>
            Xóa
          </Button>
        </Modal.Footer>
      </Modal>
    </AdminLayout>
  );
};

export default ManagePosts;