#!/bin/sh
# Replace placeholders in nginx.conf template
echo "Configuring Nginx to listen on port ${PORT:-80} and proxy to ${BACKEND_URL}:${BACKEND_PORT:-5000}..."
sed -i "s!{{PORT}}!${PORT:-80}!g" /etc/nginx/conf.d/default.conf
sed -i "s!{{BACKEND_URL}}!${BACKEND_URL}!g" /etc/nginx/conf.d/default.conf
sed -i "s!{{BACKEND_PORT}}!${BACKEND_PORT:-5000}!g" /etc/nginx/conf.d/default.conf

# Start nginx
exec nginx -g "daemon off;"
