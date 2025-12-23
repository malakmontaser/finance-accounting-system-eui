#!/bin/sh
# Replace $PORT in nginx.conf template
sed -i "s/\${PORT}/${PORT:-80}/g" /etc/nginx/conf.d/default.conf

# Start nginx
nginx -g "daemon off;"
