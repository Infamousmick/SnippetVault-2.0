import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import BaseLayout from "../../Layout/BaseLayout";
import AuthForm, { AuthInput } from "../../components/AuthForm/AuthForm";
import { AuthContext } from "../../context/AuthContext/AuthContext";
import { Mail, KeyRound, AtSign } from "lucide-react";
import { getAuthErrorMessage } from "../../utils/authErrors";

const Register = () => {
  const { isLoggedIn, registerUser, loginWithGoogle, loginWithGithub } =
    useContext(AuthContext);
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
  });
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
      await registerUser(formData);
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
        title={
          <>
            Welcome to Snippet<span className="vault">Vault</span>
          </>
        }
        description="Register to SnippetVault"
        error={err}
        successMessage={isLoggedIn ? "Registered successfully!" : null}
        onSubmit={handleSubmit}
        onOAuthLogin={handleOAuth}
        submitLabel="Register"
        footerText="Have an account?"
        footerLinkTo="/login"
        footerLinkLabel="Log in"
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
          icon={AtSign}
          type="text"
          name="username"
          placeholder="username"
          value={formData.username}
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

export default Register;
