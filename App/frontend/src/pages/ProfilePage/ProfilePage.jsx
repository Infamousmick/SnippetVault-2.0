import { Container, Row, Col, Spinner } from "react-bootstrap";
import { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import { Star, SquareDashedBottomCode } from "lucide-react";
import BaseLayout from "../../Layout/BaseLayout";
import { MyCard, MyCardContent } from "../../components/MyCard/MyCard";
import SnippetCard from "../../components/SnippetCard/SnippetCard";
import EmptyState from "../../components/EmptyState/EmptyState";
import FilterBar from "../../components/FilterBar/FilterBar";
import { AuthContext } from "../../context/AuthContext/AuthContext";
import CustomAlert from "../../components/CustomAlert/CustomAlert";
import { SnippetContext } from "../../context/SnippetContext/SnippetContext";
import PaginationControls from "../../components/PaginationControls/PaginationControls";
import { mergeSnippetUpdate } from "../../utils/mergeSnippetUpdate";
import {
  SNIPPET_FILTERS,
  SNIPPET_FILTER_TOGGLES,
} from "../../constants/filters";
import "./ProfilePage.css";

const ProfilePage = () => {
  const { userId } = useParams();
  const { user, logoutUser } = useContext(AuthContext);
  const {
    handleToggleStar,
    debouncedQuery,
    snippets: globalSnippets,
  } = useContext(SnippetContext);

  const [snippets, setSnippets] = useState([]);
  const [profileUser, setProfileUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [alert, setAlert] = useState({ text: null, type: null });
  const [activeFilter, setActiveFilter] = useState(SNIPPET_FILTERS[0]);
  const [isStarredOnly, setIsStarredOnly] = useState(false);
  const [isAiOnly, setIsAiOnly] = useState(false);
  const displayTitle = userId
    ? "No snippets found for this user."
    : "No snippet found in your profile";
  const displayMessage = userId
    ? "This developer hasn't shared any snippets yet."
    : "You haven't published anything yet. Share your first shell command, script, or React component to get started!";
  const targetUserId = userId || user?._id;

  useEffect(() => {
    setPage(1);
  }, [targetUserId, debouncedQuery, activeFilter, isStarredOnly, isAiOnly]);

  const filterToggles = SNIPPET_FILTER_TOGGLES.map((toggle) => ({
    ...toggle,
    active: toggle.key === "starred" ? isStarredOnly : isAiOnly,
    onClick: () => {
      if (toggle.key === "starred") {
        setIsStarredOnly(!isStarredOnly);
      } else {
        setIsAiOnly(!isAiOnly);
      }
      setPage(1);
    },
  }));

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setPage(1);
  };

  const handleProfileStarToggle = async (snippetId, currentUserId) => {
    setSnippets((prevSnippets) =>
      prevSnippets.map((snippet) => {
        if (snippet._id.toString() !== snippetId) return snippet;

        const hasStarred = snippet.stars.includes(currentUserId);
        return {
          ...snippet,
          stars: hasStarred
            ? snippet.stars.filter((id) => id !== currentUserId)
            : [...snippet.stars, currentUserId],
          starsCount: hasStarred
            ? snippet.starsCount - 1
            : snippet.starsCount + 1,
        };
      }),
    );

    handleToggleStar(snippetId, currentUserId);
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      setAlert({ text: null, type: null });
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          `${import.meta.env.VITE_APP_SERVERURL}/users/${targetUserId}?sort=${activeFilter}&page=${page}&pageSize=5&queryStr=${encodeURIComponent(debouncedQuery)}&starred=${isStarredOnly}&ai=${isAiOnly}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.status === 401) {
          logoutUser();
          return;
        }

        if (!response.ok) throw new Error("Failed to fetch profile data");

        const data = await response.json();

        setSnippets(data.user.snippets || []);
        setProfileUser(data.user);
        setTotalPages(data.user.totalPages || 1);
      } catch (error) {
        setAlert({ text: error.message, type: "danger" });
      } finally {
        setIsLoading(false);
      }
    };

    if (targetUserId) {
      fetchProfileData();
    }
  }, [
    targetUserId,
    user,
    logoutUser,
    page,
    debouncedQuery,
    activeFilter,
    isStarredOnly,
    isAiOnly,
    globalSnippets,
  ]);

  return (
    <BaseLayout>
      <Container className="py-4 py-md-5">
        <Row className="justify-content-center">
          <Col xs={12} lg={8}>
            {isLoading && (
              <div className="d-flex flex-column align-items-center justify-content-center py-5 mt-2">
                <Spinner
                  animation="border"
                  role="status"
                  className="mb-3 custom-spinner"
                >
                  <span className="visually-hidden">Loading profile...</span>
                </Spinner>
                <h2 className="loading-title">Loading profile...</h2>
              </div>
            )}

            {!isLoading && alert.text && (
              <div className="d-flex justify-content-center py-5 mt-2">
                <CustomAlert
                  text={alert.text}
                  type={alert.type}
                  onClose={() => setAlert({ text: null, type: null })}
                />
              </div>
            )}

            {!isLoading && !alert.text && profileUser && (
              <>
                <MyCard className="profile-header-card mb-5 border-0">
                  <MyCardContent className="d-flex flex-column flex-sm-row align-items-center text-center text-sm-start gap-4 py-4">
                    <img
                      src={
                        profileUser?.avatar_url || "https://placehold.co/120"
                      }
                      alt="User Avatar"
                      className="profile-avatar"
                    />

                    <div className="profile-info flex-grow-1">
                      <h1 className="profile-username">
                        {profileUser?.username || "Developer"}
                      </h1>
                      <p className="profile-join-date">
                        Joined:{" "}
                        {profileUser?.createdAt
                          ? new Date(profileUser.createdAt).toLocaleDateString()
                          : "July 2026"}
                      </p>

                      <div className="d-flex justify-content-center justify-content-sm-start gap-4">
                        <div className="profile-stat-box">
                          <span className="stat-number">{snippets.length}</span>
                          <SquareDashedBottomCode size={18} />
                        </div>
                        <div className="profile-stat-box">
                          <span className="stat-number">
                            {snippets.reduce(
                              (acc, curr) => acc + (curr.starsCount || 0),
                              0,
                            )}
                          </span>
                          <Star size={18} />
                        </div>
                      </div>
                    </div>
                  </MyCardContent>
                </MyCard>

                <h3 className="feed-title mb-4">
                  {userId && userId !== user?._id
                    ? `${profileUser?.username}'s Snippets`
                    : "My Snippets"}
                </h3>

                <div className="mb-4">
                  <FilterBar
                    filters={SNIPPET_FILTERS}
                    activeFilter={activeFilter}
                    onFilterChange={handleFilterChange}
                    toggles={filterToggles}
                  />
                </div>

                <div className="d-flex flex-column gap-4">
                  {snippets.length === 0 ? (
                    <EmptyState
                      title={debouncedQuery ? "" : displayTitle}
                      message={debouncedQuery ? "" : displayMessage}
                      searchQuery={debouncedQuery}
                    />
                  ) : (
                    snippets.map((snippet) => {
                      const snippetWithUserData = {
                        ...snippet,
                        user_id: profileUser,
                      };
                      return (
                        <SnippetCard
                          key={snippet._id}
                          snippet={snippetWithUserData}
                          onToggleStar={handleProfileStarToggle}
                          onDeleteSuccess={(deletedId) =>
                            setSnippets((prev) =>
                              prev.filter((s) => s._id !== deletedId),
                            )
                          }
                          onEditSuccess={(updatedSnippet) =>
                            setSnippets((prev) =>
                              prev.map((s) =>
                                s._id === updatedSnippet._id
                                  ? mergeSnippetUpdate(s, updatedSnippet)
                                  : s,
                              ),
                            )
                          }
                        />
                      );
                    })
                  )}
                  {snippets.length > 0 && (
                    <PaginationControls
                      page={page}
                      setPage={setPage}
                      totalPages={totalPages}
                    />
                  )}
                </div>
              </>
            )}
          </Col>
        </Row>
      </Container>
    </BaseLayout>
  );
};

export default ProfilePage;
