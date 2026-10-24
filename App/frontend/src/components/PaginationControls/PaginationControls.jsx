import MyButton from "../MyButton/MyButton";
import { SnippetContext } from "../../context/SnippetContext/SnippetContext";

const PaginationControls = ({ page, totalPages, setPage }) => {
  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  return (
    <div className="d-flex align-items-center justify-content-between mt-4">
      <MyButton
        onClick={handlePrevPage}
        disabled={page === 1}
        className="pagination-btn pagination-btn-nav"
      >
        Previous
      </MyButton>

      <span className="text-secondary small">
        Page {page} of {totalPages}
      </span>

      <MyButton
        onClick={handleNextPage}
        disabled={page >= totalPages}
        className="pagination-btn pagination-btn-nav"
      >
        Next
      </MyButton>
    </div>
  );
};

export default PaginationControls;
