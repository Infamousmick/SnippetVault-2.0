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

export const SnippetContext = createContext();

export const SnippetProvider = ({ children }) => {
  const { isLoggedIn, logoutUser, user } = useContext(AuthContext);

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

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  const fetchSnippets = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_APP_SERVERURL}/snippets/?sort=${activeFilter}&page=${page}&pageSize=5&queryStr=${encodeURIComponent(debouncedQuery)}&starred=${isStarredOnly}&ai=${isAiOnly}`,
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
      console.log(data);
      setSnippets(data.allSnippets);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error(error);
      setError("Oops! Something went wrong while loading the feed.");
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, page, debouncedQuery, logoutUser, isStarredOnly, isAiOnly]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchSnippets();
    }
  }, [isLoggedIn, fetchSnippets]);

  const handleCreateSnippet = async (formData) => {
    setIsCreating(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_APP_SERVERURL}/snippets/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        },
      );

      if (response.status === 401) {
        logoutUser();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create snippet.");
      }

      setShowModal(false);
      await fetchSnippets();
    } catch (error) {
      console.error(error);
      alert(error.message || "Something went wrong...");
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditSnippet = async (formData, snippetId) => {
    setIsCreating(true);
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${import.meta.env.VITE_APP_SERVERURL}/snippets/${snippetId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        },
      );

      if (response.status === 401) {
        logoutUser();
        return;
      }

      if (!response.ok) throw new Error("Failed to edit snippet.");

      const data = await response.json();
      const updatedSnippet = data.editedSnippet;

      setSnippets((prevSnippets) =>
        prevSnippets.map((s) =>
          s._id === updatedSnippet._id
            ? mergeSnippetUpdate(s, updatedSnippet)
            : s,
        ),
      );

      setShowModal(false);
      setEditingSnippet(null);

      if (modalSuccessCallbackRef.current) {
        modalSuccessCallbackRef.current(updatedSnippet);
        modalSuccessCallbackRef.current = null;
      }
    } catch (error) {
      console.warn(error);
      alert(error.message || "Something went wrong while editing...");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSnippet = async (snippetId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_APP_SERVERURL}/snippets/${snippetId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.status === 401) {
        logoutUser();
        return false;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete snippet.");
      }

      setSnippets((prevSnippets) =>
        prevSnippets.filter((snippet) => snippet._id !== snippetId),
      );
      return true;
    } catch (error) {
      console.error(error);
      alert(error.message || "Something went wrong while deleting...");
      return false;
    }
  };

  const handleToggleStar = async (snippetId, userId) => {
    setSnippets((prevSnippets) =>
      prevSnippets.map((snippet) => {
        if (snippet._id.toString() !== snippetId) return snippet;

        const hasStarred = snippet.stars.includes(userId);
        return {
          ...snippet,
          stars: hasStarred
            ? snippet.stars.filter((id) => id !== userId)
            : [...snippet.stars, userId],
          starsCount: hasStarred
            ? snippet.starsCount - 1
            : snippet.starsCount + 1,
        };
      }),
    );

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_APP_SERVERURL}/snippets/${snippetId}/star`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 401) {
        logoutUser();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to toggle star.");
      }
    } catch (error) {
      console.error(error);
      alert(error.message || "Something went wrong while toggling star...");
    }
  };

  const handleForkSnippet = async (snippetId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_APP_SERVERURL}/snippets/${snippetId}/fork`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.status === 401) {
        logoutUser();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fork snippet.");
      }

      setSnippets((prevSnippets) =>
        prevSnippets.map((snippet) =>
          snippet._id === snippetId
            ? {
                ...snippet,
                forksCount: (snippet.forksCount || 0) + 1,
                forks: [...(snippet.forks || []), user._id],
              }
            : snippet,
        ),
      );

      return data.forkedSnippet;
    } catch (error) {
      throw error;
    }
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
