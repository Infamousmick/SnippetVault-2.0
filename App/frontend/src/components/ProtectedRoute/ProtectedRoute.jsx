import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext/AuthContext";
import { Spinner } from "react-bootstrap";
import "./ProtectedRoute.css";
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, isCheckingAuth } = useContext(AuthContext);

  if (isCheckingAuth) {
    return (
      <div className="loading-profile-wrapper d-flex flex-column align-items-center justify-content-center min-vh-100">
        <Spinner
          animation="border"
          role="status"
          className="mb-3 custom-spinner"
        >
          <span className="visually-hidden">Loading profile...</span>
        </Spinner>
        <h2 className="loading-title">Loading profile...</h2>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;
