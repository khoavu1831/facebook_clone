import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { Table, Button, Modal, Alert, Card, Row, Col, Badge, InputGroup, FormControl, Pagination } from 'react-bootstrap';
import axios from 'axios';
import { FaTrashAlt, FaSearch, FaUserCircle, FaInfoCircle } from 'react-icons/fa';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentUser, setCurrentUser] = useState({ id: '', firstName: '', lastName: '', email: '', avatar: '', bio: '', gender: '', day: '', month: '', year: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:8080/api/users');
        setUsers(response.data);
        setFilteredUsers(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch users');
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Filter users when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        user =>
          user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
    setCurrentPage(1); // Reset to first page on new search
  }, [searchTerm, users]);

  // Get current users for pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Handle user deletion with confirmation
  const confirmDeleteUser = (user) => {
    setCurrentUser(user);
    setShowDeleteModal(true);
  };

  const deleteUser = async () => {
    try {
      await axios.delete(`http://localhost:8080/api/users/${currentUser.id}`);
      setUsers(users.filter((user) => user.id !== currentUser.id));
      setFilteredUsers(filteredUsers.filter((user) => user.id !== currentUser.id));
      setShowDeleteModal(false);
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  // Open details modal
  const openDetailsModal = (user) => {
    setCurrentUser(user);
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
  }

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-xl font-semibold">Quản lý người dùng</h2>
        <div className="d-flex" style={{ width: '28%' }}>
          <InputGroup className="w-100">
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <FormControl
              placeholder="Tìm kiếm theo tên hoặc email..."
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
          <p className="mt-2">Đang tải dữ liệu người dùng...</p>
        </div>
      ) : (
        <>
          <Table hover responsive className="content-table mb-4">
            <thead className="bg-light">
              <tr>
                <th className="text-center" style={{ width: '8%' }}>#</th>
                <th style={{ width: '42%' }}>Tên người dùng</th>
                <th style={{ width: '35%' }}>Email</th>
                <th className="text-center" style={{ width: '15%' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.length > 0 ? (
                currentUsers.map((user) => (
                  <tr key={user.id} className="align-middle">
                    <td className="text-center">{user.id}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        {user.avatar ? (
                          <img
                            src={`http://localhost:8080${user.avatar}`}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="rounded-circle me-2"
                            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                          />
                        ) : (
                          <FaUserCircle size={40} className="text-secondary me-2" />
                        )}
                        <div>
                          <div className="fw-bold">{`${user.firstName} ${user.lastName}`}</div>
                          <small className="text-muted">{user.role || 'USER'}</small>
                        </div>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center">
                        <Button
                          variant="info"
                          size="sm"
                          className="me-2"
                          onClick={() => openDetailsModal(user)}
                          title="Xem chi tiết"
                        >
                          <FaInfoCircle />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => confirmDeleteUser(user)}
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
                    {searchTerm ? 'Không tìm thấy người dùng phù hợp' : 'Không có người dùng nào'}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>

          {/* Pagination */}
          {filteredUsers.length > usersPerPage && (
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
          <Modal.Title>Thông tin chi tiết người dùng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentUser && (
            <Row>
              <Col md={4} className="text-center mb-4 mb-md-0">
                {currentUser.avatar ? (
                  <img
                    src={`http://localhost:8080${currentUser.avatar}`}
                    alt={`${currentUser.firstName} ${currentUser.lastName}`}
                    className="img-fluid rounded-circle mb-3"
                    style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                  />
                ) : (
                  <FaUserCircle size={150} className="text-secondary mb-3" />
                )}
                <h4>{`${currentUser.firstName} ${currentUser.lastName}`}</h4>
                <Badge bg="primary" className="mb-2">{currentUser.role || 'USER'}</Badge>
              </Col>
              <Col md={8}>
                <Card className="mb-3">
                  <Card.Body>
                    <h5 className="card-title">Thông tin cá nhân</h5>
                    <hr />
                    <Row className="mb-2">
                      <Col sm={4} className="fw-bold">ID:</Col>
                      <Col sm={8}>{currentUser.id}</Col>
                    </Row>
                    <Row className="mb-2">
                      <Col sm={4} className="fw-bold">Email:</Col>
                      <Col sm={8}>{currentUser.email}</Col>
                    </Row>
                    <Row className="mb-2">
                      <Col sm={4} className="fw-bold">Giới tính:</Col>
                      <Col sm={8}>
                        {currentUser.gender === 'Male' ? 'Nam' :
                         currentUser.gender === 'Female' ? 'Nữ' :
                         currentUser.gender === 'Other' ? 'Khác' : 'Không xác định'}
                      </Col>
                    </Row>
                    <Row className="mb-2">
                      <Col sm={4} className="fw-bold">Ngày sinh:</Col>
                      <Col sm={8}>
                        {currentUser.day && currentUser.month && currentUser.year ?
                          `${currentUser.day}/${currentUser.month}/${currentUser.year}` :
                          'Không có thông tin'}
                      </Col>
                    </Row>
                    <Row className="mb-2">
                      <Col sm={4} className="fw-bold">Giới thiệu:</Col>
                      <Col sm={8}>{currentUser.bio || 'Không có thông tin'}</Col>
                    </Row>
                  </Card.Body>
                </Card>
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
          <p>Bạn có chắc chắn muốn xóa người dùng <strong>{`${currentUser.firstName} ${currentUser.lastName}`}</strong>?</p>
          <p className="text-danger">Lưu ý: Hành động này không thể hoàn tác và sẽ xóa tất cả dữ liệu liên quan đến người dùng này.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Hủy
          </Button>
          <Button variant="danger" onClick={deleteUser}>
            Xóa
          </Button>
        </Modal.Footer>
      </Modal>
    </AdminLayout>
  );
};

export default ManageUsers;