import { Container, Row, Col } from "react-bootstrap";
import { Code2, Heart, Home, Search } from "lucide-react";
import { FaTelegram, FaGithub } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./MyFooter.css";

const MyFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-wrapper py-4 mt-5">
      <Container>
        <Row className="align-items-center justify-content-between gy-4">
          <Col xs={12} xl={4} className="text-center text-xl-start">
            <div className="d-flex align-items-center justify-content-center justify-content-xl-start gap-2 mb-2">
              <Code2 size={24} className="footer-brand-icon" />
              <span className="footer-brand-text">
                Snippet<span className="vault">Vault</span>
              </span>
            </div>

            <p className="footer-description">
              Share, explore, and fork code snippets with developers worldwide.
            </p>
          </Col>

          <Col xs={12} xl="auto" className="text-center">
            <nav
              className="footer-links d-inline-flex align-items-center justify-content-center gap-1"
              aria-label="Footer navigation"
            >
              <Link to="/" className="d-inline-flex align-items-center gap-1">
                <Home size={15} />
                <span>Home</span>
              </Link>

              <Link
                to="/explore"
                className="d-inline-flex align-items-center gap-1"
              >
                <Search size={15} />
                <span>Explore</span>
              </Link>

              <a
                href="https://github.com/Infamousmick/SnippetVault"
                target="_blank"
                rel="noreferrer"
                className="d-inline-flex align-items-center gap-1"
              >
                <FaGithub size={15} />
                <span>Source</span>
              </a>
            </nav>
          </Col>

          <Col xs={12} xl={4} className="text-center text-xl-end">
            <div className="d-flex justify-content-center justify-content-xl-end gap-3 mb-2">
              <a
                href="https://github.com/Infamousmick"
                target="_blank"
                rel="noreferrer"
                className="social-icon"
                aria-label="GitHub"
              >
                <FaGithub size={20} />
              </a>
              <a
                href="https://t.me/Infamick"
                target="_blank"
                rel="noreferrer"
                className="social-icon"
                aria-label="Telegram"
              >
                <FaTelegram size={20} />
              </a>
            </div>

            <p className="footer-copyright m-0">
              Made with
              <Heart size={14} stroke="#ea3c3f" className="heart-icon mx-1" />
              by Infamick © {currentYear}
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default MyFooter;
