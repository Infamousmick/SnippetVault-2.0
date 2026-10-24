import { Container } from "react-bootstrap";
import { Link } from "react-router-dom";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import {
  MyCard,
  MyCardHeader,
  MyCardTitle,
  MyCardDescription,
  MyCardContent,
  MyCardFooter,
} from "../MyCard/MyCard";
import CustomAlert from "../CustomAlert/CustomAlert";
import MyButton from "../MyButton/MyButton";
import "./AuthForm.css";

const oauths = [
  { id: 0, name: "github", icon: FaGithub, label: "Continue with GitHub" },
  { id: 1, name: "google", icon: FcGoogle, label: "Continue with Google" },
];

const handleOAuthLogin = (provider) => {
  window.location.href = `${import.meta.env.VITE_APP_SERVERURL}/oauth/${provider}`;
};

export const AuthInput = ({ icon: Icon, className, ...inputProps }) => (
  <div className="position-relative">
    <Icon size={18} className="auth-input-icon" />
    <input className={`auth-input w-100 ${className || ""}`} {...inputProps} />
  </div>
);

const AuthForm = ({
  title,
  description,
  error,
  successMessage,
  onSubmit,
  submitLabel,
  footerText,
  footerLinkTo,
  footerLinkLabel,
  children,
}) => {
  return (
    <div className="auth-page-wrapper d-flex align-items-center justify-content-center min-vh-100">
      <Container className="d-flex justify-content-center">
        <MyCard className="auth-card">
          <MyCardHeader className="text-center pb-0">
            <MyCardTitle>{title}</MyCardTitle>
            <MyCardDescription>{description}</MyCardDescription>
          </MyCardHeader>

          <MyCardContent className="pt-4">
            <div className="d-flex flex-column gap-2 mb-4">
              {oauths.map((oauth) => {
                const Icon = oauth.icon;
                return (
                  <button
                    type="button"
                    key={oauth.id}
                    className="oauth-btn"
                    onClick={() => handleOAuthLogin(oauth.name)}
                  >
                    <Icon size={18} /> {oauth.label}
                  </button>
                );
              })}
            </div>

            <div className="auth-divider">
              <span>or continue with your email</span>
            </div>

            {error && (
              <div className="mb-2">
                <CustomAlert text={error} type="danger" />
              </div>
            )}
            {successMessage && (
              <div className="mb-2">
                <CustomAlert text={successMessage} type="success" />
              </div>
            )}

            <form onSubmit={onSubmit} className="d-flex flex-column gap-3">
              {children}
              <MyButton type="submit" className="w-100 mt-2">
                {submitLabel}
              </MyButton>
            </form>
          </MyCardContent>

          <MyCardFooter className="justify-content-center gap-1">
            <span className="auth-footer-text">{footerText}</span>
            <Link to={footerLinkTo} className="auth-link">
              {footerLinkLabel}
            </Link>
          </MyCardFooter>
        </MyCard>
      </Container>
    </div>
  );
};

export default AuthForm;
