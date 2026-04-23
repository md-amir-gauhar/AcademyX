#!/bin/sh
# Startup script for Render deployment

echo "==> Starting Queztlearn Service"
echo "PORT: ${PORT:-3000}"
echo "NODE_ENV: ${NODE_ENV:-development}"

# Start the Node.js application
exec node dist/index.js
