import BaseLayout from "../../Layout/BaseLayout";
import { useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import "./OauthSuccess.css";

const OauthSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { loginUser } = useContext(AuthContext);

  useEffect(() => {
    const searcParams = new URLSearchParams(location.search);
    const token = searcParams.get("token");

    const getMe = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_APP_SERVERURL}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          const userData = data.user;
          localStorage.setItem("user", JSON.stringify(userData));

          loginUser(userData);

          setTimeout(() => {
            navigate("/");
          }, 1000);
        } else {
          navigate("/login");
        }
      } catch (error) {
        navigate("/login");
        console.error("Errore nel fetch:", error);
      }
    };

    if (token) {
      localStorage.setItem("token", token);
      getMe();
    } else {
      navigate("/login");
    }
  }, [location, navigate, loginUser]);

  return (
    <BaseLayout>
      <div className="oauth-success-wrapper d-flex flex-column align-items-center justify-content-center min-vh-100">
        <Spinner
          animation="border"
          role="status"
          className="mb-3 custom-spinner"
        >
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <h2 className="oauth-title">Authenticating...</h2>
        <p className="oauth-text">We are redirecting you to your dashboard.</p>
      </div>
    </BaseLayout>
  );
};

export default OauthSuccess;
