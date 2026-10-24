import { Inbox, Plus } from "lucide-react";
import { MyCard, MyCardContent, MyCardTitle } from "../MyCard/MyCard";
import { useContext } from "react";
import MyButton from "../MyButton/MyButton";
import "./EmptyState.css";
import { SnippetContext } from "../../context/SnippetContext/SnippetContext";
const EmptyState = ({ searchQuery = "", title = "", message = "" }) => {
  const { openModal } = useContext(SnippetContext);
  const displayTitle = title
    ? title
    : searchQuery
      ? "No result found"
      : "No snippet found";

  const displayMessage = message
    ? message
    : searchQuery
      ? `There are no snippets matching "${searchQuery}". Try different terms.`
      : "Be the first to share a snippet with the community!";
  return (
    <MyCard className="empty-feed-card py-5 mt-2 text-center">
      <MyCardContent className="d-flex flex-column align-items-center gap-3">
        <Inbox size={48} className="empty-icon mb-2" />
        <MyCardTitle className="empty-title">{displayTitle}</MyCardTitle>
        <p className="empty-subtitle m-0 mb-3">{displayMessage}</p>
        <MyButton onClick={() => openModal()}>
          <Plus size={16} /> Create Snippet
        </MyButton>
      </MyCardContent>
    </MyCard>
  );
};

export default EmptyState;
