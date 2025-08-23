#!/bin/bash

# Fix Terraform State Issues Script
set -e

echo "🔧 Fixing Terraform State Issues..."

cd terraform

echo "📋 Current Terraform state..."
terraform state list

echo ""
echo "🔄 Importing existing Cloud Run service..."
echo "If this fails, the service may not exist yet - that's okay."

# Try to import the Cloud Run service if it exists
terraform import google_cloud_run_v2_service.video_service \
  "projects/ai-fintech-hackathon/locations/us-central1/services/video-service-video-length" || \
  echo "Cloud Run service not found - will be created fresh"

echo ""
echo "🧹 Running terraform plan to see current state..."
terraform plan

echo ""
echo "✅ State fix complete!"
echo "Now you can run: ./deploy.sh" 