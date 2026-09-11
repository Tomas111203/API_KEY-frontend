# Security API Exercise — Frontend & Reverse Proxy

This repository provides a containerized web frontend protected by an **Nginx reverse proxy** integrated with **LDAP Authentication** and **Automatic API Key Rotation**.

The Nginx reverse proxy injects sensitive `x-api-key` headers on server-side requests forwarded to both the main Backend API (`/api/`) and the LDAP Authentication API (`/ldap/`). This architecture prevents API keys from being exposed to client-side JavaScript or browser network tools.

---

## 🌐 Architecture Overview

```text
                                +-------------------+
                                |    User Browser   |
                                +---------+---------+
                                          |
                        http://localhost:8085 (HTTP/80)
                                          v
                                +-------------------+
                                |   Nginx Frontend  |
                                |  + rotate_key.py  |
                                +----+---------+----+
                                     |         |
                  /api/ (Injected    |         | /ldap/ (Injected
                  x-api-key Header)  |         | x-api-key Header)
                                     v         v
                      +------------------+ +------------------+
                      | FastAPI Backend  | |  LDAP FastAPI    |
                      | (SQLite Encrypted| | (Auth API)       |
                      |      Data)       | +--------+---------+
                      +------------------+          | LDAP :389
                                                    v
                                           +------------------+
                                           | OpenLDAP Server  |
                                           +------------------+
```

### Key Components:
1. **Frontend UI (`login.html` & `index.html`)**:
   - `login.html`: Login layout for entering LDAP credentials (`alice` / `alice123` or `bob` / `bob123`).
   - `index.html`: Main console for SQL database encryption/decryption, guarded by LDAP session authentication.
2. **Nginx Reverse Proxy**:
   - Proxies `/api/` requests to `fastapi_backend:8000`.
   - Proxies `/ldap/` requests to `ldap-api:8000`.
   - Automatically injects `x-api-key` header server-side.
3. **Automatic Secret Rotation (`rotate_key.py`)**:
   - Runs as a background daemon every 2 minutes (120 seconds).
   - Generates a new `API_SECRET`, updates `/shared/api_secret.txt`, updates Nginx configuration, and gracefully reloads Nginx.
4. **LDAP Authentication Service (`ldap-api`)**:
   - Validates `x-api-key` dynamically against `/shared/api_secret.txt`.
   - Authenticates credentials against the `openldap` container.

---

## 🔒 Security Features

- **Client-Side Key Erasure**: JavaScript sends keyless requests; Nginx handles secret injection.
- **Dynamic API Key Rotation**: Keys rotate every 120 seconds without service downtime.
- **Shared Volume Sync**: Both `fastapi_backend` and `ldap-api` share `/shared/api_secret.txt` to validate rotated keys instantaneously.
- **Session Protection**: `index.html` requires an active LDAP session in `sessionStorage`.

---

## 📁 Repository Structure

```text
frontend API_KEY/
├── .env                  # Local environment configuration
├── .env.example          # Environment template file
├── Dockerfile            # Nginx Alpine container with Python & gettext
├── docker-compose.yml    # Orchestrates frontend, backend, openldap, and ldap-api
├── docker-entrypoint.sh  # Startup script & background daemon launcher
├── nginx.conf.template   # Nginx template configuration
├── rotate_key.py         # 2-minute key rotation daemon
├── login.html            # LDAP Login layout UI
├── login.js              # LDAP authentication handler & session redirect
├── index.html            # Main encryption console & session guard
├── app.js                # Main application logic & user logout handler
└── styles.css            # Unified design system stylesheet
```

---

## 🚀 Quick Start Guide

### 1. Launch All Services with Docker Compose

From the `frontend API_KEY` directory, run:

```bash
docker compose down -v
docker compose up -d --build
```

### 2. Access in Browser

Open your browser and navigate to:
**`http://localhost:8085`**

You will be presented with the **LDAP Login Page**.

### 3. Test Credentials

Use sample lab credentials:
- **Username**: `alice` | **Password**: `alice123`
- **Username**: `bob` | **Password**: `bob123`

Upon successful authentication, you will be redirected to `index.html` where you can interact with the SQL database encryption/decryption functions.

---

## 🔍 Key Rotation Verification

### 1. Monitor Key Rotation Logs
Watch the rotation daemon in real-time:
```bash
docker logs -f nginx_frontend
```
You will see a new `API_SECRET` generated every 2 minutes:
```text
[KEY ROTATION 🔄 2026-09-10 20:00:00] New API_SECRET generated: rotated-secret-a1b2c3d4e5f67890
```

### 2. Verify Key Sync inside LDAP Container
Inspect the active secret inside the LDAP container:
```bash
docker exec ldap-api cat /shared/api_secret.txt
```
Run it again after 2 minutes to confirm the key has updated without container restarts.

### 3. Verify Unauthorized Rejection (HTTP 401)
Attempt to call the LDAP login endpoint directly without Nginx injection using a wrong key:
```bash
curl -i -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -H "x-api-key: invalid-key" \
  -d '{"username":"alice","password":"alice123"}'
```
**Expected Response:** `401 Unauthorized`.

### 4. Verify Proxy Injected Success (HTTP 200)
Call through Nginx (which injects the rotated key):
```bash
curl -i -X POST http://localhost:8085/ldap/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"alice123"}'
```
**Expected Response:** `200 OK` with `"authenticated": true`.