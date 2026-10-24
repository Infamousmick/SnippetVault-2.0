import { useState, useContext, useEffect } from "react";
import { Container, Tab, Nav, Row, Col } from "react-bootstrap";
import {
  ShieldAlert,
  KeyRound,
  Lock,
  User,
  Sparkles,
  Trash2,
} from "lucide-react";
import "./SettingsPage.css";
import BaseLayout from "../../Layout/BaseLayout";
import MyButton from "../../components/MyButton/MyButton";
import { AuthContext } from "../../context/AuthContext/AuthContext";
import CustomAlert from "../../components/CustomAlert/CustomAlert";

const SettingsPage = () => {
  const { isLoggedIn, user, isOauth, updateUser, logoutUser } =
    useContext(AuthContext);

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [username, setUsername] = useState(user?.username || "");
  const [passwordMessage, setPasswordMessage] = useState({
    type: null,
    text: null,
  });
  const [usernameMessage, setUsernameMessage] = useState({
    type: null,
    text: null,
  });
  const [avatarMessage, setAvatarMessage] = useState({
    type: null,
    text: null,
  });
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isUsernameLoading, setIsUsernameLoading] = useState(false);
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [aiKey, setAiKey] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState({ type: null, text: null });
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState({
    type: null,
    text: null,
  });

  const specificError = (data) => {
    return data.errors && data.errors.length > 0
      ? data.errors[0].message
      : data.message;
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (deleteConfirmInput !== user?.username) return;

    setIsDeleteLoading(true);
    setDeleteMessage({ type: null, text: null });

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_APP_SERVERURL}/users/${user._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.status === 401) {
        logoutUser();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          specificError(data) || "Error while deleting your account.",
        );
      }

      setDeleteMessage({ type: "success", text: data.message });

      setTimeout(() => logoutUser(), 3000);
    } catch (error) {
      setDeleteMessage({ type: "danger", text: error.message });
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: null, text: null });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({
        type: "danger",
        text: "New passwords do not match!",
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordMessage({
        type: "danger",
        text: "New password must be at least 8 characters long.",
      });
      return;
    }

    setIsPasswordLoading(true);
    const token = localStorage.getItem("token");

    try {
      if (isOauth) {
        throw new Error("Oauth users cannot modify password");
      } else if (!isLoggedIn) {
        throw new Error("You must be logged in!");
      }

      const { oldPassword, newPassword } = passwordData;
      const payload = { oldPassword, newPassword };

      const response = await fetch(
        `${import.meta.env.VITE_APP_SERVERURL}/auth/password`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (response.status === 401) {
        logoutUser();
        return;
      }
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          specificError(data) || "Error while updating the password..",
        );
      }

      setPasswordMessage({ type: "success", text: data.message });

      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setPasswordMessage({ type: "danger", text: error.message });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    setUsernameMessage({ type: null, text: null });
    setIsUsernameLoading(true);

    try {
      if (username === user.username) {
        setUsernameMessage({
          type: "warning",
          text: "Set a username different from the current one.",
        });
        return;
      }

      const payload = {
        username: username,
      };
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_APP_SERVERURL}/users/${user._id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (response.status === 401) {
        logoutUser();
        return;
      }
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          specificError(data) || "Error while updating the username..",
        );
      }

      updateUser({ ...user, username: username });
      setUsernameMessage({ type: "success", text: data.message });
    } catch (error) {
      setUsernameMessage({ type: "danger", text: error.message });
    } finally {
      setIsUsernameLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setAvatarFile(e.target.files[0]);
  };

  const handleAvatarSubmit = async (e) => {
    e.preventDefault();
    if (!avatarFile) return;

    setIsAvatarLoading(true);
    setAvatarMessage({ type: null, text: null });

    try {
      const token = localStorage.getItem("token");
      const userId = user._id;
      const formData = new FormData();
      formData.append("avatar", avatarFile);

      const response = await fetch(
        `${import.meta.env.VITE_APP_SERVERURL}/users/${userId}/avatar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (response.status === 401) {
        logoutUser();
        return;
      }
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          specificError(data) || "Error while uploading the avatar..",
        );
      }

      setAvatarMessage({ type: "success", text: data.message });
      updateUser(data.user);
    } catch (error) {
      setAvatarMessage({ type: "danger", text: error.message });
    } finally {
      setIsAvatarLoading(false);
    }
  };

  const handleAiSubmit = async (e) => {
    e.preventDefault();
    if (!aiKey.trim()) return;

    setIsAiLoading(true);
    setAiMessage({ type: null, text: null });

    try {
      const token = localStorage.getItem("token");

      const payload = {
        gemini_key: aiKey,
      };

      const response = await fetch(
        `${import.meta.env.VITE_APP_SERVERURL}/users/${user._id}/gemini-key`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (response.status === 401) {
        logoutUser();
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          specificError(data) || "Error while updating Gemini API key..",
        );
      }

      updateUser({ ...user, hasGeminiKey: true });
      setAiKey("");
      setAiMessage({ type: "success", text: "API Key updated successfully!" });
    } catch (err) {
      setAiMessage({ type: "danger", text: err.message });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiDelete = async () => {
    const isConfirmed = window.confirm(
      "Are you sure you want to remove your Gemini API Key?",
    );
    if (!isConfirmed) return;

    setIsAiLoading(true);
    setAiMessage({ type: null, text: null });

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_APP_SERVERURL}/users/${user._id}/gemini-key`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 401) {
        logoutUser();
        return;
      }
      const data = await response.json();

      if (!response.ok) {
        throw new Error(specificError(data) || "Error while deleting API key.");
      }

      updateUser({ ...user, hasGeminiKey: false });
      setAiKey("");
      setAiMessage({ type: "success", text: "API Key removed successfully!" });
    } catch (err) {
      setAiMessage({ type: "danger", text: err.message });
    } finally {
      setIsAiLoading(false);
    }
  };
  return (
    <BaseLayout>
      <Container className="py-5">
        <h2 className="settings-page-title mb-4">Account Settings</h2>

        <Tab.Container id="settings-tabs" defaultActiveKey="security">
          <Row>
            <Col lg={3} className="mb-4 mb-lg-0">
              <Nav
                variant="pills"
                className="flex-row flex-lg-column flex-nowrap overflow-auto settings-sidebar gap-2"
              >
                <Nav.Item>
                  <Nav.Link
                    eventKey="security"
                    className="d-flex align-items-center gap-2 text-nowrap flex-shrink-0"
                  >
                    <ShieldAlert size={18} /> Security
                  </Nav.Link>
                </Nav.Item>

                <Nav.Item>
                  <Nav.Link
                    eventKey="account"
                    className="d-flex align-items-center gap-2 text-nowrap flex-shrink-0"
                  >
                    <User size={18} /> Account
                  </Nav.Link>
                </Nav.Item>

                <Nav.Item>
                  <Nav.Link
                    eventKey="ai"
                    className="d-flex align-items-center gap-2 text-nowrap flex-shrink-0"
                  >
                    <Sparkles size={18} /> AI Integrations
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Col>

            <Col lg={9}>
              <Tab.Content className="settings-content-card">
                <Tab.Pane eventKey="security">
                  {!isOauth ? (
                    <>
                      <div className="mb-4">
                        <h4 className="settings-section-title mb-2">
                          Change Password
                        </h4>
                        <p className="settings-section-desc mb-0">
                          Ensure your account is using a long, random password
                          to stay secure.
                        </p>
                      </div>
                      <form
                        onSubmit={handlePasswordSubmit}
                        className="d-flex flex-column gap-3 max-w-md"
                      >
                        <div className="form-group">
                          <label
                            htmlFor="oldPassword"
                            className="settings-label"
                          >
                            <Lock size={14} /> Current Password
                          </label>
                          <input
                            type="password"
                            id="oldPassword"
                            name="oldPassword"
                            className="settings-input"
                            placeholder="Enter current password"
                            value={passwordData.oldPassword}
                            onChange={handlePasswordChange}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label
                            htmlFor="newPassword"
                            className="settings-label"
                          >
                            <KeyRound size={14} /> New Password
                          </label>
                          <input
                            type="password"
                            id="newPassword"
                            name="newPassword"
                            className="settings-input"
                            placeholder="Min. 8 characters"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label
                            htmlFor="confirmPassword"
                            className="settings-label"
                          >
                            <KeyRound size={14} /> Confirm New Password
                          </label>
                          <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            className="settings-input"
                            placeholder="Repeat new password"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            required
                          />
                        </div>

                        {passwordMessage.text && (
                          <div className="mt-2">
                            <CustomAlert
                              text={passwordMessage.text}
                              type={passwordMessage.type}
                            />
                          </div>
                        )}

                        <div className="mt-3">
                          <MyButton
                            type="submit"
                            disabled={isPasswordLoading}
                            className="px-4"
                          >
                            {isPasswordLoading
                              ? "Updating..."
                              : "Update Password"}
                          </MyButton>
                        </div>
                      </form>
                    </>
                  ) : (
                    <div className="oauth-info-box">
                      <div className="oauth-icon-wrapper">
                        <ShieldAlert size={48} />
                      </div>
                      <h4 className="settings-section-title mb-3">
                        External Safety Management
                      </h4>
                      <p className="settings-section-desc mb-0 max-w-md mx-auto">
                        Your account is linked via an OAuth provider. For
                        security reasons, your credentials are managed directly
                        by the originating platform. No local password is stored
                        on our servers.
                      </p>
                    </div>
                  )}
                </Tab.Pane>

                <Tab.Pane eventKey="account">
                  <div className="mb-4">
                    <h4 className="settings-section-title mb-2">
                      Account Settings
                    </h4>
                    <p className="settings-section-desc mb-0">
                      Update your avatar and personal details here.
                    </p>
                  </div>

                  <div className="mb-5">
                    <h5 className="settings-section-title mb-3">
                      Change Nickname
                    </h5>
                    <form
                      onSubmit={handleUsernameSubmit}
                      className="d-flex flex-column gap-3 max-w-md"
                    >
                      <div className="form-group">
                        <label
                          htmlFor="usernameUpdate"
                          className="settings-label"
                        >
                          <User size={14} /> Nickname
                        </label>
                        <input
                          type="text"
                          id="usernameUpdate"
                          name="username"
                          className="settings-input"
                          placeholder={user?.username || "Enter new nickname"}
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                          minLength={3}
                        />
                      </div>

                      {usernameMessage.text && (
                        <div className="mt-2">
                          <CustomAlert
                            text={usernameMessage.text}
                            type={usernameMessage.type}
                          />
                        </div>
                      )}

                      <div className="mt-2">
                        <MyButton
                          type="submit"
                          disabled={isUsernameLoading}
                          className="px-4"
                        >
                          {isUsernameLoading
                            ? "Updating..."
                            : "Update Nickname"}
                        </MyButton>
                      </div>
                    </form>
                  </div>

                  <hr className="my-5 settings-divider" />

                  <div className="mb-4">
                    <h5 className="settings-section-title mb-3">
                      Profile Picture
                    </h5>
                    <form
                      onSubmit={handleAvatarSubmit}
                      className="d-flex flex-column gap-3 max-w-md"
                    >
                      <div className="form-group">
                        <label
                          htmlFor="avatarUpload"
                          className="settings-input settings-file-upload-label d-flex align-items-center justify-content-center"
                        >
                          {avatarFile
                            ? avatarFile.name
                            : "Click to choose an image 📸"}
                        </label>
                        <input
                          type="file"
                          id="avatarUpload"
                          accept="image/jpeg, image/png, image/webp"
                          className="d-none"
                          onChange={handleFileChange}
                        />
                      </div>

                      {avatarMessage.text && (
                        <div className="mt-2">
                          <CustomAlert
                            text={avatarMessage.text}
                            type={avatarMessage.type}
                          />
                        </div>
                      )}

                      <div className="mt-3">
                        <MyButton
                          type="submit"
                          disabled={isAvatarLoading || !avatarFile}
                          className="px-4"
                        >
                          {isAvatarLoading ? "Uploading..." : "Upload Avatar"}
                        </MyButton>
                      </div>
                    </form>
                  </div>

                  <hr className="my-5 settings-divider" />

                  <div className="danger-zone-box">
                    <div className="d-flex align-items-start gap-3 mb-3">
                      <div className="danger-icon-wrapper flex-shrink-0">
                        <ShieldAlert size={22} />
                      </div>
                      <div>
                        <h5 className="danger-zone-title mb-1">
                          Delete Account
                        </h5>
                        <p className="danger-zone-desc mb-0">
                          This action is permanent and cannot be undone. All
                          your snippets, comments, and stars will be permanently
                          deleted. Snippets forked from your posts will remain,
                          but will lose their reference to you as the original
                          author.
                        </p>
                      </div>
                    </div>

                    <form
                      onSubmit={handleDeleteAccount}
                      className="d-flex flex-column flex-md-row gap-2 align-items-stretch align-items-md-center"
                    >
                      <input
                        type="text"
                        className="settings-input danger-zone-input"
                        placeholder={`Type "${user?.username}" to confirm`}
                        value={deleteConfirmInput}
                        onChange={(e) => setDeleteConfirmInput(e.target.value)}
                        aria-label="Type your username to confirm account deletion"
                      />
                      <MyButton
                        type="submit"
                        className="btn-danger-custom flex-shrink-0"
                        disabled={
                          isDeleteLoading ||
                          deleteConfirmInput !== user?.username
                        }
                      >
                        <Trash2 size={16} />
                        {isDeleteLoading ? "Deleting..." : "Delete My Account"}
                      </MyButton>
                    </form>

                    {deleteMessage.text && (
                      <div className="mt-3">
                        <CustomAlert
                          text={deleteMessage.text}
                          type={deleteMessage.type}
                        />
                      </div>
                    )}
                  </div>
                </Tab.Pane>

                <Tab.Pane eventKey="ai">
                  <h4 className="settings-section-title mb-2">
                    Gemini AI Configuration
                  </h4>
                  <p className="settings-section-desc mb-4">
                    Set your personal API Key to enable AI features.
                  </p>

                  <form
                    onSubmit={handleAiSubmit}
                    className="d-flex flex-column gap-3 max-w-md"
                  >
                    <div className="form-group">
                      <label htmlFor="aiKey" className="settings-label">
                        <KeyRound size={14} /> Gemini API Key
                      </label>
                      <input
                        type="password"
                        id="aiKey"
                        className="settings-input"
                        placeholder={
                          user?.hasGeminiKey
                            ? "••••••••••••"
                            : "Enter your API Key"
                        }
                        value={aiKey}
                        onChange={(e) => setAiKey(e.target.value)}
                        aria-label="Gemini API Key"
                      />
                    </div>

                    <div className="d-flex gap-2">
                      <MyButton type="submit" disabled={isAiLoading}>
                        {isAiLoading ? "Saving..." : "Save Key"}
                      </MyButton>

                      {user?.hasGeminiKey && (
                        <MyButton
                          type="button"
                          className="btn-danger-custom"
                          onClick={handleAiDelete}
                          disabled={isAiLoading}
                        >
                          <Trash2 size={16} /> Remove Key
                        </MyButton>
                      )}
                    </div>
                  </form>

                  {aiMessage.text && (
                    <div className="mt-3">
                      <CustomAlert
                        text={aiMessage.text}
                        type={aiMessage.type}
                      />
                    </div>
                  )}
                </Tab.Pane>
              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>
      </Container>
    </BaseLayout>
  );
};

export default SettingsPage;
