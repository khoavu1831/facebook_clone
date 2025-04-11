import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { API_ENDPOINTS } from '../../config/api';
import './AdminAuth.css';

const AdminAuth = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(API_ENDPOINTS.ADMIN_LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid credentials');
      }

      // Verify admin role
      if (data.role !== 'ADMIN') {
        throw new Error('Unauthorized access');
      }

      // Lưu thông tin admin vào localStorage
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminData', JSON.stringify({
        id: data.id,
        email: data.email,
        role: data.role
      }));

      navigate('/admin');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-auth-container">
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={4}>
            <Card className="admin-auth-box">
              <Card.Body>
                <div className="logo">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg"
                    alt="Facebook Logo"
                    width="40"
                    height="40"
                  />
                </div>
                <h2 className="text-center">Admin Login</h2>
                {error && (
                  <Alert variant="danger" className="mt-3">
                    {error}
                  </Alert>
                )}
                <Form onSubmit={handleLogin}>
                  <Form.Group className="mb-3" controlId="username">
                    <Form.Control
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="password">
                    <Form.Control
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Button variant="primary" type="submit" className="w-100">
                    LOGIN
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AdminAuth;
