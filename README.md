# SecureShare

**SecureShare** is a file-sharing application built around user accounts, group-based collaboration, and permission-controlled access. It lets users upload and manage files, share them with other users or groups, and control what recipients are allowed to do.

<p align="center">
  <a href="https://secure-share-brown.vercel.app">Live Website</a>
  ·
  <a href="https://github.com/prx0x/secure-share">Source Code</a>
</p>

## Deployment Status

The live website is currently deployed from the **`deploy/vercel-cloudinary-neon`** branch.

The default **`main`** branch contains the original application implementation, which uses local filesystem storage for uploaded files. The deployment branch contains the storage and configuration changes required for the hosted version, including Cloudinary-backed file storage and deployment-specific environment configuration.

The branches are intentionally documented separately here: the local setup and architecture below describe **`main`**, not the deployment branch.

**Open the live application:** https://secure-share-brown.vercel.app

## Features

### User accounts and authentication
- Register with a username, email address, and password.
- Log in using a username and password.
- Hash passwords with bcrypt before saving them to the database.
- Authenticate protected API requests with JWT bearer tokens.
- Protect application pages through frontend route guards.

### File management
- Upload files through the application.
- View files owned by the current user.
- View files shared directly or through groups.
- Search and filter files by filename.
- Download files after the backend verifies access.
- Replace an existing file.
- Delete files and their associated local storage objects.
- Enforce a 20 MB maximum size for new uploads.

### Sharing and access control
- Share files with individual users.
- Share files with groups.
- Assign permissions to users and groups.
- View the permissions currently assigned to a file.
- Update or revoke user and group permissions.
- Enforce file access permissions on the backend.

The supported permission values are `READ`, `WRITE`, and `DELETE`.

### Groups
- Create groups.
- Add existing users by their SecureShare user ID.
- View group members.
- Remove members from a group.
- Restrict membership management to the group owner.

### Dashboard
- View counts for owned files and files shared with the user.
- See recently added files.
- Navigate to file, shared-file, and group management pages.

### Audit logging
The backend records key actions such as uploads, downloads, updates, deletions, sharing operations, membership changes, and permission management in an audit-log table.

## Technology Stack

| Area | Technologies |
|---|---|
| Frontend | React 19, TypeScript |
| Build tooling | Vite |
| Styling | Tailwind CSS 4 |
| UI and animation | Framer Motion, Lucide React |
| Routing | React Router |
| Backend API | Python, FastAPI |
| Request/response validation | Pydantic |
| ORM | SQLAlchemy |
| Database | PostgreSQL |
| Password hashing | bcrypt |
| Authentication | JSON Web Tokens (PyJWT) |
| Local file storage (`main`) | Server filesystem |
| Hosting for live version | Vercel |
| Hosted database for deployment version | Neon |
| Hosted file storage for deployment version | Cloudinary |

## Application Architecture

The project is split into a React frontend and a FastAPI backend.

- **Frontend:** provides registration, login, dashboard, file management, sharing, permissions, and group-management interfaces.
- **Backend:** exposes REST endpoints, validates input, authenticates users, checks authorization, manages database records, and handles file operations.
- **PostgreSQL:** stores users, file metadata, groups, memberships, sharing permissions, roles, and audit logs.
- **Local storage on `main`:** stores uploaded file bytes in the repository-level `storage/` directory. The database stores the corresponding storage path and ownership metadata.

### File upload flow in `main`

1. The user selects a file in the frontend.
2. The frontend sends the file to the backend as multipart form data.
3. FastAPI reads the upload, checks the new-upload size limit, and writes the contents to a uniquely named file in `storage/`.
4. The backend creates a database record containing the original filename, storage path, and owner ID.
5. The frontend refreshes the file list.

### File download flow

1. The frontend requests a file by its ID.
2. The backend checks whether the authenticated user is allowed to read it.
3. If access is allowed, FastAPI streams the stored file as a download response.
4. The backend records the download action in the audit log.

### Sharing and authorization

Permissions are stored separately for direct user shares and group shares. For protected file operations, the backend checks file ownership, applicable role permissions, direct user permissions, and group membership/permissions as implemented by the authorization layer.

Frontend route guards improve the user experience, but the backend remains responsible for enforcing access to protected resources.

## Repository Structure

`~`text
secure-share/
├── backend/
│   ├── database.py          # PostgreSQL connection and SQLAlchemy sessions
│   ├── main.py              # FastAPI app and REST API endpoints
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic request and response schemas
│   ├── security.py          # Password hashing, JWT, authorization, audit logs
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── public/              # Static public assets
│   ├── src/
│   │   ├── components/      # Reusable UI, file, layout, and permission components
│   │   ├── hooks/           # Authentication and toast context/hooks
│   │   ├── pages/           # Dashboard, Files, Shared, Groups, Login, Register
│   │   ├── routes/          # Protected and public route guards
│   │   ├── services/        # API, auth, file, group, and permission services
│   │   ├── types/           # Shared TypeScript types
│   │   └── utils/           # Formatting and authentication utilities
│   ├── package.json
│   └── vite.config.ts
├── storage/
│   └── .gitignore           # Keeps locally uploaded files out of Git
└── README.md
`~`

## Getting Started

These instructions run the **`main`** branch locally.

### Prerequisites

- Git
- Node.js and npm (use a version compatible with the Vite version in `frontend/package.json`)
- Python 3.10 or newer
- PostgreSQL, either locally or through a hosted PostgreSQL provider

### 1. Clone the repository

`~`bash
git clone https://github.com/prx0x/secure-share.git
cd secure-share
git switch main
`~`

### 2. Configure the backend

Open a terminal in the repository and move into the backend directory:

`~`bash
cd backend
python -m venv .venv
`~`

Activate the virtual environment.

**Windows PowerShell**

`~`powershell
.\.venv\Scripts\Activate.ps1
`~`

**Linux / macOS**

`~`bash
source .venv/bin/activate
`~`

Install the backend dependencies:

`~`bash
pip install -r requirements.txt
`~`

Create a `.env` file inside the `backend/` directory:

`~`dotenv
DATABASE_URL=postgresql://USERNAME:PASSWORD@HOST:5432/DATABASE
JWT_SECRET=replace-with-a-long-random-secret
`~`

Replace the placeholders with your actual PostgreSQL credentials and a strong, randomly generated JWT secret.

The backend loads environment variables from this file through `python-dotenv`.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret key used to sign and verify JWTs |

Do not commit your `.env` file or share these values publicly.

### 3. Start the backend

Run the following command from the **`backend/` directory**, with the virtual environment active:

`~`bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
`~`

The application creates the database tables on startup through SQLAlchemy's `Base.metadata.create_all`.

The API will be available locally at:

- API root: http://127.0.0.1:8000/
- Interactive Swagger documentation: http://127.0.0.1:8000/docs
- OpenAPI schema: http://127.0.0.1:8000/openapi.json

### 4. Configure the frontend

Open a second terminal, return to the repository root, and enter the frontend directory:

`~`bash
cd frontend
npm install
`~`

Create a `.env` file inside `frontend/`:

`~`dotenv
VITE_API_BASE_URL=http://127.0.0.1:8000
`~`

This tells the frontend where the local FastAPI server is running.

### 5. Start the frontend

From the `frontend/` directory:

`~`bash
npm run dev
`~`

Open the application at http://localhost:5173.

## Development Commands

Run frontend commands from the `frontend/` directory.

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Run TypeScript build checks and create the production bundle |
| `npm run preview` | Preview the built frontend locally |
| `npm run lint` | Run Oxlint |

For backend dependency installation, run:

`~`bash
pip install -r requirements.txt
`~`

## API Reference

All API routes are served by the FastAPI application. Protected routes require a JWT bearer token in the `Authorization` header:

`~`http
Authorization: Bearer <access_token>
`~`

The main endpoints are listed below.

### Authentication and users

| Method | Endpoint | Description | Auth required |
|---|---|---|---|
| `POST` | `/users` | Register a user | No |
| `POST` | `/login` | Authenticate and receive an access token | No |

### Files

| Method | Endpoint | Description | Auth required |
|---|---|---|---|
| `POST` | `/files/upload` | Upload a file using multipart form data | Yes |
| `GET` | `/files` | List owned and shared files | Yes |
| `GET` | `/files/{file_id}` | Check access and download a file | Yes |
| `PUT` | `/files/{file_id}` | Replace a file's contents | Yes |
| `DELETE` | `/files/{file_id}` | Delete a file | Yes |

### File sharing and permissions

| Method | Endpoint | Description | Auth required |
|---|---|---|---|
| `POST` | `/files/{file_id}/share/user` | Share a file with a user | Yes |
| `POST` | `/files/{file_id}/share/group` | Share a file with a group | Yes |
| `GET` | `/files/{file_id}/permissions` | List permissions for a file | Yes |
| `DELETE` | `/files/{file_id}/share/user` | Revoke a user's share permission | Yes |
| `DELETE` | `/files/{file_id}/share/group` | Revoke a group's share permission | Yes |
| `DELETE` | `/files/{file_id}/permissions/user` | Remove a user's permission entry | Yes |
| `DELETE` | `/files/{file_id}/permissions/group` | Remove a group's permission entry | Yes |
| `PUT` | `/files/{file_id}/permissions/user` | Update a user's permission | Yes |
| `PUT` | `/files/{file_id}/permissions/group` | Update a group's permission | Yes |

### Groups

| Method | Endpoint | Description | Auth required |
|---|---|---|---|
| `POST` | `/groups` | Create a group | Yes |
| `GET` | `/groups` | List groups owned by or joined by the user | Yes |
| `POST` | `/groups/{group_id}/members/{user_id}` | Add a user to a group | Yes |
| `GET` | `/groups/{group_id}/members` | List a group's members | Yes |
| `DELETE` | `/groups/{group_id}/members/{user_id}` | Remove a user from a group | Yes |

The interactive API documentation at `/docs` exposes the request schemas and response models for the running backend.

## Permission Model

SecureShare defines three permission levels:

| Permission | Intended capability |
|---|---|
| `READ` | Read/download a file |
| `WRITE` | Replace/update a file; the backend also accepts WRITE for read access |
| `DELETE` | Delete a file |

Permissions can be assigned to an individual user or to a group. Group-based access depends on the user's membership in that group.

The backend applies additional ownership rules:

- File owners can manage sharing and permission assignments for their files.
- Group owners can add and remove group members.
- Users who are neither owners nor authorized recipients cannot access protected files.

## File Storage in `main`

The default branch uses local filesystem storage.

- Uploaded file contents are written under the repository's top-level `storage/` directory.
- The database stores each file's original name, storage path, owner ID, and creation timestamp.
- The `storage/.gitignore` file prevents uploaded content from being added to Git.
- New uploads are limited to 20 MB by the backend upload endpoint.

**Deployment consideration:** local filesystem storage is intended for local development or a persistent server environment. It should not be assumed to work as durable storage on ephemeral/serverless hosting, where local files may not persist across instances or deployments. The deployed website therefore uses the separate deployment branch, which changes the file-storage integration.

## Deployment Branch

The hosted application is maintained separately from the default branch:

- **Default branch:** `main` — original local-storage implementation and local development setup.
- **Deployment branch:** `deploy/vercel-cloudinary-neon` — deployment-oriented implementation, including Cloudinary-backed private file storage and hosted environment configuration.
- **Live website:** https://secure-share-brown.vercel.app

The deployment branch uses a signed direct-upload flow: the backend authorizes and signs upload parameters, the browser sends file bytes to Cloudinary, and the backend verifies the uploaded asset before saving its metadata in PostgreSQL.

The backend website/API address is intentionally not listed here. Use the live frontend website link above to access the application.

## Security Considerations

- Passwords are hashed using bcrypt instead of being stored in plaintext.
- JWT signing and verification happen on the backend.
- Protected API operations use bearer-token authentication.
- File access is checked by the backend before download, update, or deletion.
- Sharing and membership operations apply ownership checks.
- Uploaded file data is excluded from Git through the storage directory's ignore rule.

This repository is a software project and is not a claim of security certification or regulatory compliance. Before using it for sensitive or production-critical files, review the implementation for your threat model and consider adding rate limiting, stronger operational logging and monitoring, backups, malware scanning, and additional input validation.

## Contributing

Contributions, bug reports, and suggestions are welcome.

1. Fork the repository.
2. Create a focused feature branch from `main`.
3. Make your changes.
4. Run the relevant checks locally.
5. Open a pull request with a clear explanation of the change.

Please do not commit credentials, database connection strings, private uploads, or generated secrets.

## License

No license file is currently present in this repository. Until a license is added, the project should not be assumed to grant permission for reuse, modification, or redistribution.
