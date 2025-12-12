#!/bin/bash

# Deploy frontend to Netlify with backend URL
echo "Deploying TalentX Frontend to Netlify..."
echo "Backend API: https://talentx-api-production.up.railway.app"

# Change to web directory
cd apps/web

# Create environment file for production
echo "VITE_API_URL=https://talentx-api-production.up.railway.app" > .env.production

# Build with production environment
npm run build

echo "Build completed! Now deploy the 'dist' folder to Netlify:"
echo "1. Go to https://app.netlify.com"
echo "2. Click 'Add new site' > 'Deploy manually'"
echo "3. Drag and drop the 'dist' folder"
echo ""
echo "Your frontend will be deployed and connected to your backend!"
echo "Backend URL: https://talentx-api-production.up.railway.app"
