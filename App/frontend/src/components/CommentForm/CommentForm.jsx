import { useState } from "react";
import MyButton from "../MyButton/MyButton";
import "./CommentForm.css";

const CommentForm = ({
  initialText = "",
  onSubmit,
  onCancel,
  submitLabel = "Comment",
  loadingLabel = "Sending...",
}) => {
  const [text, setText] = useState(initialText);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedText = text.trim();
    if (!trimmedText) return;

    setIsSubmitting(true);

    try {
      await onSubmit(trimmedText);
      setText("");
    } catch (error) {
      setValidationError(
        error.message || "Unable to save the comment. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <textarea
        className="form-textarea comment-input"
        placeholder="Write a comment.."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isSubmitting}
      />

      {validationError && (
        <div className="comment-error">{validationError}</div>
      )}

      <div className="form-actions">
        {onCancel && (
          <MyButton
            type="button"
            onClick={() => {
              onCancel();
              setValidationError(null);
            }}
            disabled={isSubmitting}
          >
            Cancel
          </MyButton>
        )}
        <MyButton type="submit" disabled={isSubmitting || !text.trim()}>
          {isSubmitting ? loadingLabel : submitLabel}
        </MyButton>
      </div>
    </form>
  );
};

export default CommentForm;
