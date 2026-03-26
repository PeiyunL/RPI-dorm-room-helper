#!/usr/bin/env bash
set -euo pipefail

SERVER_USER="${SERVER_USER:-lip6}"
SERVER_HOST="${SERVER_HOST:-rpidorms.cs.rpi.edu}"
SERVER_TMP_DIR="${SERVER_TMP_DIR:-~/dist-temp}"
SERVER_WEB_ROOT="${SERVER_WEB_ROOT:-/var/www/html}"

cd frontend || {
  echo "Cannot find frontend directory"
  exit 1
}

echo "Building frontend..."
npm run build

cd ..

echo "Uploading dist files..."
scp -r frontend/dist/* "${SERVER_USER}@${SERVER_HOST}:${SERVER_TMP_DIR}"

echo "Deploying on server..."
ssh -tt "${SERVER_USER}@${SERVER_HOST}" <<EOF
  sudo cp -r ${SERVER_TMP_DIR}/* ${SERVER_WEB_ROOT}/
  sudo rm -rf ${SERVER_TMP_DIR}
  sudo systemctl restart apache2
  echo "Deployment complete."
  exit
EOF
