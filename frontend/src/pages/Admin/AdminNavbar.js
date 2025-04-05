import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar, Nav, Container } from 'react-bootstrap';
import './AdminNavbar.css'; 

const AdminNavbar = () => {
  return (
    <Navbar bg="primary" variant="dark" expand="lg" className="mb-4">
      <Container fluid>
        <Navbar.Brand as={Link} to="/admin" style={{fontSize: '1.5rem'}}>Facebook Admin</Navbar.Brand>
        <Navbar.Toggle aria-controls="admin-nav" />
        <Navbar.Collapse id="admin-nav">
          <Nav className="ms-auto nav-items" style={{fontSize: '1rem'}}>
            <Nav.Link as={Link} to="/admin/manage-posts" className="nav-item">
            <img
              src="/img/icons/blog.png"
              alt="Bai viet"
              className="action-icon"
            />
            <span>Quản lý bài viết</span>
            </Nav.Link>
            <Nav.Link as={Link} to="/admin/manage-users" className="nav-item">
            <img
              src="/img/icons/user.png"
              alt="User"
              className="action-icon"
            />
            <span>Quản lý người dùng</span>
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AdminNavbar;
