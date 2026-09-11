#!/bin/sh
set -e

# Provide default environment variable values if not defined externally
export API_SECRET="${API_SECRET:-${API_KEY:-security-exercise-key-2026}}"
export BACKEND_HOST="${BACKEND_HOST:-backend}"
export BACKEND_PORT="${BACKEND_PORT:-8000}"
export LDAP_HOST="${LDAP_HOST:-ldap-api}"
export LDAP_PORT="${LDAP_PORT:-8000}"

# Create shared directory and write initial secret
mkdir -p /shared
if [ ! -f /shared/api_secret.txt ]; then
    echo -n "$API_SECRET" > /shared/api_secret.txt
fi

# Substitute environment variables into Nginx configuration template
envsubst '$BACKEND_HOST $BACKEND_PORT $LDAP_HOST $LDAP_PORT $API_SECRET $API_KEY' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/conf.d/default.conf

# Launch key rotation background process (Fase C - runs every 2 minutes)
python3 /app/rotate_key.py &

# Execute the container's primary CMD process (e.g., nginx -g 'daemon off;')
exec "$@"

