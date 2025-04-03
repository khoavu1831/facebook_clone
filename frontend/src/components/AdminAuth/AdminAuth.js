import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Card } from 'react-bootstrap';
import './AdminAuth.css';

const AdminAuth = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === '123') {
      localStorage.setItem('adminToken', 'some-token');
      navigate('/admin');
    } else {
      alert('Invalid credentials');
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