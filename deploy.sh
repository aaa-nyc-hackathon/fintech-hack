#!/bin/bash

# Video Length API Service Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform is not installed. Please install Terraform first."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed. Please install gcloud CLI first."
        exit 1
    fi
    
    print_status "All prerequisites are installed."
}

# Check if terraform.tfvars exists and extract variables
check_config() {
    if [ ! -f "terraform/terraform.tfvars" ]; then
        print_error "terraform.tfvars not found. Please create it from terraform.tfvars.example first."
        exit 1
    fi
    
    # Extract variables from terraform.tfvars using grep and sed
    project_id=$(grep '^project_id' terraform/terraform.tfvars | sed 's/.*= *"\([^"]*\)".*/\1/')
    region=$(grep '^region' terraform/terraform.tfvars | sed 's/.*= *"\([^"]*\)".*/\1/')
    
    if [ -z "$project_id" ] || [ -z "$region" ]; then
        print_error "Could not extract project_id and region from terraform.tfvars"
        print_error "Please ensure the file contains: project_id = \"your-project-id\" and region = \"your-region\""
        exit 1
    fi
    
    print_status "Configuration loaded: project_id=$project_id, region=$region"
}

# Enable required GCP APIs
enable_apis() {
    print_status "Enabling required GCP APIs..."
    
    # List of APIs needed for the video service
    local apis=(
        "apigateway.googleapis.com"
        "servicecontrol.googleapis.com"
        "run.googleapis.com"
        "artifactregistry.googleapis.com"
        "iam.googleapis.com"
        "storage.googleapis.com"
        "apikeys.googleapis.com"
        "cloudresourcemanager.googleapis.com"
        "cloudfunctions2.googleapis.com"
    )
    
    for api in "${apis[@]}"; do
        print_status "Enabling $api..."
        gcloud services enable "$api" --project="$project_id" --quiet || {
            print_warning "Failed to enable $api - it may already be enabled"
        }
    done
    
    print_status "All required APIs enabled!"
}

# Deploy infrastructure with Terraform (step by step)
deploy_infrastructure() {
    print_status "Deploying infrastructure with Terraform..."
    
    cd terraform
    
    # Initialize Terraform
    print_status "Initializing Terraform..."
    terraform init
    
    # Step 1: Create Artifact Registry and enable APIs first
    print_status "Step 1: Creating Artifact Registry and enabling APIs..."
    terraform apply -target=google_artifact_registry_repository.docker_repo -target=google_project_service.apis -auto-approve
    
    # Get Artifact Registry ID
    ARTIFACT_REGISTRY=$(terraform output -raw artifact_registry_url)
    print_status "Artifact Registry created: $ARTIFACT_REGISTRY"
    
    cd ..
    
    # Step 2: Build and push Docker image
    print_status "Step 2: Building and pushing Docker image..."
    build_and_push_image
    
    # Step 3: Deploy remaining infrastructure
    cd terraform
    print_status "Step 3: Deploying remaining infrastructure..."
    terraform apply -auto-approve
    
    # Get final outputs
    CLOUD_RUN_URL=$(terraform output -raw cloud_run_service_url)
    cd ..
    
    print_status "Infrastructure deployed successfully!"
    print_status "Artifact Registry: $ARTIFACT_REGISTRY"
    print_status "Cloud Run URL: $CLOUD_RUN_URL"
}

# Build and push Docker image
build_and_push_image() {
    print_status "Building Docker image..."
    
    # Build the image
    docker build -t video-length-service .
    
    # Tag for Artifact Registry
    docker tag video-length-service:latest \
  ${region}-docker.pkg.dev/${project_id}/${ARTIFACT_REGISTRY}/video-length-service:latest
    
    print_status "Configuring Docker for Artifact Registry..."
    gcloud auth configure-docker ${region}-docker.pkg.dev
    
    print_status "Pushing Docker image..."
    docker push ${region}-docker.pkg.dev/${project_id}/${ARTIFACT_REGISTRY}/video-length-service:latest
    
    print_status "Docker image pushed successfully!"
}

# Test the API
test_api() {
    print_status "Testing the API..."
    
    cd terraform
    
    # Get API Gateway URL and API key
    API_URL=$(terraform output -raw api_gateway_url)
    API_KEY=$(terraform output -raw api_key)
    
    cd ..
    
    print_status "API Gateway URL: $API_URL"
    print_status "API Key: $API_KEY"
    
    # Test health endpoint
    print_status "Testing health endpoint..."
    curl -s "${API_URL}/health" | jq . || echo "Health check failed or jq not installed"
    
    # Test analyze video endpoint (optional - requires a valid video URI)
    print_status "Note: To test the analyze_video endpoint, use:"
    print_status "curl -X POST \"${API_URL}/analyze_video\" \\"
    print_status "  -H \"x-api-key: ${API_KEY}\" \\"
    print_status "  -H \"Content-Type: application/json\" \\"
    print_status "  -d '{\"video_uri\": \"gs://your-bucket/video.mp4\"}'"
    
    print_status "API test completed!"
}

# Main deployment function
main() {
    print_status "Starting Video Length API Service deployment..."
    
    check_prerequisites
    check_config
    enable_apis
    deploy_infrastructure
    test_api
    
    print_status "Deployment completed successfully!"
    print_status "Your API is now available at the API Gateway URL shown above."
    print_status "Use the API key for authentication."
}

# Run main function
main "$@" 