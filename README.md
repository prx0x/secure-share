# SecureShare

A secure file-sharing platform built with **React, TypeScript, FastAPI, and PostgreSQL**, featuring user authentication, group collaboration, and permission-based access control.

<p align="center">
  <a href="https://secure-share-brown.vercel.app"><strong>Live Demo</strong></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/prx0x/secure-share"><strong>GitHub Repository</strong></a>
</p>

---

## About

SecureShare provides a centralized platform for managing and sharing files with granular access permissions.

Users can upload files, share them with individuals or groups, manage permissions, and access their files through a clean dashboard.

**Deployment status:** The live website is deployed using the `deploy/vercel-cloudinary-neon` branch. The default `main` branch contains the original implementation, which uses local filesystem storage. The deployment branch includes Cloudinary integration and deployment-specific configuration.

**[Visit SecureShare](https://secure-share-brown.vercel.app)**

---

## Features

- **User Authentication** — Account registration, login, bcrypt password hashing, and JWT-based authentication.
- **File Management** — Upload, download, search, update, and delete files.
- **Individual Sharing** — Share files directly with other registered users.
- **Group Collaboration** — Create groups, add members, and share files with entire groups.
- **Permission Management** — Grant, update, view, and revoke file permissions.
- **Dashboard** — View owned files, shared files, and recently uploaded files.
- **Audit Logging** — Track important file operations and access-management activities.

---

## Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| UI & Animation | Framer Motion, Lucide React |
| Routing | React Router |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Validation | Pydantic |
| Authentication | JWT, bcrypt |
| Hosting | Vercel |
| Deployment Database | Neon |
| Deployment File Storage | Cloudinary |

---

## Architecture

SecureShare follows a client-server architecture consisting of three primary layers.

**Frontend**
- Built with React and TypeScript.
- Handles authentication, file management, sharing, and group interfaces.
- Communicates with the backend through REST APIs.
- Uses protected routes for authenticated pages.

**Backend**
- Built using FastAPI.
- Handles authentication, validation, file operations, and authorization.
- Enforces file ownership and sharing permissions.
- Maintains audit logs for important actions.

**Database**
- PostgreSQL stores user accounts, file metadata, groups, memberships, and permissions.
- SQLAlchemy manages database operations.

### File Storage

The storage implementation differs between branches:

| Branch | File Storage |
|---|---|
| `main` | Local filesystem |
| `deploy/vercel-cloudinary-neon` | Cloudinary |

The deployment branch uses signed direct uploads. The backend generates upload signatures, the browser uploads files directly to Cloudinary, and the backend verifies the uploaded assets before storing their metadata in PostgreSQL.

---

## Permission System

SecureShare supports three permission levels:

| Permission | Access |
|---|---|
| `READ` | Download and read files |
| `WRITE` | Update files; also permits read access |
| `DELETE` | Delete files |

Permissions can be assigned directly to individual users or through groups.

File owners can manage sharing permissions for their files, while group owners control group membership.

The backend performs authorization checks before allowing protected file operations.

---

## Project Structure

```text
secure-share/
│
├── backend/
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── security.py
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.ts
│
├── storage/
│   └── .gitignore
│
└── README.md
```

---

## Getting Started

The following instructions are for running the **`main` branch** locally.

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/)
- [Python](https://www.python.org/) (3.10 or newer)
- [PostgreSQL](https://www.postgresql.org/)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/prx0x/secure-share.git
cd secure-share
git switch main
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it:

**Windows:**
```powershell
.venv\Scripts\Activate.ps1
```

**Linux / macOS:**
```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

### 3. Environment Variables

Create a `.env` file inside the `backend/` directory:

```env
DATABASE_URL=postgresql://USERNAME:PASSWORD@HOST:5432/DATABASE
JWT_SECRET=your-strong-random-secret
```

Replace the placeholders with your PostgreSQL credentials and a strong, randomly generated JWT secret.

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign and verify JWTs |

**Important:** Never commit your `.env` file or expose your credentials publicly.

### 4. Start the Backend

Run the following command from the `backend/` directory:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The backend will be available at:

- API: `http://127.0.0.1:8000`
- Swagger Documentation: `http://127.0.0.1:8000/docs`
- OpenAPI Schema: `http://127.0.0.1:8000/openapi.json`

The application creates the required database tables on startup.

### 5. Frontend Setup

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside `frontend/`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### 6. Start the Frontend

```bash
npm run dev
```

Open the application:

**http://localhost:5173**

---

## API Overview

Protected endpoints require a JWT bearer token:

```http
Authorization: Bearer <access_token>
```

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/users` | Register a user |
| POST | `/login` | Authenticate and obtain a token |

### File Management

| Method | Endpoint | Description |
|---|---|---|
| POST | `/files/upload` | Upload a file |
| GET | `/files` | List owned and shared files |
| GET | `/files/{file_id}` | Download a file |
| PUT | `/files/{file_id}` | Update a file |
| DELETE | `/files/{file_id}` | Delete a file |

### Sharing & Permissions

| Method | Endpoint | Description |
|---|---|---|
| POST | `/files/{file_id}/share/user` | Share with a user |
| POST | `/files/{file_id}/share/group` | Share with a group |
| GET | `/files/{file_id}/permissions` | View file permissions |
| DELETE | `/files/{file_id}/share/user` | Revoke user permission |
| DELETE | `/files/{file_id}/share/group` | Revoke group permission |
| DELETE | `/files/{file_id}/permissions/user` | Remove user permission |
| DELETE | `/files/{file_id}/permissions/group` | Remove group permission |
| PUT | `/files/{file_id}/permissions/user` | Update user permission |
| PUT | `/files/{file_id}/permissions/group` | Update group permission |

### Group Management

| Method | Endpoint | Description |
|---|---|---|
| POST | `/groups` | Create a group |
| GET | `/groups` | List available groups |
| POST | `/groups/{group_id}/members/{user_id}` | Add a member |
| GET | `/groups/{group_id}/members` | List group members |
| DELETE | `/groups/{group_id}/members/{user_id}` | Remove a member |

For complete request and response schemas, visit the interactive Swagger documentation at `/docs` when the backend is running.

---

## Development Commands

Run these commands from the `frontend/` directory.

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build the frontend |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run Oxlint |

For backend dependencies:

```bash
pip install -r requirements.txt
```

---

## Deployment

The live application is deployed separately from the default development branch.

| Component | Deployment |
|---|---|
| Frontend | Vercel |
| Backend | Vercel |
| Database | Neon PostgreSQL |
| File Storage | Cloudinary |

### Branch Information

- **`main`** — Original application implementation with local filesystem storage.
- **`deploy/vercel-cloudinary-neon`** — Deployment-oriented implementation with Cloudinary integration and hosted environment configuration.

The live website uses the deployment branch:

**[https://secure-share-brown.vercel.app](https://secure-share-brown.vercel.app)**

---

## Security Considerations

SecureShare incorporates several security mechanisms:

- Passwords are hashed using bcrypt.
- JWTs are used for authenticated API requests.
- Backend authorization checks protect file operations.
- File ownership is verified before sharing and permission management.
- Group membership is controlled by group owners.
- Deployment uploads use server-generated Cloudinary signatures and private asset delivery.

SecureShare is a software project and does not claim security certification or regulatory compliance. A security review is recommended before using it for sensitive or production-critical data.

---

## Contributing

Contributions, bug reports, and suggestions are welcome.

1. Fork the repository.
2. Create a new feature branch from `main`.
3. Make your changes.
4. Run the relevant checks.
5. Submit a pull request with a clear description.

Please do not commit credentials, database URLs, private files, or generated secrets.

---

## License

No license file is currently included in this repository. Unless a license is added, no explicit permission for reuse, modification, or redistribution is granted.

---

<p align="center">
  <strong>SecureShare</strong><br>
  Manage files. Control access. Share securely.
</p>
