import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
} from "react";
import { Modal } from "react-bootstrap";
import { AuthContext } from "../AuthContext/AuthContext";
import SnippetForm from "../../components/SnippetForm/SnippetForm";
import { mergeSnippetUpdate } from "../../utils/mergeSnippetUpdate";
import * as snippetsService from "../../services/snippetsService";

export const SnippetContext = createContext();

const flipStar = (snippet, userId) => {
  const hasStarred = snippet.stars.includes(userId);
  return {
    ...snippet,
    stars: hasStarred
      ? snippet.stars.filter((id) => id !== userId)
      : [...snippet.stars, userId],
    starsCount: hasStarred ? snippet.starsCount - 1 : snippet.starsCount + 1,
  };
};

export const SnippetProvider = ({ children }) => {
  const { isLoggedIn, user } = useContext(AuthContext);
  const uid = user?._id;

  const [snippets, setSnippets] = useState([]);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("Trending");
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStarredOnly, setIsStarredOnly] = useState(false);
  const [isAiOnly, setIsAiOnly] = useState(false);
  const modalSuccessCallbackRef = useRef(null);
  // cursori di paginazione di Firestore (ultimo documento di ogni pagina)
  const cursorStoreRef = useRef({ key: null, cursors: [] });

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  const resetCursors = () => {
    cursorStoreRef.current = { key: null, cursors: [] };
  };

  const fetchSnippets = useCallback(async () => {
    if (!uid) return;
    setError(null);
    setIsLoading(true);
    try {
      const data = await snippetsService.listSnippets(
        {
          sort: activeFilter,
          page,
          pageSize: 5,
          queryStr: debouncedQuery,
          starred: isStarredOnly,
          ai: isAiOnly,
          uid,
        },
        cursorStoreRef.current,
      );
      setSnippets(data.allSnippets);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
      setError(
        snippetsService.getFirestoreErrorMessage(
          err,
          "Oops! Something went wrong while loading the feed.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, page, debouncedQuery, uid, isStarredOnly, isAiOnly]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchSnippets();
    }
  }, [isLoggedIn, fetchSnippets]);

  const handleCreateSnippet = async (formData) => {
    setIsCreating(true);
    try {
      await snippetsService.createSnippet(formData, uid);

      setShowModal(false);
      resetCursors();
      await fetchSnippets();
    } catch (err) {
      console.error(err);
      alert(
        snippetsService.getFirestoreErrorMessage(
          err,
          "Something went wrong...",
        ),
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditSnippet = async (formData, snippetId) => {
    setIsCreating(true);
    try {
      const updatedSnippet = await snippetsService.editSnippet(
        snippetId,
        formData,
      );

      setSnippets((prevSnippets) =>
        prevSnippets.map((s) =>
          s._id === updatedSnippet._id
            ? mergeSnippetUpdate(s, updatedSnippet)
            : s,
        ),
      );
      resetCursors();

      setShowModal(false);
      setEditingSnippet(null);

      if (modalSuccessCallbackRef.current) {
        modalSuccessCallbackRef.current(updatedSnippet);
        modalSuccessCallbackRef.current = null;
      }
    } catch (err) {
      console.warn(err);
      alert(
        snippetsService.getFirestoreErrorMessage(
          err,
          "Something went wrong while editing...",
        ),
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSnippet = async (snippetId) => {
    try {
      await snippetsService.deleteSnippet(snippetId, uid);

      setSnippets((prevSnippets) =>
        prevSnippets.filter((snippet) => snippet._id !== snippetId),
      );
      resetCursors();
      return true;
    } catch (err) {
      console.error(err);
      alert(
        snippetsService.getFirestoreErrorMessage(
          err,
          "Something went wrong while deleting...",
        ),
      );
      return false;
    }
  };

  const handleToggleStar = async (snippetId, userId) => {
    // aggiornamento ottimistico
    setSnippets((prevSnippets) =>
      prevSnippets.map((snippet) =>
        snippet._id === snippetId ? flipStar(snippet, userId) : snippet,
      ),
    );

    try {
      const { isStarred, starsCount } = await snippetsService.toggleStar(
        snippetId,
        userId,
      );

      // allineo allo stato reale del server
      setSnippets((prevSnippets) =>
        prevSnippets.map((snippet) =>
          snippet._id === snippetId
            ? {
                ...snippet,
                starsCount,
                stars: isStarred
                  ? [...new Set([...snippet.stars, userId])]
                  : snippet.stars.filter((id) => id !== userId),
              }
            : snippet,
        ),
      );
      resetCursors();
    } catch (err) {
      console.error(err);
      // annullo l'aggiornamento ottimistico
      setSnippets((prevSnippets) =>
        prevSnippets.map((snippet) =>
          snippet._id === snippetId ? flipStar(snippet, userId) : snippet,
        ),
      );
      alert(
        snippetsService.getFirestoreErrorMessage(
          err,
          "Something went wrong while toggling star...",
        ),
      );
    }
  };

  const handleForkSnippet = async (snippetId) => {
    const forkedSnippet = await snippetsService.forkSnippet(snippetId, uid);

    setSnippets((prevSnippets) =>
      prevSnippets.map((snippet) =>
        snippet._id === snippetId
          ? {
              ...snippet,
              forksCount: (snippet.forksCount || 0) + 1,
              forks: [...(snippet.forks || []), uid],
            }
          : snippet,
      ),
    );
    resetCursors();

    return forkedSnippet;
  };

  const value = {
    snippets,
    error,
    activeFilter,
    setActiveFilter,
    openModal: (snippetData = null, onSuccess = null) => {
      setEditingSnippet(snippetData);
      setShowModal(true);
      modalSuccessCallbackRef.current = onSuccess;
    },
    closeModal: () => {
      setShowModal(false);
      setEditingSnippet(null);
    },
    handleDeleteSnippet,
    handleEditSnippet,
    page,
    setPage,
    totalPages,
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    isLoading,
    handleToggleStar,
    isStarredOnly,
    setIsStarredOnly,
    isAiOnly,
    setIsAiOnly,
    handleForkSnippet,
  };

  return (
    <SnippetContext.Provider value={value}>
      {children}

      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
        contentClassName="bg-transparent border-0"
      >
        <Modal.Body className="p-0">
          <SnippetForm
            initialData={editingSnippet}
            onSubmit={(formData) =>
              editingSnippet
                ? handleEditSnippet(formData, editingSnippet._id)
                : handleCreateSnippet(formData)
            }
            isLoading={isCreating}
            onCancel={() => {
              setShowModal(false);
              setEditingSnippet(null);
            }}
          />
        </Modal.Body>
      </Modal>
    </SnippetContext.Provider>
  );
};
