import "./CommentItem.css";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { AuthContext } from "../../context/AuthContext/AuthContext";
import { useContext } from "react";
import CommentForm from "../CommentForm/CommentForm";

const CommentItem = ({ comment, onDelete, onEdit }) => {
  const { body, user_id, createdAt } = comment;
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useContext(AuthContext);
  const commentUserId = typeof user_id === "object" ? user_id?._id : user_id;
  const isMyComment = user && user._id === commentUserId;
  const username = user_id?.username || "Utente Sconosciuto";
  const avatar = user_id?.avatar_url || "https://placehold.co/32";

  const toggleEdit = () => setIsEditing(!isEditing);

  const handleEditSubmit = async (newBody) => {
    await onEdit(comment._id, newBody);
    setIsEditing(false);
  };

  const formattedDate = new Date(createdAt).toLocaleDateString();

  return (
    <div className="comment-item">
      <div className="comment-header d-flex justify-content-between align-items-start mb-2">
        <div className="d-flex align-items-center gap-2">
          <img src={avatar} alt={username} className="comment-avatar" />
          <div className="d-flex flex-column">
            <span className="comment-author">{username}</span>
            <span className="comment-date">{formattedDate}</span>
          </div>
        </div>

        {isMyComment && (
          <div className="d-flex gap-2">
            <button
              className="stat-btn edit-btn d-flex align-items-center justify-content-center p-1"
              onClick={toggleEdit}
              title={isEditing ? "Cancel edit" : "Edit Comment"}
            >
              <Pencil size={18} className="action-icon" />
            </button>
            <button
              className="stat-btn delete-btn d-flex align-items-center justify-content-center p-1"
              onClick={() => onDelete(comment._id)}
              disabled={isEditing}
              title="Delete Comment"
            >
              <Trash2 size={18} className="action-icon" />
            </button>
          </div>
        )}
      </div>
      <div className="comment-body">
        {isEditing ? (
          <CommentForm
            initialText={body}
            onSubmit={handleEditSubmit}
            onCancel={() => setIsEditing(false)}
            submitLabel="Save"
            loadingLabel="Saving..."
          />
        ) : (
          <p className="m-0">{body}</p>
        )}
      </div>
    </div>
  );
};

export default CommentItem;
