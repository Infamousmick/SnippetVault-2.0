import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BaseLayout from "../../Layout/BaseLayout";
import AuthForm, { AuthInput } from "../../components/AuthForm/AuthForm";
import { Mail, KeyRound, AtSign } from "lucide-react";

const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
  });
  const [err, setErr] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (isRegistered) {
      const timer = setTimeout(() => {
        navigate("/login");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isRegistered, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_SERVERURL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            username: formData.username,
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

      setIsRegistered(true);
    } catch (error) {
      setErr(error.message || "Errore di connessione");
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
        successMessage={isRegistered ? "Registered successfully!" : null}
        onSubmit={handleSubmit}
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
