import "./GeminiBtn.css";
import { Sparkles } from "lucide-react";

const GeminiBtn = ({ onClick, disabled = false, isLoading = false }) => {
  return (
    <button
      type="button"
      className="gemini-btn d-flex align-items-center gap-1"
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      <Sparkles size={16} />
      <span>{isLoading ? "Generating..." : "Gemini AI Assist"}</span>
    </button>
  );
};

export default GeminiBtn;
