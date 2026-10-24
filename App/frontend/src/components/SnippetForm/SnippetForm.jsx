import { useState, useEffect, useContext } from "react";
import {
  Code2,
  Type,
  FileText,
  Tag,
  X,
  Wand2,
  AlertTriangle,
} from "lucide-react";
import MyButton from "../MyButton/MyButton";
import {
  MyCard,
  MyCardContent,
  MyCardHeader,
  MyCardTitle,
} from "../MyCard/MyCard";
import GeminiBtn from "../GeminiBtn/GeminiBtn";
import "./SnippetForm.css";
import prettier from "prettier/standalone";
import parserBabel from "prettier/plugins/babel";
import parserEstree from "prettier/plugins/estree";
import parserHtml from "prettier/plugins/html";
import parserPostcss from "prettier/plugins/postcss";
import markdown from "prettier/plugins/markdown";
import yaml from "prettier/plugins/yaml";
import ReactMarkdown from "react-markdown";
import { AuthContext } from "../../context/AuthContext/AuthContext";
import CustomAlert from "../CustomAlert/CustomAlert";
import {
  GEMINI_MODELS,
  DEFAULT_GEMINI_MODEL,
} from "../../constants/geminiModels";

const SUPPORTED_LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "jsx", label: "JSX" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "markdown", label: "Markdown" },
  { value: "yaml", label: "YAML" },
  { value: "python", label: "Python" },
  { value: "sql", label: "SQL" },
  { value: "shell", label: "Shell" },
];

const PRETTIER_CONFIGS = {
  javascript: { parser: "babel", plugins: [parserBabel, parserEstree] },
  typescript: { parser: "babel-ts", plugins: [parserBabel, parserEstree] },
  jsx: { parser: "babel", plugins: [parserBabel, parserEstree] },
  json: { parser: "json", plugins: [parserBabel, parserEstree] },
  html: { parser: "html", plugins: [parserHtml] },
  css: { parser: "css", plugins: [parserPostcss] },
  markdown: { parser: "markdown", plugins: [markdown] },
  yaml: { parser: "yaml", plugins: [yaml] },
};
const INITIAL_FORM_STATE = {
  title: "",
  description: "",
  code_content: "",
  language: "javascript",
  tags: "",
  is_ai_generated: false,
};

const SnippetForm = ({
  initialData = null,
  onSubmit,
  isLoading = false,
  onCancel,
}) => {
  const isEditing = !!initialData;

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  const isFormatSupported = Boolean(PRETTIER_CONFIGS[formData.language]);
  const [prettierError, setPrettierError] = useState(null);
  const [isGeneratingWithGemini, setIsGeneratingWithGemini] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [alert, setAlert] = useState({ text: null, type: null });
  const { logoutUser } = useContext(AuthContext);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_GEMINI_MODEL);

  useEffect(() => {
    if (initialData) {
      const {
        title,
        description,
        code_content,
        language,
        tags,
        is_ai_generated,
      } = initialData;
      setFormData({
        title: title || "",
        description: description || "",
        code_content: code_content || "",
        language: language || "javascript",
        tags: Array.isArray(tags) ? tags.join(", ") : tags || "",
        is_ai_generated: is_ai_generated || false,
      });
    } else {
      setFormData(INITIAL_FORM_STATE);
      setPrettierError(null);
    }
  }, [initialData]);

  const switchPreviwMode = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "code_content" || name === "language") {
      setPrettierError(null);
      setAlert({ text: null, type: null });
    }
  };

  const handleGeminiGeneration = async () => {
    const { description, language } = formData;
    if (!description.trim() || !language.trim()) {
      setAlert({
        type: "danger",
        text: "Fill in Description and Language before generating the code.",
      });
      return;
    }
    setIsGeneratingWithGemini(true);
    setAlert({ type: null, text: null });

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_APP_SERVERURL}/ai/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ description, language, model: selectedModel }),
        },
      );

      if (response.status === 401) {
        logoutUser();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        let displayMessage = errorData.message;

        if (response.status === 429) {
          displayMessage =
            "You've reached the limit of 5 AI requests per minute on this app. Please wait a moment and try again.";
        }
        if (response.status === 503) {
          displayMessage =
            "The Gemini API quota has been exceeded (external service limit). Please try again later.";
        }
        if (response.status === 502) {
          displayMessage =
            "The AI service is temporarily unavailable. Please try again later.";
        }

        setAlert({ type: "danger", text: displayMessage });

        return;
      }

      const data = await response.json();

      setFormData((prev) => ({
        ...prev,
        code_content: data.generatedCode,
        is_ai_generated: true,
      }));
      setPrettierError(null);
    } catch (error) {
      setAlert({ type: "danger", text: "Connection error. Please try again." });
    } finally {
      setIsGeneratingWithGemini(false);
    }
  };

  const cleanTagsString = (tagsString) => {
    if (!tagsString) return [];

    return tagsString
      .replaceAll("#", "")
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0);
  };

  const formatCode = async (code, language) => {
    const config = PRETTIER_CONFIGS[language];
    if (!config) {
      setPrettierError(null);
      return code;
    }

    try {
      const formatted = await prettier.format(code, {
        parser: config.parser,
        plugins: config.plugins,
        semi: true,
        singleQuote: true,
        tabWidth: 2,
      });
      setPrettierError(null);
      return formatted;
    } catch (err) {
      console.warn(
        "Prettier could not format the code (likely syntax error):",
        err,
      );
      const shortErrorMessage = err.message
        ? err.message.split("\n")[0]
        : "Syntax error in code.";

      setPrettierError(shortErrorMessage);
      return code;
    }
  };

  const handleManualFormat = async () => {
    if (!formData.code_content.trim()) return;

    const formatted = await formatCode(
      formData.code_content,
      formData.language,
    );

    setFormData((prev) => ({
      ...prev,
      code_content: formatted,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formattedCode = isFormatSupported
      ? await formatCode(formData.code_content, formData.language)
      : formData.code_content;

    const finalData = {
      ...formData,
      code_content: formattedCode,
      tags: cleanTagsString(formData.tags),
    };

    onSubmit(finalData);
  };
  return (
    <MyCard className="snippet-form-card">
      <MyCardHeader>
        <div className="d-flex align-items-center justify-content-between w-100">
          <MyCardTitle className="d-flex align-items-center gap-2 m-0">
            <Code2 size={20} className="form-title-icon" />
            {isEditing ? "Edit Snippet" : "Create New Snippet"}
          </MyCardTitle>

          {onCancel && (
            <button
              type="button"
              className="close-modal-btn"
              onClick={onCancel}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </MyCardHeader>

      <MyCardContent>
        {alert.text && (
          <div className="mb-2">
            <CustomAlert text={alert.text} type={alert.type} />
          </div>
        )}
        <form onSubmit={handleSubmit} className="d-flex flex-column gap-4">
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              <Type size={14} />
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              className="form-input"
              placeholder="e.g., Reboot device command"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <label htmlFor="description" className="form-label mb-0">
                <FileText size={14} /> Description
              </label>

              <div className="segmented-control">
                <button
                  type="button"
                  className={`segment-btn ${!isPreviewMode ? "active" : ""}`}
                  onClick={() => setIsPreviewMode(false)}
                >
                  Write
                </button>
                <button
                  type="button"
                  className={`segment-btn ${isPreviewMode ? "active" : ""}`}
                  onClick={() => setIsPreviewMode(true)}
                >
                  Preview
                </button>
              </div>
            </div>

            {!isPreviewMode ? (
              <textarea
                id="description"
                name="description"
                className="form-textarea"
                placeholder="Briefly describe what this snippet does... (Markdown supported)"
                value={formData.description}
                onChange={handleChange}
                required
              />
            ) : (
              <div className="form-textarea markdown-preview-box markdown-content">
                {formData.description.trim() ? (
                  <ReactMarkdown>{formData.description}</ReactMarkdown>
                ) : (
                  <span className="text-muted fst-italic">
                    Nothing to preview yet...
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="language" className="form-label">
              <Code2 size={14} />
              language
            </label>
            <select
              id="language"
              name="language"
              className="form-select"
              value={formData.language}
              onChange={handleChange}
            >
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSupported = !!PRETTIER_CONFIGS[lang.value];
                return (
                  <option key={lang.value} value={lang.value}>
                    {lang.label} {isSupported ? "✨" : ""}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="form-group">
            <div className="d-flex flex-wrap align-items-center justify-content-between mb-1 gap-2">
              <label htmlFor="code" className="form-label mb-0">
                <Code2 size={14} /> Code Snippet
              </label>

              <div className="d-flex flex-wrap align-items-center gap-2">
                <select
                  className="gemini-model-select"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={isGeneratingWithGemini}
                  aria-label="Select Gemini model"
                >
                  {GEMINI_MODELS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleManualFormat}
                  disabled={!isFormatSupported}
                  className="format-btn"
                  title={
                    isFormatSupported
                      ? "Format Code"
                      : "Auto-formatting not supported for this language"
                  }
                >
                  <Wand2 size={14} /> Format
                </button>

                <GeminiBtn
                  onClick={handleGeminiGeneration}
                  disabled={isLoading || isGeneratingWithGemini}
                  isLoading={isGeneratingWithGemini}
                />
              </div>
            </div>
            <textarea
              id="code"
              name="code_content"
              className="form-textarea code-textarea"
              placeholder="// Paste or write your code here..."
              value={formData.code_content}
              onChange={handleChange}
              required
            />

            {prettierError && (
              <div className="prettier-error-notice">
                <AlertTriangle size={14} />
                <span>{prettierError}</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="tags" className="form-label">
              <Tag size={14} /> Tags (comma separated)
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              className="form-input"
              placeholder="e.g., react, backend, android"
              value={formData.tags}
              onChange={handleChange}
            />
          </div>

          {formData.is_ai_generated && (
            <div className="ai-generated-notice">
              ✨ This code was generated by AI
            </div>
          )}
          <div className="d-flex justify-content-end gap-2 mt-2">
            {onCancel && (
              <MyButton
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="cancel-btn"
              >
                Cancel
              </MyButton>
            )}
            <MyButton
              type="submit"
              disabled={isLoading || isGeneratingWithGemini}
              className="px-4"
            >
              {isLoading
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Create Snippet"}
            </MyButton>
          </div>
        </form>
      </MyCardContent>
    </MyCard>
  );
};

export default SnippetForm;
