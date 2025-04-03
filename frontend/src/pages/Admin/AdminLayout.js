import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import AdminNavbar from "./AdminNavbar";
import AdminFooter from "./AdminFooter";

const AdminLayout = ({ children }) => {
  return (
    <div className="admin-container d-flex flex-column min-vh-100">
      <AdminNavbar />
      <Container fluid className="flex-grow-1">
        <Row>
          <Col md={12} className="main-content">
            <Container className="mt-4">{children}</Container>
          </Col>
        </Row>
      </Container>
      <AdminFooter />
    </div>
  );
};

export default AdminLayout;
