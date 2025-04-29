import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import './AdminNavbar.css';

const AdminNavbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    navigate('/admin/login');
  };

  return (
    <Navbar bg="primary" variant="dark" expand="lg" className="mb-4 admin-navbar">
      <Container fluid>
        <Navbar.Brand as={Link} to="/admin" className="text-xl">
          Facebook Admin
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="admin-nav" />
        <Navbar.Collapse id="admin-nav">
          <Nav className="ms-auto space-x-4">
            <Nav.Link as={Link} to="/admin/manage-posts" className="flex items-center space-x-2">
              <span>Manage Posts</span>
            </Nav.Link>
            <Nav.Link as={Link} to="/admin/manage-users" className="flex items-center space-x-2">
              <span>Manage Users</span>
            </Nav.Link>
            <Button
              variant="outline-danger"
              size="sm"
              className="ml-4"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AdminNavbar;