# Frontend API Key Authentication with Nginx & Docker

This repository provides a containerized web frontend protected by an **Nginx reverse proxy**. The proxy injects sensitive `x-api-key` headers on server-side requests forwarded to the backend API. This security architecture prevents API keys from being exposed to client-side JavaScript or browser network tools.

---

## 🌐 Networking Architecture

### 1. Accessing Frontend from Your Browser (Port Mapping)
The container maps host port `8085` on your computer to port `80` inside the Nginx container:
```yaml
ports:
  - "8085:80"  # Format: "HOST_PORT:CONTAINER_PORT"
```
When you open **`http://localhost:8085`** in your browser, your request reaches Nginx serving the static frontend files (`index.html`, `app.js`, `styles.css`).

> **Note**: Port `8085` is used on host to avoid port conflicts with services like Oracle DB (port 8080). You can change the left side (`HOST_PORT`) in `docker-compose.yml` to any free port without modifying the Dockerfile.

### 2. Connecting Docker Nginx to Local Uvicorn Backend
Inside a Docker container, `127.0.0.1` refers to the container itself.
To reach Uvicorn running natively on your machine on port `8000`:
- Set **`BACKEND_HOST=host.docker.internal`** in `.env`.
- `host.docker.internal` resolves to your host machine's IP address.
- Nginx proxies `/api/` requests to `http://host.docker.internal:8000/api/` while attaching the `x-api-key` header.

---

## 🔒 Security Features

1. **Server-Side API Key Injection**: Client JavaScript (`app.js`) sends keyless requests to relative path `/api/data`.
2. **Reverse Proxy Masking**: Nginx receives `/api/` requests, injects `proxy_set_header x-api-key "${API_KEY}";`, and forwards them to the backend server.
3. **Environment Secret Management**: Sensitive credentials are read from `.env` instead of being hardcoded.
4. **Git Protection**: `.env` is listed in `.gitignore` to prevent secret leaks to version control repositories.

---

## 📁 Repository Structure

```text
├── .env                  # Local secret configuration (ignored by Git)
├── .env.example          # Template environment file (committed to Git)
├── .gitignore            # Git exclusion list
├── Dockerfile            # Nginx Alpine container definition
├── docker-compose.yml    # Docker Compose orchestration
├── docker-entrypoint.sh  # Startup script for envsubst variable injection
├── nginx.conf.template   # Nginx template configuration
├── index.html            # User interface HTML
├── app.js                # Client logic (API key free)
└── styles.css            # Application stylesheet
```

---

## 🚀 Quick Start Guide

### 1. Start your local Uvicorn backend
In your backend directory, ensure Uvicorn is running:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 2. Configure Environment Variables
Copy `.env.example` to create your local `.env` file:
```bash
cp .env.example .env
```
Ensure your `.env` contains:
```env
API_KEY=security-exercise-key-2026
BACKEND_HOST=host.docker.internal
BACKEND_PORT=8000
```

### 3. Build and Launch Frontend Container
```bash
docker compose up --build
```

### 4. Access in Browser
Open your browser and navigate to:
**`http://localhost:8085`**

---

## 🔍 Verification

1. Open Browser Developer Tools (**F12**) -> **Network** tab.
2. Click **GET Protected Data** or **POST Send Request**.
3. Inspect outgoing requests: verify that **no `x-api-key` header** is sent from the browser.
4. Nginx forwards the request to `http://host.docker.internal:8000/api/data` with the injected `x-api-key` header.