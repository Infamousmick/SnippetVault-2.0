import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import CustomAlert from "../CustomAlert/CustomAlert";
import { useGeminiModels } from "../../hooks/useGeminiModels";
import {
  askAboutSnippet,
  getAiErrorMessage,
} from "../../services/aiService";
import "./GeminiChatBox.css";

const GeminiChatBox = ({ snippetId, onClose }) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ text: null, type: null });
  const answerRef = useRef(null);
  const { models: geminiModels, defaultModel } = useGeminiModels();
  const [chosenModel, setChosenModel] = useState(null);
  const selectedModel = chosenModel ?? defaultModel;

  useEffect(() => {
    if (answer && answerRef.current) {
      answerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [answer]);

  const handleAsk = async (e) => {
    e.preventDefault();

    if (!question.trim()) {
      setAlert({ type: "danger", text: "Write a question before asking." });
      return;
    }

    setIsLoading(true);
    setAlert({ type: null, text: null });
    setAnswer(null);

    try {
      const text = await askAboutSnippet(snippetId, question, selectedModel);
      setAnswer(text);
    } catch (error) {
      console.error(error);
      setAlert({ type: "danger", text: getAiErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="gemini-chatbox">
      <div className="gemini-chatbox-header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div className="d-flex align-items-center gap-2">
          <Sparkles size={16} className="gemini-chatbox-icon" />
          <span className="gemini-chatbox-title">
            Ask Gemini about this snippet
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <select
            className="gemini-model-select gemini-chatbox-model-select"
            value={selectedModel}
            onChange={(e) => setChosenModel(e.target.value)}
            disabled={isLoading}
            aria-label="Select Gemini model"
          >
            {geminiModels.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="gemini-chatbox-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {alert.text && (
        <div className="mt-2">
          <CustomAlert text={alert.text} type={alert.type} />
        </div>
      )}

      <form onSubmit={handleAsk} className="d-flex gap-2 mt-3">
        <input
          type="text"
          aria-label="Ask to Gemini"
          className="gemini-chatbox-input flex-grow-1"
          placeholder="e.g., What does this function do?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={isLoading}
          maxLength={500}
        />
        <button
          type="submit"
          className="gemini-chatbox-send-btn d-flex align-items-center justify-content-center"
          disabled={isLoading}
          aria-label="Ask"
        >
          {isLoading ? <span className="gemini-spinner" /> : <Send size={16} />}
        </button>
      </form>

      {answer && (
        <div
          ref={answerRef}
          className="gemini-chatbox-answer markdown-content mt-3"
        >
          <ReactMarkdown>{answer}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default GeminiChatBox;