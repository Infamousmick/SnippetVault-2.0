import { useLocation, Link, useNavigate } from "react-router-dom";
import { Container, Dropdown } from "react-bootstrap";
import {
  Code,
  Plus,
  Search,
  User,
  Bookmark,
  Settings,
  LogOut,
  LogIn,
} from "lucide-react";
import MyButton from "../MyButton/MyButton";
import "./MyNav.css";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext/AuthContext";
import { SnippetContext } from "../../context/SnippetContext/SnippetContext";
import appSettings from "../../../package.json";

const appVersion = appSettings.version.replace(/\.0$/, "");
const MyNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { openModal, searchQuery, setSearchQuery } = useContext(SnippetContext);

  const inLoginOrRegister =
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/register");
  const { user, isLoggedIn, logoutUser } = useContext(AuthContext);

  const Links = [
    { id: 0, href: "/", label: "Feed" },
    { id: 1, href: "/profile", label: "Profile" },
  ];

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  return (
    <header className="my-header sticky-top">
      <Container className="d-flex align-items-center h-100 gap-2 gap-sm-3 px-3">
        <div className="d-flex align-items-center gap-3 flex-shrink-0">
          <Link to="/" className="my-logo d-flex align-items-center gap-2">
            <span className="logo-icon d-flex align-items-center justify-content-center">
              <Code size={18} />
            </span>
            <span className="logo-text d-none d-lg-inline">
              Snippet<span className="vault">Vault</span>
            </span>
          </Link>

          <a
            href="https://github.com/infamousmick/SnippetVault/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="version-badge d-flex align-items-center gap-1"
            title="View Releases"
          >
            <span className="fw-bold">{appVersion}</span>
            <span className="whats-new-text d-none d-lg-inline">
              ✨ What's new?
            </span>
          </a>
        </div>

        <nav className="d-none d-md-flex align-items-center gap-2 ms-2">
          {Links.map((link) => {
            const isActive =
              location.pathname === link.href ||
              (link.href === "/profile" &&
                location.pathname === `/profile/${user?._id}`);
            return (
              <Link
                key={link.id}
                to={link.href}
                className={`custom-nav-link ${isActive ? "active" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="search-wrapper position-relative ms-auto w-100">
          <Search className="search-icon pe-none position-absolute" size={14} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input w-100"
            placeholder="Search snippets, tags, people..."
            aria-label="Search snippets"
          />
        </div>

        {isLoggedIn && (
          <MyButton className="flex-shrink-0" onClick={() => openModal()}>
            <Plus size={18} />
            <span className="d-none d-lg-inline">New Snippet</span>
          </MyButton>
        )}

        <Dropdown align="end" className="flex-shrink-0">
          <Dropdown.Toggle as="div" className="avatar-toggle">
            <img
              src={user?.avatar_url || "https://placehold.co/32"}
              alt={user?.username || "Guest"}
            />
          </Dropdown.Toggle>

          <Dropdown.Menu className="custom-dropdown-menu mt-2">
            {isLoggedIn ? (
              <div className="px-3 py-2">
                <div className="dropdown-user-name">{user?.username}</div>
                <div className="dropdown-user-email">{user?.email}</div>
              </div>
            ) : (
              <div className="px-3 py-2">
                <div className="dropdown-user-name">Guest</div>
                <div className="dropdown-user-email">Not logged in</div>
              </div>
            )}

            {(isLoggedIn || !inLoginOrRegister) && (
              <Dropdown.Divider className="custom-divider" />
            )}

            {isLoggedIn && (
              <>
                <Dropdown.Item
                  as={Link}
                  to="/profile"
                  className="custom-dropdown-item"
                >
                  <User size={16} className="me-2" /> Profile
                </Dropdown.Item>

                <Dropdown.Item
                  as={Link}
                  to="/saved"
                  className="custom-dropdown-item d-none"
                >
                  <Bookmark size={16} className="me-2" /> Saved
                </Dropdown.Item>

                <Dropdown.Item
                  as={Link}
                  to="/settings"
                  className="custom-dropdown-item"
                >
                  <Settings size={16} className="me-2" /> Settings
                </Dropdown.Item>

                <Dropdown.Divider className="custom-divider" />
              </>
            )}

            {isLoggedIn ? (
              <Dropdown.Item
                as="button"
                onClick={handleLogout}
                className="custom-dropdown-item logout-item"
              >
                <LogOut size={16} className="me-2" /> Log out
              </Dropdown.Item>
            ) : (
              !inLoginOrRegister && (
                <Dropdown.Item
                  as={Link}
                  to="/login"
                  className="custom-dropdown-item login-item"
                >
                  <LogIn size={16} className="me-2" /> Log in
                </Dropdown.Item>
              )
            )}
          </Dropdown.Menu>
        </Dropdown>
      </Container>
    </header>
  );
};

export default MyNav;
