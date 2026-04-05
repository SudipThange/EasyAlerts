#!/bin/bash
set -e

cd /home/azureuser/easyalerts

# Pull latest code
git pull origin main

# Backend setup
cd backend
pip install -r requirements.txt --break-system-packages
python3 manage.py migrate
python3 manage.py collectstatic --noinput
cd ..

# Frontend build
cd frontend
npm install
npm run build
cd ..

# Restart service
sudo systemctl restart easyalerts
