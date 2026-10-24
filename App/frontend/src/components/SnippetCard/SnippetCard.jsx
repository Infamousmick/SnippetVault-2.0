import {
  Star,
  MessageSquare,
  GitFork,
  Copy,
  Check,
  Sparkles,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  MyCard,
  MyCardHeader,
  MyCardTitle,
  MyCardDescription,
  MyCardContent,
  MyCardFooter,
} from "../MyCard/MyCard";
import "./SnippetCard.css";
import GeminiBtn from "../GeminiBtn/GeminiBtn";
import { AuthContext } from "../../context/AuthContext/AuthContext";
import { SnippetContext } from "../../context/SnippetContext/SnippetContext";
import ReactMarkdown from "react-markdown";
import CommentSection from "../CommentSection/CommentSection";
import GeminiChatBox from "../GeminiChatBox/GeminiChatBox";
import CustomAlert from "../CustomAlert/CustomAlert";

const countItems = (value) => {
  if (Array.isArray(value)) return value.length;

  return 0;
};

const SnippetCard = ({
  snippet,
  onToggleStar,
  onDeleteSuccess,
  onEditSuccess,
}) => {
  const { user } = useContext(AuthContext);
  const {
    handleDeleteSnippet,
    openModal,
    handleToggleStar,
    handleForkSnippet,
  } = useContext(SnippetContext);
  const [isCopied, setisCopied] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const data = snippet || {};
  const [localCommentsCount, setLocalCommentsCount] = useState(
    countItems(data.comments),
  );
  const [isAiOpen, setIsAiOpen] = useState(false);

  const username = data.user_id?.username ?? "Guest";
  const avatar_url = data.user_id?.avatar_url ?? "https://placehold.co/32";
  const title = data.title ?? "Untitled Snippet";
  const description = data.description ?? "";
  const language = data.language ?? "text";
  const languageDisplay = language.toUpperCase();
  const code =
    typeof data.code_content === "string"
      ? data.code_content.replace(/\r\n/g, "\n")
      : "";
  const isAiGenerated = data.is_ai_generated;
  const tags = Array.isArray(data.tags) ? data.tags : [];
  const starsCount = data.starsCount;
  const forksCount = data.forksCount;
  const hasForked = user && data.forks?.includes(user._id);
  const [forkAlert, setForkAlert] = useState({ type: null, text: null });

  const handleFork = async () => {
    setForkAlert({ type: null, text: null });

    try {
      const newForkedSnippet = await handleForkSnippet(data._id);
      if (newForkedSnippet) {
        openModal(newForkedSnippet);
      }
    } catch (error) {
      setForkAlert({
        type: "danger",
        text: error.message || "Failed to fork snippet.",
      });
      setTimeout(() => setForkAlert({ type: null, text: null }), 5000);
    }
  };
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setisCopied(true);
    setTimeout(() => setisCopied(false), 2000);
  };

  const handleEdit = () => {
    openModal(data, onEditSuccess);
  };

  const handleDelete = async () => {
    const isConfirmed = window.confirm("Are you sure to delete this snippet?");
    if (!isConfirmed) return;

    const success = await handleDeleteSnippet(data._id);
    if (success && onDeleteSuccess) {
      onDeleteSuccess(data._id);
    }
  };

  const isMySnippet = user && user._id === data.user_id?._id;
  const hasStarred = user && data.stars?.includes(user._id);

  return (
    <MyCard className="mb-4">
      <MyCardHeader>
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start mb-3 gap-3">
          <Link
            to={`/profile/${data.user_id?._id}`}
            className="d-flex align-items-center gap-2 author-profile-link"
          >
            <img src={avatar_url} alt={username} className="author-avatar" />
            <div className="d-flex flex-column">
              <span className="author-name">{username}</span>
              <span className="author-handle">
                {data.createdAt
                  ? new Date(data.createdAt).toLocaleDateString()
                  : "Just now"}
              </span>
            </div>
          </Link>

          <div className="d-flex align-items-center gap-3 align-self-start align-self-sm-center mt-2 mt-sm-0">
            {isAiGenerated && (
              <div className="ai-generated-badge d-flex align-items-center gap-1">
                <Sparkles size={12} />
                <span>AI Generated</span>
              </div>
            )}

            {isMySnippet && (
              <div className="d-flex gap-2">
                <button
                  className="stat-btn edit-btn d-flex align-items-center justify-content-center p-1"
                  onClick={handleEdit}
                  title="Edit Snippet"
                >
                  <Pencil size={18} className="action-icon" />
                </button>
                <button
                  className="stat-btn delete-btn d-flex align-items-center justify-content-center p-1"
                  onClick={handleDelete}
                  title="Delete Snippet"
                >
                  <Trash2 size={18} className="action-icon" />
                </button>
              </div>
            )}
          </div>
        </div>
        {data.forked_from && (
          <div className="forked-from-notice mb-2">
            <GitFork
              size={14}
              className="d-inline-block align-text-bottom me-1"
            />
            <span>
              Forked from{" "}
              <Link
                to={`/profile/${data.forked_from.user_id?._id}`}
                className="forked-from-link"
              >
                {data.forked_from.user_id?.username ?? "Unknown user"}
              </Link>
              {data.forked_from.title && (
                <>
                  <span className="mx-1">·</span>
                  <span className="forked-from-title">
                    {data.forked_from.title}
                  </span>
                </>
              )}
            </span>
          </div>
        )}
        <MyCardTitle>{title}</MyCardTitle>
        <div className="my-card-description markdown-content">
          <ReactMarkdown>{description}</ReactMarkdown>
        </div>
      </MyCardHeader>

      <MyCardContent>
        <div className="code-block-wrapper mb-3">
          <div className="code-block-header d-flex align-items-center justify-content-between px-3 py-2">
            <div className="d-flex gap-2">
              <span className="mac-dot mac-red"></span>
              <span className="mac-dot mac-yellow"></span>
              <span className="mac-dot mac-green"></span>
            </div>
            <span className="code-language text-uppercase">
              {languageDisplay}
            </span>
          </div>
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: "1rem",
              backgroundColor: "transparent",
              fontSize: "0.875rem",
              maxHeight: "280px",
              overflowY: "auto",
            }}
          >
            {code}
          </SyntaxHighlighter>
        </div>

        <div className="d-flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span key={index} className="snippet-tag">
              #{tag}
            </span>
          ))}
        </div>
      </MyCardContent>

      {forkAlert.text && (
        <div className="px-3 pb-2">
          <CustomAlert type={forkAlert.type} text={forkAlert.text} />
        </div>
      )}
      <MyCardFooter className="gap-3 flex-wrap justify-content-between">
        <div className="d-flex gap-2 flex-wrap">
          <button
            className={`stat-btn ${hasStarred ? "active-star" : ""} d-flex align-items-center gap-1`}
            onClick={() =>
              onToggleStar
                ? onToggleStar(data._id, user._id)
                : handleToggleStar(data._id, user._id)
            }
          >
            <Star size={16} className="stat-icon" />
            <span>{starsCount}</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className={`stat-btn d-flex align-items-center gap-1 ${showComments ? "active-comment-btn" : ""}`}
          >
            <MessageSquare size={16} className="stat-icon" />
            <span>{localCommentsCount}</span>
          </button>
          <button
            className={`stat-btn ${hasForked ? "active-fork" : ""} d-flex align-items-center gap-1`}
            onClick={handleFork}
            disabled={isMySnippet || hasForked}
            title={
              isMySnippet
                ? "You cannot fork your own snippet"
                : hasForked
                  ? "Already forked"
                  : "Fork this snippet"
            }
          >
            <GitFork size={16} className="stat-icon" />
            <span>{forksCount}</span>
          </button>
        </div>

        <div className="d-flex gap-2 align-content-center flex-wrap">
          <button
            className="stat-btn d-flex align-items-center gap-1 copy-btn"
            onClick={handleCopy}
          >
            {isCopied ? (
              <Check size={16} className="text-success" />
            ) : (
              <Copy size={16} className="stat-icon" />
            )}
            <span>{isCopied ? "Copied" : "Copy"}</span>
          </button>
          <GeminiBtn onClick={() => setIsAiOpen(!isAiOpen)} />
        </div>
      </MyCardFooter>
      {isAiOpen && (
        <div className="snippet-ai-wrapper">
          <GeminiChatBox
            snippetId={data._id}
            onClose={() => setIsAiOpen(false)}
          />
        </div>
      )}
      {showComments && (
        <div className="snippet-comments-wrapper">
          <CommentSection
            snippetId={data._id}
            onCountChange={(newCount) => setLocalCommentsCount(newCount)}
          />
        </div>
      )}
    </MyCard>
  );
};
export default SnippetCard;
