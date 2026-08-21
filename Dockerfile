# Use official lightweight Nginx image based on Alpine Linux
FROM nginx:alpine

# Install gettext to ensure envsubst utility is available
RUN apk add --no-cache gettext

# Set working directory in Nginx static html folder
WORKDIR /usr/share/nginx/html

# Copy static frontend files to Nginx web root directory
COPY index.html ./index.html
COPY app.js ./app.js
COPY styles.css ./styles.css

# Copy Nginx template configuration file
COPY nginx.conf.template /etc/nginx/templates/nginx.conf.template

# Copy and set execution permissions for the custom entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose HTTP port 80
EXPOSE 80

# Configure entrypoint and startup command
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
