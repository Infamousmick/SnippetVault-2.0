import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext/AuthContext";
import { useNavigate } from "react-router-dom";
import BaseLayout from "../../Layout/BaseLayout";
import AuthForm, { AuthInput } from "../../components/AuthForm/AuthForm";
import { Mail, KeyRound } from "lucide-react";
import { getAuthErrorMessage } from "../../utils/authErrors";

const Login = () => {
  const { isLoggedIn, loginWithEmail, loginWithGoogle, loginWithGithub } =
    useContext(AuthContext);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [err, setErr] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      const timer = setTimeout(() => navigate("/"), 1500);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, navigate]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(null);
    try {
      await loginWithEmail(formData.email, formData.password);
    } catch (error) {
      setErr(getAuthErrorMessage(error));
    }
  };

  const handleOAuth = async (provider) => {
    setErr(null);
    try {
      if (provider === "google") await loginWithGoogle();
      else await loginWithGithub();
    } catch (error) {
      setErr(getAuthErrorMessage(error));
    }
  };

  return (
    <BaseLayout>
      <AuthForm
        title="Welcome back"
        description="Login to your SnippetVault's account"
        error={err}
        successMessage={isLoggedIn ? "Login successfully!" : null}
        onSubmit={handleSubmit}
        onOAuthLogin={handleOAuth}
        submitLabel="Log in"
        footerText="Don't have an account?"
        footerLinkTo="/register"
        footerLinkLabel="Register"
      >
        <AuthInput
          icon={Mail}
          type="email"
          name="email"
          placeholder="snippetvault@gmail.com"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <AuthInput
          icon={KeyRound}
          type="password"
          name="password"
          placeholder="*********"
          value={formData.password}
          onChange={handleChange}
          required
        />
      </AuthForm>
    </BaseLayout>
  );
};

export default Login;