#!/usr/bin/env python3
"""
Automatic Key Rotation Daemon (Phase C)
=======================================
Runs every 2 minutes (120 seconds).
Regenerates API_SECRET, updates shared file and Nginx configuration in-place, and reloads Nginx.
NEVER touches DATABASE_ENCRYPTION_KEY.
"""

import os
import secrets
import subprocess
import sys
import time
from pathlib import Path

SHARED_DIR = Path(os.getenv("SHARED_DIR", "/shared"))
SHARED_DIR.mkdir(parents=True, exist_ok=True)
SECRET_FILE = SHARED_DIR / "api_secret.txt"

NGINX_TEMPLATE = Path("/etc/nginx/templates/nginx.conf.template")
NGINX_CONF = Path("/etc/nginx/conf.d/default.conf")

ROTATION_INTERVAL_SECONDS = 120  # 2 minutes

def update_nginx_config(secret: str):
    backend_host = os.getenv("BACKEND_HOST", "backend")
    backend_port = os.getenv("BACKEND_PORT", "8000")
    ldap_host = os.getenv("LDAP_HOST", "ldap-api")
    ldap_port = os.getenv("LDAP_PORT", "8000")
    
    if NGINX_TEMPLATE.exists():
        template_content = NGINX_TEMPLATE.read_text()
        conf_content = template_content.replace("${BACKEND_HOST}", backend_host).replace("$BACKEND_HOST", backend_host)
        conf_content = conf_content.replace("${BACKEND_PORT}", backend_port).replace("$BACKEND_PORT", backend_port)
        conf_content = conf_content.replace("${LDAP_HOST}", ldap_host).replace("$LDAP_HOST", ldap_host)
        conf_content = conf_content.replace("${LDAP_PORT}", ldap_port).replace("$LDAP_PORT", ldap_port)
        conf_content = conf_content.replace("${API_KEY}", secret).replace("$API_KEY", secret)
        conf_content = conf_content.replace("${API_SECRET}", secret).replace("$API_SECRET", secret)
        NGINX_CONF.write_text(conf_content)
        
        # Reload Nginx gracefully without downtime
        try:
            subprocess.run(["nginx", "-s", "reload"], check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            pass

def rotate_key():
    new_secret = f"rotated-secret-{secrets.token_hex(8)}"
    SECRET_FILE.write_text(new_secret)
    update_nginx_config(new_secret)
    print(f"[KEY ROTATION 🔄 {time.strftime('%Y-%m-%d %H:%M:%S')}] New API_SECRET generated: {new_secret}", flush=True)
    print("[KEY ROTATION 🔒] DATABASE_ENCRYPTION_KEY remains UNTOUCHED and SECURE.", flush=True)

def main():
    print("Starting Automatic Secret Rotation Daemon (Interval: 2 minutes)...", flush=True)
    
    initial_secret = os.getenv("API_SECRET", os.getenv("API_KEY", "security-exercise-key-2026"))
    SECRET_FILE.write_text(initial_secret)
    update_nginx_config(initial_secret)
    print(f"[KEY ROTATION 🚀] Initialized API_SECRET: {initial_secret}", flush=True)

    while True:
        try:
            time.sleep(ROTATION_INTERVAL_SECONDS)
            rotate_key()
        except KeyboardInterrupt:
            print("Stopping rotation daemon...", flush=True)
            sys.exit(0)
        except Exception as e:
            print(f"[KEY ROTATION ERROR ⚠️] {e}", flush=True)

if __name__ == "__main__":
    main()
