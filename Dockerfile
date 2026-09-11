# Use official lightweight Nginx image based on Alpine Linux
FROM nginx:alpine

# Install gettext (envsubst) and python3 for the rotation script
RUN apk add --no-cache gettext python3

# Set working directory in Nginx static html folder
WORKDIR /usr/share/nginx/html

# Copy static frontend files to Nginx web root directory
COPY index.html ./index.html
COPY login.html ./login.html
COPY app.js ./app.js
COPY login.js ./login.js
COPY styles.css ./styles.css

# Copy Nginx template configuration file
COPY nginx.conf.template /etc/nginx/templates/nginx.conf.template

# Copy rotation script
COPY rotate_key.py /app/rotate_key.py
RUN chmod +x /app/rotate_key.py

# Copy and set execution permissions for the custom entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose HTTP port 80
EXPOSE 80

# Configure entrypoint and startup command
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
