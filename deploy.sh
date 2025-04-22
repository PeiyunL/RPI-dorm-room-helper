#!/bin/bash

# Step 1: Go into frontend and build
cd frontend || { echo "❌ Cannot find frontend directory"; exit 1; }

echo "🛠️  Building project..."
npm run build || { echo "❌ Build failed"; exit 1; }

# Step 2: Go back to project root
cd ..

# Step 3: Upload only contents of dist/ to server
echo "📦  Uploading build to server..."
scp -r frontend/dist/* lip6@rpidorms.cs.rpi.edu:~/dist-temp || { echo "❌ SCP failed"; exit 1; }

# Step 4: SSH and deploy
echo "🚀  Deploying on server..."
ssh -tt lip6@rpidorms.cs.rpi.edu <<EOF
  echo "🔐 Enter your sudo password below:"
  sudo cp -r ~/dist-temp/* /var/www/html/
  sudo rm -rf ~/dist-temp
  sudo systemctl restart apache2
  echo "✅ Deployment complete and Apache restarted!"
  exit
EOF
