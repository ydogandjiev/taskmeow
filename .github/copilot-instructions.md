# Copilot Instructions for Taskmeow

## Build, Test, and Lint

```bash
yarn install           # Install dependencies
yarn start             # Run client (CRA on :3000) and server (Express on :3001) concurrently
yarn client            # Run only the React dev server
yarn server            # Run only the Express server with nodemon
yarn build             # Production build: React app → server/build/, then Vite builds the MCP widget
yarn test              # Run all tests (jest, non-interactive)
yarn lint              # ESLint across the project
yarn lint:fix          # ESLint with auto-fix
yarn format            # Prettier across the project
```

Run a single test file:

```bash
npx react-scripts test --env=jest-environment-jsdom-global --watchAll=false -- src/services/tasks.service.test.js
```

## Architecture

Taskmeow is a todo list app that showcases the Microsoft Teams Platform. It has a split client/server architecture in a single repo:

- **`src/`** — React 17 frontend (class components) using Office UI Fabric React and react-router-dom v6. Built with Create React App. The dev server proxies API calls to Express on port 3001.
- **`server/`** — Express 5 backend using ES modules (`import`/`export`). Connects to MongoDB via Mongoose. Serves the production build from `server/build/`.
- **`mcp-widget/`** — Standalone embeddable widget built with Vite (`vite-plugin-singlefile`), outputs `server/build/embed.html`. This is an MCP (Model Context Protocol) app resource served by the MCP server.
- **`manifest/`** — Teams app manifest packages for different environments (int, prod, sso-int, sso-prod).

### Client Service Strategy Pattern

Both `src/services/auth.service.js` and `src/services/tasks.service.js` use a **strategy pattern** that selects the implementation based on URL query parameters:

- **Auth**: `?useTest` → MockAuthService, `?inTeams` → TeamsAuthService, `?inTeamsSSO` → SSOAuthService, `?inTeamsMSAL` → MsalNAAAuthService, default → MsalAuthService
- **Tasks**: `?useTest` → MockTasksService, `?useGraph` → GraphTasksService, default → RestTasksService

When writing tests, the mock services are selected automatically (via `jest` global detection for auth, `?useTest` param for tasks).

### Server API Layers

The server exposes multiple API surfaces, all authenticated via Azure AD (passport-azure-ad):

- **REST** (`/api/*`) — Standard CRUD for tasks, users, groups. Protected by `authService.ensureAuthenticated()`.
- **GraphQL** (`/graphql`) — Alternative query interface using `express-graphql`.
- **MCP** (`/mcp`) — Model Context Protocol server using `@modelcontextprotocol/sdk`. Supports both API key and bearer token auth. Tools: `get_tasks`, `create_task`, `update_task`, `delete_task`, `show_tasks_widget`.
- **Bot** — Teams bot registered via Teams SDK at `/bot/messages`.
- **Slack** — Slack integration routes.

### Data Models (Mongoose)

Tasks have: `title` (required), `order`, `starred`, `conversationId`, `date`, `shareTag`, and belong to either a `user` or a `group`.

## Conventions

- Server files use ES module syntax (`import`/`export`). The server `package.json` sets `"type": "module"`.
- Frontend components are React class components (not hooks).
- Prettier and ESLint run automatically on staged files via husky + lint-staged.
- Environment variables are configured in `.env` at the repo root (see `.env.example`). Key prefixes: `APPSETTING_` for app config, `SQLCONNSTR_` for DB credentials.
- The `proxy` field in the root `package.json` forwards dev requests to `http://localhost:3001`.
