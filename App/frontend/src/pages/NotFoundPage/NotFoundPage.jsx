import { Container, Row, Col } from "react-bootstrap";
import { FileQuestion, Home } from "lucide-react";
import { Link } from "react-router-dom";
import BaseLayout from "../../Layout/BaseLayout";
import MyButton from "../../components/MyButton/MyButton";
import "./NotFoundPage.css";

const NotFoundPage = () => {
  return (
    <BaseLayout>
      <Container className="not-found-container d-flex align-items-center justify-content-center">
        <Row className="text-center w-100">
          <Col md={8} lg={6} className="mx-auto">
            <div className="not-found-card">
              <div className="not-found-icon-wrapper mb-4">
                <FileQuestion size={64} className="not-found-icon" />
              </div>

              <h1 className="not-found-title">404</h1>
              <h2 className="not-found-subtitle mb-3">Page Not Found</h2>

              <p className="not-found-text mb-4">
                Oops! The resource you are looking for has been moved, deleted,
                or never existed in our vault.
              </p>

              <Link to="/" className="text-decoration-none">
                <MyButton className="d-inline-flex px-4 py-2">
                  <Home size={18} />
                  Return to the dashboard
                </MyButton>
              </Link>
            </div>
          </Col>
        </Row>
      </Container>
    </BaseLayout>
  );
};

export default NotFoundPage;
