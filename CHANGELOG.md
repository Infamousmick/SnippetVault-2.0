# Changelog

All notable changes to the SnippetVault project will be documented in this file.

## [2.0.0] - 2026-11-10

SnippetVault 2.0 replaces the Express and MongoDB backend with a serverless Firebase architecture: Authentication, Firestore, Cloud Storage, Cloud Functions and Hosting.

### ⚠️ Breaking Changes

- **New backend:** The Express API, Passport OAuth flow, JWT sessions and Cloudinary uploads have been removed in favor of Firebase. Existing 1.x data can be imported with the migration script in `scripts/migrate-mongo`.
- **Email-only login:** Signing in with a username is no longer supported; the username is now a unique public handle (3-20 characters: letters, numbers, `.`, `_`, `-`).
- **Search & pagination:** Search is now prefix-based on title, description, language and tags (no more substring matching), and pagination relies on Firestore cursors.
- **New content limits:** Title up to 150 characters, description up to 1000, code up to 50,000, a maximum of 10 tags per snippet, comments between 5 and 100 characters.

### ✨ Features

- **Firebase Authentication:** Email/password, Google and GitHub sign-in, with automatic linking of accounts that share the same email.
- **Unique Usernames:** Usernames are reserved atomically, so changing a nickname can never leave duplicates.
- **Avatar Upload on Cloud Storage:** JPEG, PNG or WebP images up to 2 MB, enforced by Storage rules.
- **Gemini via Cloud Functions:** Code generation and snippet analysis now run server-side. Personal API keys are encrypted with AES-256-GCM and never reach the browser.
- **Dynamic Gemini Models:** The model selector is populated live from the Gemini API, ordered by version and tier (Pro, Flash, Flash-Lite), with the latest stable Flash as default. No more manual model lists to maintain.
- **Complete Account Deletion:** A dedicated Cloud Function removes the user's snippets, stars, forks and comments, and requires a recent login.
- **MongoDB Migration Script:** A one-off script imports users (including bcrypt password hashes and Google/GitHub identities), snippets, forks, stars and comments, with a dry-run mode.

### 🛡️ Security

- **Firestore Security Rules:** Replaced `express-validator` and ownership middlewares with field whitelists, owner-only edits, consistent star/fork counters and one fork per user and snippet.
- **Cloud Storage Rules:** Users can only write their own avatar, with type and size validation.
- **Server-side Rate Limiting:** AI requests are limited to 5 per minute per user, backed by Firestore so it holds across function instances.
- **Private Data Isolation:** Encrypted keys and rate-limit counters live in collections that clients cannot read or write.

### ♻️ Refactoring

- **Data Layer:** Introduced `snippetsService`, `userService` and `aiService`, keeping the public API of `AuthContext` and `SnippetContext` unchanged so components needed minimal edits.
- **Safer Star Toggle:** Stars now use a transaction that reads the real server state, with optimistic UI and automatic rollback on failure.
- **Orphan Cleanup:** A Firestore trigger deletes a snippet's comments when the snippet is removed.
- **Infrastructure Cleanup:** Removed the Express backend and the Vercel configuration; the app is now hosted on Firebase Hosting.

## [1.7.0] - 2026-07-22

### ✨ Features

- **Snippet Forking System:** Integrated a complete forking UI with original author attribution, supported by backend nested database population for precise reference tracking.
- **Secure Account Deletion:** Implemented a dedicated "Danger Zone" UI requiring explicit username confirmation, coupled with backend data cleanup to safely remove users without leaving orphaned data.
- **Profile Snippet Filters:** Added a reusable frontend UI and robust backend support to allow dynamic filtering of user-specific snippets.

### 🐛 Bug Fixes

- **Real-Time Profile Sync:** Synchronized local snippet data with the global context upon creation, resolving the issue where new snippets failed to render without a hard page refresh.
- **Optimized Feed State:** Updated edit and delete actions to modify local state directly instead of triggering a full feed refetch, significantly reducing unnecessary API calls and improving perceived performance.
- **Alert State Standardization:** Unified the reset state for alert components to ensure consistent visual feedback across the application.

### ♻️ Refactoring

- **Component Decoupling:** Extracted the Filter Bar and Authentication Form into standalone, reusable components to adhere strictly to DRY principles.
- **Bootstrap Utility Cleanup:** Normalized class usage and removed redundant Bootstrap utility classes, resulting in a cleaner and more maintainable DOM structure.

## [1.6.0] - 2026-07-20

### ✨ Features

- **Gemini AI Suite:** Integrated Google GenAI SDK to allow users to generate code snippets directly from descriptions and interact with a dedicated ChatBox to explain or analyze existing snippets.
- **Dynamic AI Models:** Added a model selector allowing users to choose dynamically between various Gemini models (e.g., Flash, Pro) for their queries.
- **Secure BYOK (Bring Your Own Key):** Implemented a secure Settings UI for users to save their personal Gemini API Key, which is encrypted and safely stored in the backend.
- **AI Feed Filtering:** Added a dynamic toggle filter to the HomePage feed to discover and isolate snippets specifically generated by AI.

### 🎨 Improvements

- **Responsive Form Layouts:** Enhanced the `SnippetForm` mobile responsiveness using `flex-wrap` and gap utilities to prevent UI overflow on smaller screens.
- **DRY Auth Architecture:** Refactored backend authentication logic with a centralized `sanitizeUser` utility to enforce the DRY principle.
- **Active Link Resolution:** Fixed the active navigation link logic to correctly highlight the current route when browsing user profiles.

### 🛡️ Security & Bug Fixes

- **AI Rate Limiting:** Protected AI endpoints using `express-rate-limit` to prevent abuse and excessive API calls.
- **Robust Quota Handling:** Translated Gemini 429 (Quota Exceeded) errors to 503 HTTP status to avoid clashing with the internal rate limiter, providing distinct and clear user feedback.
- **Global Error Handling:** Implemented a custom 403 exception for missing Gemini configurations and resolved global error catching for Mongoose `CastError`.
- **Validation:** Implemented strict `express-validator` rules for all incoming AI and Gemini key endpoints.

## [1.5.0] - 2026-07-13

### ✨ Features

- **User Profile Hub:** Implemented dedicated profile pages allowing developers to showcase their published snippets.
- **Profile Search & Pagination:** Integrated real-time, debounced regex search and dedicated pagination specifically for browsing individual user profiles.
- **Starring System:** Introduced the ability to "star" (favorite) snippets.

### 🎨 Improvements

- **Component Architecture Refactoring:** Decoupled `PaginationControls` into a standalone, reusable "dumb component" for consistent global use across the Feed and Profile pages.
- **Dynamic Empty States:** Upgraded the `EmptyState` component logic to dynamically adapt its UI and messaging based on the user's specific context (e.g., viewing an empty profile vs. returning zero search results).
- **Auth & Routing Optimization:** Resolved nested data extraction issues during OAuth callbacks and updated routing logic to seamlessly handle optional `userId` parameters for profile navigation.
- **Version Display:** Refined the version badge formatting logic in the Navbar to strip `.0` suffixes for a cleaner UI.

### 🛡️ Security & Bug Fixes

- **Mass Assignment Prevention:** Patched backend snippet creation and update routes to prevent mass assignment vulnerabilities.
- **Input Sanitization:** Added strict frontend sanitization for tags to automatically strip out unwanted hashtags before database submission.

## [1.4.0] - 2026-07-09

### ✨ Features

- **Avatar Upload System:**
  - Implemented the frontend interface for profile picture updates.
  - Synced the `AuthContext` to instantly reflect the updated avatar across the application (e.g., Navbar) without requiring a page reload.

### 🎨 Improvements

- **UI Customization:**
  - Styled the native `<input type="file">` using the HTML `<label>` routing hack, providing a clean, custom upload button that matches the application's design system.

## [1.3.0] - 2026-07-08

### ✨ Features

- **Advanced Search & Filtering:**
  - Implemented real-time snippet search with a 500ms debounce mechanism to optimize database queries and prevent API rate-limiting.
  - Added dynamic pagination controls (Previous/Next) synchronized with backend skipping and limiting.
  - Integrated smart pagination reset on filter or search query.

- **Enhanced UX/UI:**
  - Added Spinner to provide visual feedback during asynchronous feed fetching.
  - Implemented dynamic empty states that adapt their messaging based on whether the database is empty or a specific search yielded no results.

### 🎨 Improvements

- **CSS Architecture:**
  - Refactored and centralized general UI classes into `index.css` for better maintainability and cleaner component-specific stylesheets.

## [1.2.0] - 2026-07-07

### ✨ Features

- **Comment System:**
  - Implemented full CRUD operations for code snippet comments, allowing users to interact directly with snippets.
  - Added real-time comment creation and deletion with UI feedback.
  - Integrated dynamic comment counting, synchronized between frontend and backend.

### 🛠️ Backend & Architecture

- **Data Synchronization:**
  - Implemented $push and $pull MongoDB operators in the backend services to maintain data consistency between the Snippets and Comments schemas.
  - Added ownership validation check to ensure only authorized users can edit or delete their own comments.

- **Validation:**
  - Integrated robust input validation and sanitization middleware for all comment-related API routes.

### 🐛 Bug Fixes

- UX/UI Stability:
  - Fixed an error caused by improper DOM nesting in the SnippetCard Markdown description.

## [1.1.1] - 2026-07-03

### 🐛 Bug Fixes

- **Mobile UI:**
  - Fixed an issue where custom WebKit scrollbars forced an unwanted physical scrollbar on touch devices, restoring native fluid scrolling.
  - Prevented the "Gemini AI Assist" button text from wrapping and breaking the layout on narrow screens by applying strict flexbox constraints.

## [1.1.0] - 2026-07-04

This update focuses on enhancing user expression through Markdown and refining the overall UI consistency.

### ✨ Features

- **Markdown Support:**
  - Integrated `react-markdown` to allow rich text formatting in snippet descriptions.
  - Added a real-time Preview mode in the snippet creation form, providing a seamless toggle between "Write" and "Preview".
- **Enhanced UI Customization:**
  - Standardized scrollbar styling across the application for a consistent dark theme experience.
  - Implemented custom cross-browser text selection (`::selection`) to improve readability and visual identity.

### 🎨 Improvements

- **CSS Architecture Refactoring:**
  - Performed a major refactor of global styles to separate structural components (`.markdown-preview-box`) from typographic content (`.markdown-content`), ensuring better reusability and cleaner code.
- **Dynamic Versioning:**
  - Automated the version badge in the Navbar by dynamically reading the current version from `package.json`.
- **UI Polish:**
  - Fixed minor UI inconsistencies in form components, ensuring a cleaner "dark mode" look across all input types and modal overlays.

### 🛡️ Security & Architecture

- Improved CSS specificity and maintainability by centralizing global UI resets in `index.css`.

## [1.0.0] - 2026-07-03

Welcome to the first official release of SnippetVault! This version lays the foundation of the platform, providing a comprehensive hub for managing, formatting, and sharing code snippets.

### ✨ Features

- **Snippet Management:** Full CRUD (Create, Read, Update, Delete) capabilities for your code fragments.
- **Syntax Highlighting:** Native integration of `react-syntax-highlighter` for crystal-clear code rendering.
- **Gemini AI Integration:**
  - Added "Ask Gemini" button for code interaction and explanations.
  - Implemented an "AI Generated" badge to identify snippets created with artificial intelligence.
- **Secure Authentication:** Local JWT-based login and registration system.
- **Profile Management:**
  - Dedicated settings area for password updates.
  - Backend API foundation established for user avatar uploads via Cloudinary (Frontend integration coming in V2).

### 🎨 Improvements

- **Mobile-First Design:** Fully responsive interface featuring a modern dark theme.
- **Code Utilities:**
  - Quick "Copy code" functionality.
  - Automatic code formatting during creation using standalone Prettier.
- **Feed & Discovery:**
  - Base sorting and filtering system in the Dashboard.
  - Custom empty states for when no posts are available.
- **Navigation System:** Dynamic navbar with a versioning badge and an informative footer.

### 🛡️ Security & Architecture

- Implemented global, centralized error handling for both backend and frontend.
- Advanced protection for private routes (CORS and redirects for unauthenticated users).
- Added conditional logic to safely handle unsupported languages in the code formatter.
