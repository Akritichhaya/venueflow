#!/bin/bash
# deploy.sh — One-command deploy to GCP (Cloud Run + Firebase Hosting)
# Usage: ./deploy.sh your-gcp-project-id

set -e

PROJECT_ID=${1:-"your-gcp-project-id"}
REGION="us-central1"
SERVICE_NAME="venueflow-backend"
IMAGE="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "🚀 VenueFlow Deploy — Project: $PROJECT_ID"
echo "================================================"

# ── 1. Set GCP project ──────────────────────────────
echo "▶ Setting GCP project..."
gcloud config set project $PROJECT_ID

# ── 2. Enable required APIs ─────────────────────────
echo "▶ Enabling GCP APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  firebase.googleapis.com \
  sheets.googleapis.com \
  --quiet

# ── 3. Build & push backend Docker image ────────────
echo "▶ Building backend Docker image..."
cd backend
gcloud builds submit --tag $IMAGE .
cd ..

# ── 4. Deploy backend to Cloud Run ──────────────────
echo "▶ Deploying backend to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --set-env-vars "GEMINI_API_KEY=$GEMINI_API_KEY,FIREBASE_DB_URL=$FIREBASE_DB_URL,SHEETS_SPREADSHEET_ID=$SHEETS_SPREADSHEET_ID" \
  --set-env-vars "FIREBASE_SERVICE_ACCOUNT=$FIREBASE_SERVICE_ACCOUNT" \
  --set-env-vars "GOOGLE_SERVICE_ACCOUNT=$GOOGLE_SERVICE_ACCOUNT"

BACKEND_URL=$(gcloud run services describe $SERVICE_NAME \
  --platform managed --region $REGION \
  --format 'value(status.url)')
echo "✅ Backend deployed: $BACKEND_URL"

# ── 5. Build frontend ────────────────────────────────
echo "▶ Building frontend..."
cd frontend
echo "VITE_API_URL=$BACKEND_URL/api" >> .env
npm install
npm run build
cd ..

# ── 6. Deploy frontend to Firebase Hosting ──────────
echo "▶ Deploying frontend to Firebase Hosting..."
npx firebase-tools deploy --only hosting --project $PROJECT_ID

echo ""
echo "================================================"
echo "✅ VenueFlow deployed successfully!"
echo "   Backend : $BACKEND_URL"
echo "   Frontend: https://$PROJECT_ID.web.app"
echo "================================================"
