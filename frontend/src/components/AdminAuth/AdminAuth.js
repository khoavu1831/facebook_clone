import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import './AdminAuth.css';

const AdminAuth = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // Fixed admin credentials
    const adminCredentials = {
      username: 'admin',
      password: 'admin',
      role: 'ADMIN',
      id: '1',
      token: 'admin-jwt-token',
    };

    // Validate credentials
    if (username === adminCredentials.username && password === adminCredentials.password) {
      // Store admin info in localStorage
      localStorage.setItem('adminToken', adminCredentials.token);
      localStorage.setItem('adminData', JSON.stringify({
        id: adminCredentials.id,
        username: adminCredentials.username,
        role: adminCredentials.role,
      }));

      navigate('/admin');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="admin-auth-container">
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={4}>
            <Card className="admin-auth-box">
              <Card.Body>
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