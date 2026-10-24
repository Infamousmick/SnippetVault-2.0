import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext/AuthContext";
import { useNavigate } from "react-router-dom";
import BaseLayout from "../../Layout/BaseLayout";
import AuthForm, { AuthInput } from "../../components/AuthForm/AuthForm";
import { Mail, KeyRound } from "lucide-react";

const Login = () => {
  const { isLoggedIn, loginUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [err, setErr] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      const timer = setTimeout(() => {
        navigate("/");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_SERVERURL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            identifier: formData.identifier,
            password: formData.password,
          }),
        },
      );

      if (!response.ok) {
        const errData = await response.json();

        if (errData.errors && errData.errors.length > 0) {
          const errorList = (
            <ul className="mb-0 text-start">
              {errData.errors.map((errObj, index) => (
                <li key={index}>{errObj.message}</li>
              ))}
            </ul>
          );
          setErr(errorList);
          return;
        }
        throw new Error(errData.message || "Registration failed");
      }
      const { token, user } = await response.json();
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      loginUser(user);
    } catch (error) {
      setErr(error.message || "Errore di connessione");
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
        submitLabel="Log in"
        footerText="Don't have an account?"
        footerLinkTo="/register"
        footerLinkLabel="Register"
      >
        <AuthInput
          icon={Mail}
          type="text"
          name="identifier"
          placeholder="email or username"
          value={formData.identifier}
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
