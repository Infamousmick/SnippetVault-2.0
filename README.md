# SnippetVault 💻

![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node-dot-js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white)
[![GitHub Release](https://img.shields.io/github/v/release/Infamousmick/SnippetVault?display_name=tag&color=success)](https://github.com/Infamousmick/SnippetVault/releases)
[![License: GPL v3](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](/LICENSE)

**[🟢 Live Demo](https://snippet-vault-xi.vercel.app)** | **[📖 Read the Changelog](CHANGELOG.md)**

SnippetVault is your personal code hub. Share syntax-highlighted snippets, fork the best solutions, and understand complex code with Gemini AI integration.

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Local Installation](#️-local-installation)
- [Contributing](#-contributing)
- [License](#-license)

## 🚀 Features

- **Code Management:** Create, edit, and organize code snippets across various languages.
- **AI-Powered Suite:** Integrated with Google's Gemini AI to generate code from prompts, explain complex syntax, and analyze snippets via a dedicated ChatBox. Features dynamic model selection (Flash/Pro).
- **Secure BYOK (Bring Your Own Key):** Users can safely input and manage their own Gemini API keys, protected by robust backend encryption.
- **Auto-Formatting:** Built-in Prettier formatter directly in the browser.
- **Secure Auth & Profiles:** JWT-based authentication, complete profile management, and custom avatar upload system via Cloudinary.
- **Responsive UI:** Dark-mode, mobile-first design tailored for coding on the go.

## 🛠️ Tech Stack

- **Frontend:** React.js, React Router DOM, React-Bootstrap, React Syntax Highlighter, React Markdown, Google Generative AI SDK, Prettier, Lucide Icons.
- **Backend:** Node.js, Express.js, JWT & Passport.js, Bcrypt, Multer, Cloudinary, Express-Validator, Express-Rate-Limit.
- **Database:** MongoDB, Mongoose.

## ⚙️ Local Installation

To run SnippetVault locally for development and testing, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Infamousmick/SnippetVault.git
   ```
2. **Setup the Backend:**
   - Navigate to the backend directory:

   ```bash
   cd App/backend
   ```

   - Install the required dependencies:

   ```bash
   npm install
   ```

   - Create a .env file in the root of the backend directory based on the following structure:

   ```env
   PORT=9099
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   FRONTEND_URL=http://localhost:5173
   SESSION_SECRET=your_session_secret

   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # OAuth Providers
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   GITHUB_CALLBACK_URL=http://localhost:9099/auth/github/callback
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:9099/auth/google/callback

   # Security & Encryption
   CRYPTO_SECRET=your_32_byte_crypto_secret
   ```

   - Start the development server:

   ```bash
   npm run dev
   ```

3. **Setup the Frontend:**
   - Open a new terminal window and navigate to the frontend directory:

   ```bash
   cd App/frontend
   ```

   - Install the required dependencies:

   ```bash
   npm install
   ```

   - Create a .env file in the root of the frontend directory to store your API URL:

   ```.env
   VITE_APP_SERVERURL=http://localhost:9099
   ```

   - Start the React development server:

   ```bash
    npm run dev
   ```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📜 License

This project is licensed under the GNU General Public License v3.0 - see the LICENSE file for details. Made with ❤️ by Infamick © 2026.
