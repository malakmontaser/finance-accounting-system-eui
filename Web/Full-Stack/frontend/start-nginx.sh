#!/bin/sh
# Replace PORT_PLACEHOLDER in nginx.conf template
echo "Configuring Nginx to listen on port ${PORT:-80}..."
sed -i "s/PORT_PLACEHOLDER/${PORT:-80}/g" /etc/nginx/conf.d/default.conf

# Start nginx
exec nginx -g "daemon off;"
