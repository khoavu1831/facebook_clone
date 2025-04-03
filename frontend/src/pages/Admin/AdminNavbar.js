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
            <Nav.Link as={Link} to="/admin/manage-posts" className="nav-item">Quản lý bài viết</Nav.Link>
            <Nav.Link as={Link} to="/admin/manage-users" className="nav-item">Quản lý người dùng</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AdminNavbar;
