#!/bin/sh
set -e

# Provide default environment variable values if not defined externally
export API_KEY="${API_KEY:-security-exercise-key-2026}"
export BACKEND_HOST="${BACKEND_HOST:-backend}"
export BACKEND_PORT="${BACKEND_PORT:-8000}"

# Substitute specific environment variables into Nginx configuration template.
# Explicitly listing variables prevents envsubst from clearing Nginx built-in variables like $host or $remote_addr.
envsubst '$API_KEY $BACKEND_HOST $BACKEND_PORT' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/conf.d/default.conf

# Execute the container's primary CMD process (e.g., nginx -g 'daemon off;')
exec "$@"
