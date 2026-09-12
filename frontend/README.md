## Frontend (local development)

```bash
cd frontend
cp .env.example .env   # VITE_API_BASE_URL=http://localhost:8000
npm install
npm run dev
```

The Vite app runs at `http://localhost:5173` and calls the FastAPI backend at `VITE_API_BASE_URL`.

The backend must allow the frontend origin via CORS (already configured for `http://localhost:5173` and `http://127.0.0.1:5173`).
