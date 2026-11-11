# SnippetVault 💻

![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node-dot-js&logoColor=white)
[![GitHub Release](https://img.shields.io/github/v/release/Infamousmick/SnippetVault-2.0?display_name=tag&color=success)](https://github.com/Infamousmick/SnippetVault-2.0/releases)
[![License: GPL v3](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](/LICENSE)

**[🟢 Live Demo](https://snippetvault-2.web.app)** | **[📖 Read the Changelog](CHANGELOG.md)**

SnippetVault is your personal code hub. Share syntax-highlighted snippets, fork the best solutions, and understand complex code with Gemini AI integration.

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Local Installation](#️-local-installation)
- [Migrating from 1.x](#-migrating-from-1x)
- [Contributing](#-contributing)
- [License](#-license)

## 🚀 Features

- **Code Management:** Create, edit, and organize code snippets across various languages, with stars, forks and comments.
- **AI-Powered Suite:** Integrated with Google's Gemini AI to generate code from prompts, explain complex syntax, and analyze snippets via a dedicated ChatBox. The list of available models is fetched live from the Gemini API, so new models show up without any code change.
- **Secure BYOK (Bring Your Own Key):** Users can safely input and manage their own Gemini API keys. Keys are encrypted (AES-256-GCM) inside Cloud Functions and never reach the browser.
- **Auto-Formatting:** Built-in Prettier formatter directly in the browser.
- **Secure Auth & Profiles:** Firebase Authentication with email/password, Google and GitHub (accounts sharing the same email are linked automatically), unique usernames, complete profile management and avatar upload via Cloud Storage.
- **Search & Filters:** Prefix-based search on title, description, language and tags, with sorting (Trending, Newest, Most Forked) and starred / AI-generated filters.
- **Responsive UI:** Dark-mode, mobile-first design tailored for coding on the go.

## 🛠️ Tech Stack

- **Frontend:** React.js, Vite, React Router DOM, React-Bootstrap, React Syntax Highlighter, React Markdown, Prettier, Lucide Icons.
- **Backend (serverless):** Firebase Authentication, Cloud Firestore (Security Rules), Cloud Storage for Firebase, Cloud Functions (Node.js 22), Secret Manager, Firebase Hosting.
- **AI:** Google Gemini via the `@google/genai` SDK, called only from Cloud Functions.

## ⚙️ Local Installation

To run SnippetVault locally for development and testing, follow these steps:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Infamousmick/SnippetVault-2.0.git
   ```

2. **Create the Firebase project** from the [Firebase Console](https://console.firebase.google.com):
   - Upgrade to the **Blaze** plan (required by Cloud Functions and Cloud Storage; the free quotas are generous, and a budget alert is recommended).
   - **Authentication:** enable Email/Password, Google and GitHub. For GitHub, create an OAuth App using the callback URL shown by Firebase.
   - **Firestore:** create the database (note its location).
   - **Storage:** click "Get started".
   - **Project settings:** register a Web app and copy its configuration.

3. **Setup the Frontend:**

   ```bash
   cd App/frontend
   npm install
   ```

   Create a `.env` file in `App/frontend` using your Firebase web app configuration:

   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

   Start the React development server:

   ```bash
   npm run dev
   ```

4. **Deploy Rules, Indexes and Cloud Functions** (from the repository root):

   ```bash
   npm install -g firebase-tools
   firebase login
   ```

   - Set your project id in `.firebaserc`.
   - In `functions/index.js` set `REGION` to the region matching your Firestore location (for example `europe-west1` for `eur3`), and use the same region in `App/frontend/src/firebase.js`.
   - Install the functions dependencies and store the encryption secret (64 hexadecimal characters):

   ```bash
   cd functions && npm install && cd ..
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   firebase functions:secrets:set CRYPTO_SECRET
   firebase deploy --only firestore,storage,functions
   ```

5. **Deploy the site** (optional):

   ```bash
   cd App/frontend && npm run build && cd ../..
   firebase deploy --only hosting
   ```

## 🔄 Migrating from 1.x

SnippetVault 1.x used Express and MongoDB. A one-off script in [`scripts/migrate-mongo`](scripts/migrate-mongo) imports users (including bcrypt password hashes and Google/GitHub identities), snippets, forks, stars and comments into Firebase. Run it with `--dry-run` first to preview the result.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📜 License

This project is licensed under the GNU General Public License v3.0 - see the LICENSE file for details. Made with ❤️ by Infamick © 2026.