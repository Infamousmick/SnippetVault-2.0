import { useState, useEffect, useContext } from "react";
import "./CommentSection.css";
import CommentForm from "../CommentForm/CommentForm";
import CommentItem from "../CommentItem/CommentItem";
import { AuthContext } from "../../context/AuthContext/AuthContext";
import CustomAlert from "../CustomAlert/CustomAlert";
import * as snippetsService from "../../services/snippetsService";

const CommentSection = ({ snippetId, onCountChange }) => {
  const { user } = useContext(AuthContext);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState({ text: null, type: null });

  const getCommentUserId = (comment) => {
    return typeof comment.user_id === "object"
      ? comment.user_id?._id
      : comment.user_id;
  };

  // I commenti appena creati/modificati sono sempre dell'utente corrente:
  // gli attacco i suoi dati (nome e avatar) al posto del solo id.
  const addCurrentUserData = (comment) => {
    if (!comment) return comment;
    if (!user || getCommentUserId(comment) !== user._id) return comment;

    return {
      ...comment,
      user_id: {
        _id: user._id,
        username: user.username,
        avatar_url: user.avatar_url ?? user.avatar ?? "https://placehold.co/150",
      },
    };
  };

  const handleCreateComment = async (body) => {
    try {
      setAlert({ text: null, type: null });
      const newComment = await snippetsService.createComment(
        snippetId,
        body,
        user._id,
      );
      setComments((prevComments) => [
        ...prevComments,
        addCurrentUserData(newComment),
      ]);
    } catch (error) {
      console.error(error);
      setAlert({
        text: snippetsService.getFirestoreErrorMessage(
          error,
          "Unable to send the comment.",
        ),
        type: "danger",
      });
    }
  };

  const handleDeleteComment = async (commentId) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this comment?",
    );
    if (!isConfirmed) return;

    try {
      setAlert({ text: null, type: null });
      await snippetsService.deleteComment(snippetId, commentId);
      setComments((prevComments) =>
        prevComments.filter((c) => c._id !== commentId),
      );
    } catch (error) {
      console.error(error);
      setAlert({
        text: snippetsService.getFirestoreErrorMessage(
          error,
          "Unable to delete the comment.",
        ),
        type: "danger",
      });
    }
  };

  const handleEditComment = async (commentId, newBody) => {
    try {
      setAlert({ text: null, type: null });
      const updatedComment = await snippetsService.editComment(
        snippetId,
        commentId,
        newBody,
      );

      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment._id === commentId
            ? addCurrentUserData({ ...comment, ...updatedComment })
            : comment,
        ),
      );
    } catch (error) {
      console.error(error);
      setAlert({
        text: snippetsService.getFirestoreErrorMessage(
          error,
          "Unable to edit the comment.",
        ),
        type: "danger",
      });
    }
  };

  useEffect(() => {
    const getComments = async () => {
      try {
        const data = await snippetsService.listComments(snippetId);
        setComments(data);
      } catch (error) {
        console.error(error);
        setAlert({
          text: snippetsService.getFirestoreErrorMessage(
            error,
            "Unable to retrieve the comments.",
          ),
          type: "danger",
        });
      } finally {
        setIsLoading(false);
      }
    };
    getComments();
  }, [snippetId]);

  useEffect(() => {
    if (onCountChange && !isLoading) {
      onCountChange(comments.length);
    }
  }, [comments, onCountChange, isLoading]);

  return (
    <div className="comment-section-container mt-3 pt-3 border-top-subtle">
      <div className="comment-form-wrapper">
        <CommentForm onSubmit={handleCreateComment} />
      </div>

      {alert.text && (
        <div className="mb-2">
          <CustomAlert
            text={alert.text}
            type={alert.type}
            onClose={() => setAlert({ text: null, type: null })}
          />
        </div>
      )}

      <div className="comments-list d-flex flex-column gap-3">
        {isLoading && (
          <div className="comment-status-message">Loading comments..</div>
        )}
        {!isLoading &&
          comments.length > 0 &&
          comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              onDelete={handleDeleteComment}
              onEdit={handleEditComment}
            />
          ))}
        {!isLoading && comments.length === 0 && (
          <div className="comment-status-message empty-state">
            No comments. Be the first to comment!
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;