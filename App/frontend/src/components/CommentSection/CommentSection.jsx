import { useState, useEffect, useContext } from "react";
import "./CommentSection.css";
import CommentForm from "../CommentForm/CommentForm";
import CommentItem from "../CommentItem/CommentItem";
import { AuthContext } from "../../context/AuthContext/AuthContext";
import CustomAlert from "../CustomAlert/CustomAlert";

const CommentSection = ({ snippetId, onCountChange }) => {
  const { logoutUser, user } = useContext(AuthContext);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState({ text: null, type: null });

  const getCommentUserId = (comment) => {
    return typeof comment.user_id === "object"
      ? comment.user_id?._id
      : comment.user_id;
  };

  const addCurrentUserData = (comment) => {
    if (!comment) return comment;
    if (!user || getCommentUserId(comment) !== user._id) return comment;

    return {
      ...comment,
      user_id: {
        ...user,
        _id: user._id,
      },
    };
  };

  const getResponseData = async (response) => {
    try {
      return await response.json();
    } catch {
      return null;
    }
  };

  const getResponseErrorMessage = (responseData, fallbackMessage) => {
    if (responseData?.errors && Array.isArray(responseData.errors)) {
      return responseData.errors.map((err) => err.message).join(" | ");
    }
    return responseData?.message || fallbackMessage;
  };

  const handleCreateComment = async (body) => {
    try {
      setAlert({ text: null, type: null });
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_APP_SERVERURL}/snippets/${snippetId}/comments`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ body }),
        },
      );

      const responseData = await getResponseData(response);

      if (!response.ok) {
        throw new Error(
          getResponseErrorMessage(responseData, "Unable to send the comment."),
        );
      }

      if (!responseData?.newComment) {
        throw new Error("Unable to read the saved comment.");
      }

      setComments((prevComments) => [
        ...prevComments,
        addCurrentUserData(responseData.newComment),
      ]);
    } catch (error) {
      setAlert({ text: error.message, type: "danger" });
    }
  };

  const handleDeleteComment = async (commentId) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this comment?",
    );
    if (!isConfirmed) return;

    try {
      setAlert({ text: null, type: null });
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_APP_SERVERURL}/snippets/${snippetId}/comments/${commentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const responseData = await getResponseData(response);
        throw new Error(
          getResponseErrorMessage(
            responseData,
            "Unable to delete the comment.",
          ),
        );
      }

      setComments((prevComments) =>
        prevComments.filter((c) => c._id !== commentId),
      );
    } catch (error) {
      console.error(error);
      setAlert({ text: error.message, type: "danger" });
    }
  };

  const handleEditComment = async (commentId, newBody) => {
    try {
      setAlert({ text: null, type: null });
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_APP_SERVERURL}/snippets/${snippetId}/comments/${commentId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ body: newBody }),
        },
      );

      const responseData = await getResponseData(response);

      if (!response.ok) {
        throw new Error(
          getResponseErrorMessage(responseData, "Unable to edit the comment."),
        );
      }

      const updatedComment =
        responseData?.editedComment ||
        responseData?.updatedComment ||
        responseData?.comment ||
        responseData;

      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment._id === commentId
            ? addCurrentUserData({
                ...comment,
                ...updatedComment,
                body: updatedComment?.body || newBody,
                user_id: updatedComment?.user_id || comment.user_id,
              })
            : comment,
        ),
      );
    } catch (error) {
      setAlert({ text: error.message, type: "danger" });
    }
  };

  useEffect(() => {
    const getComments = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${import.meta.env.VITE_APP_SERVERURL}/snippets/${snippetId}/comments`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (response.status === 401) {
          logoutUser();
          return;
        }
        if (!response.ok) throw new Error("Unable to retrieve data");

        const data = await response.json();
        setComments(data.allComments);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    getComments();
  }, [snippetId, logoutUser]);
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
