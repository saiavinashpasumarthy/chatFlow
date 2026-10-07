# Relay — Real-Time Email & Chat System

Relay is a unified communication platform providing integrated real-time chat, email management, contact directory, and file collaboration with a calm, high-efficiency interface.

---

## Repository Structure

```
chatFlow/
├── server/               # Backend Node.js service (preserved for backend teammate)
│   └── package.json      # Backend service manifest
├── client/               # Frontend client application (React + JavaScript + Vite + Tailwind)
│   ├── public/           # Static public assets
│   ├── src/
│   │   ├── components/   # AppShell.jsx, Sidebar.jsx, TopBar.jsx, and UI components
│   │   ├── data/         # Local mock datasets (mockData.js)
│   │   ├── pages/        # InboxPage.jsx, ChatPage.jsx, ContactsPage.jsx, FilesPage.jsx
│   │   ├── utils/        # Persistence utilities (storage.js)
│   │   ├── App.jsx       # Root view router and global state
│   │   ├── index.css     # Tailwind design system & tokens
│   │   └── main.jsx      # Vite React entrypoint
│   ├── index.html        # HTML shell
│   ├── package.json      # Client dependencies & scripts
│   ├── tailwind.config.js# Design system tokens (calm neutrals, indigo accents)
│   └── vite.config.js    # Vite bundler configuration
└── README.md             # Project documentation
```

---

## Getting Started

### 1. Frontend Client (`client/`)

The frontend is built with React 18, JavaScript (`.jsx` for components, `.js` for utilities/data), Vite, and Tailwind CSS. It currently runs in **Mock Mode**, using local mock data and `localStorage` so you can test all views, navigation flows, and UI interactions independently without waiting for live backend endpoints.

#### Prerequisites
- Node.js (v18+ recommended)
- npm (v9+ recommended)

#### Installation & Running

```bash
# Navigate to the client directory
cd client

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

Once started, open [http://localhost:5173](http://localhost:5173) in your browser.

#### Available Scripts
- `npm run dev` — Launches the local development server with Hot Module Replacement (HMR).
- `npm run build` — Compiles an optimized production bundle with Vite in `client/dist`.
- `npm run preview` — Locally previews the production build.

---

### 2. Backend Service (`server/`)

The backend codebase resides inside `server/`.
- Entry point target: `server/index.js` (managed by backend developer)
- Package manifest: `server/package.json`

#### Running the Backend (when implemented):
```bash
cd server
npm install
npm start
```

*Note: The backend files and configuration are preserved intact. The frontend does not connect to mock backend ports or unconfirmed APIs until endpoint schemas and socket contracts are provided.*

---

## Design System & UX Standards

The "Relay" user interface follows these principles:
- **Calm Surfaces:** Slate neutrals (`slate-50`, `slate-100`, `white`, `border-slate-200`) designed for all-day focus.
- **Accents:** Restrained indigo (`indigo-600`) reserved for active indicators, primary call-to-actions, and unread counters.
- **High Readability:** Clear typography hierarchy with tabular data alignment and distinct read/unread states.
- **Accessible & Responsive:** Collapsible desktop navigation rail, sliding mobile drawer, accessible keyboard shortcuts (`/` to search, `?` for shortcuts help), and high-contrast text ratios.

---

## Implemented Frontend Modules (Relay Suite)

1. **Inbox (Email Module)**:
   - Three-pane layout (folders, thread list, reading pane).
   - LocalStorage auto-save draft persistence across page reloads.
   - Tag filtering chips and quick folder switching (Inbox, Starred, Sent, Drafts, Trash).
   - Full keyboard navigation (`j`/`k` or `↑`/`↓` for browsing, `Enter` to read, `s` to star, `u` for unread, `Delete`/`#` for trash, `c` to compose, `?` for cheatsheet).
   - Simulated refresh with skeleton loaders.

2. **Chat (Messaging Module)**:
   - Channels and direct messages with live presence status indicators (online, away, busy).
   - Search filtering by channel topic, recipient, or text query.
   - Sender grouping, date separators, and delivery acknowledgement status checkmarks.
   - Message composer with simulated attachments, categorized emoji picker, and Enter-to-send.

3. **Contacts (Directory Module)**:
   - Multi-field search across name, email, department, role, and location.
   - Flat grid view and Department-grouped view with dynamic headcounts.
   - Teammate profile slide-over drawer with timezone, location, and activity log.
   - Quick cross-module actions: click "Send Email" to launch prefilled composer, click "Message" to switch to 1:1 chat.
   - Validated client-side invite modal with explicit simulation banner.

4. **Files (Media & Document Sharing Module)**:
   - Search and type filtering (`document`, `design`, `code`, `image`).
   - 4-column sortable headers (Name, Date, Size, Sender) with ascending/descending toggles.
   - Origin links showing which chat channel or email thread originated the file, with 1-click jump-to-source.
   - Interactive drag-and-drop dropzone with animated progress simulation.
   - Slide-over preview drawer with code syntax rendering and simulated download/copy actions.

5. **Notification Center & Global Toast System**:
   - Notification popover with filter tabs (`All`, `Unread`, `Email`, `Chat`, `System`).
   - Deep-linking from notifications directly to the corresponding email thread or chat channel.
   - Global floating toast notifications with stack management, auto-dismiss, and accessibility roles (`role="status"`).
   - Simulated workspace synchronization with loading spinners and status toasts.

6. **Public Landing Page & Authentication (New)**:
   - **Public Landing Page (`#/` or root)**: First view presented to visitors. Showcases headline, feature previews, and prominent "Log in" / "Get started" CTAs.
   - **Login Screen (`#/login`)**: Client-side validation, password visibility toggle, accessible error messages, and 1-Click Demo Login (`Alex Rivera`).
   - **Sign-Up Screen (`#/signup`)**: Name, email, department picker, password validation, and return to landing link.
   - **Protected Route Enforcement**: Directly accessing `#/app/*` redirects unauthenticated visitors to `#/login` with an authentication-required notice.
   - **Profile Menu Logout**: Prominent "Log out" option in top bar profile dropdown that terminates the demo session and returns to `#/`.
   - **Session Storage**: Non-sensitive demo session profile stored in `sessionStorage` (cleared on browser tab close or logout; no credentials or passwords stored).

---

## Backend Developer Hand-off / Integration Checklist

When the backend developer is ready to wire the client to live services, the following contracts should be established:

- [ ] **Authentication API**:
  - `POST /api/auth/login`: Accepts credentials and returns JWT Bearer token or sets `HttpOnly` session cookie.
  - `POST /api/auth/signup`: Validates new user registration, hashes passwords (bcrypt/argon2), and creates user profile.
  - `GET /api/auth/me`: Resolves current authenticated session user profile and status.
  - `POST /api/auth/logout`: Invalidates session/token.
- [ ] **Email REST API**: Endpoints for fetching folder threads, updating read/starred status, trashing emails, and multipart dispatch (`/api/emails`).
- [ ] **Chat REST & WebSockets**:
  - Initial message history and channel listings (`/api/conversations`).
  - Real-time WebSocket event contract:
    - Client emit: `message:send`, `typing:start`, `typing:stop`, `presence:set`.
    - Server broadcast: `message:new`, `message:ack`, `presence:update`.
- [ ] **Contacts API**: Directory listing and search query endpoints (`/api/contacts`).
- [ ] **File Storage & Uploads**: S3 / cloud presigned URL upload flow or direct multipart endpoint (`/api/files/upload`).
- [ ] **Push / SSE Notifications**: Stream for real-time notifications (`/api/notifications/stream`).
