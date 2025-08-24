# Video Length API Service

A GCP Cloud Run service that extracts video length from videos stored in Google Cloud Storage using Python, FFmpeg, and OpenCV.

The client application presents a display of the items extracted from the video.
The items are fed through to Anthropic and to Brave for valuations.
The sources/groundings from the calls provide upper and lower bounds for price estimates.
A quality/condition for the item is also provided.
The estimated value is the average of the upper and lower bound price estimates across all sources.
Clicking through the `price analysis` button on each item on the right hand pane provides backlinks
to the sources.

## Features

- **Video Length Extraction**: Get video duration using FFmpeg (primary) and OpenCV (fallback)
- **GCS Integration**: Accepts GCS URIs as input
- **API Gateway**: Secure endpoint with API key authentication
- **Cloud Run**: Scalable containerized service
- **Health Checks**: Built-in health monitoring

## Architecture

```
API Gateway → Cloud Run → Python App (FFmpeg + OpenCV) → GCS
```

## Prerequisites

- Google Cloud Platform account
- Terraform installed
- Docker installed
- gcloud CLI configured

## Quick Start

### 1. Set up GCP Project

```bash
# Set your project ID
export PROJECT_ID="your-project-id"
export REGION="us-central1"

# Enable required APIs
gcloud services enable apigateway.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable iam.googleapis.com
gcloud services enable storage.googleapis.com
```

### 2. Configure Terraform

```bash
cd terraform

# Copy and edit the variables file
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your project details

# Initialize Terraform
terraform init

# Plan the deployment
terraform plan

# Deploy the infrastructure
terraform apply
```

### 3. Build and Deploy the Container

```bash
# Get the Artifact Registry URL from Terraform output
ARTIFACT_REGISTRY=$(terraform output -raw artifact_registry_url)

# Build the Docker image
docker build -t video-length-service .

# Tag for Artifact Registry
docker tag video-length-service:latest \
  ${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REGISTRY}/video-length-service-video-length:latest

# Configure Docker for Artifact Registry
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# Push the image
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REGISTRY}/video-length-service-video-length:latest
```

### 4. Test the API

```bash
# Get the API Gateway URL and API key
API_URL=$(terraform output -raw api_gateway_url)
API_KEY=$(terraform output -raw api_key)

# Test the endpoint
curl -X POST "${API_URL}/analyze_video" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "video_uri": "gs://your-bucket/your-video.mp4"
  }'
```

## API Reference

### Endpoint: `POST /analyze_video`

**Request Body:**
```json
{
  "video_uri": "gs://bucket-name/video.mp4",
  "frame_interval": 20
}
```

**Response:**
```json
{
  "video_uri": "gs://bucket-name/video.mp4",
  "duration": "120.5 seconds",
  "frame_interval": 20,
  "total_frames_processed": 15,
  "total_objects_detected": 45,
  "object_categories": {
    "person": [
      {
        "frame_number": 0,
        "confidence": 0.95,
        "gcs_path": "gs://bucket/abc12345-processed-images/person/frame_000000_object_000.png"
      }
    ]
  },
  "processed_images_bucket": "gs://bucket-name/abc12345-processed-images",
  "frame_data": [
    {
      "frame_number": 0,
      "timestamp_seconds": 0.0,
      "objects": [
        {
          "object_id": 0,
          "category_name": "person",
          "confidence": 0.95,
          "bbox": {"x1": 100, "y1": 200, "x2": 300, "y2": 500},
          "gcs_path": "gs://bucket/abc12345-processed-images/person/frame_000000_object_000.png"
        }
      ]
    }
  ]
}
```

**Headers Required:**
- `x-api-key`: Your API key for authentication
- `Content-Type: application/json`

### Health Check: `GET /health`

Returns service health status.

### Valuation Research: `POST /valuation_function`

**Purpose:** Research and valuation analysis for documents and assets.

**Headers Required:**
- `x-api-key`: Your API key for authentication
- `Content-Type: application/json`

**Request Body:**
```json
{
  "gcs_uri": "gs://bucket-name/document.pdf"
}
```

**Response:**
```json
{
  "analysis_result": "Valuation analysis completed",
  "document_type": "PDF",
  "gcs_uri": "gs://bucket-name/document.pdf"
}
```

## Configuration

### Environment Variables

- `GCP_PROJECT`: GCP project ID (set automatically by Terraform)
- `PORT`: Service port (defaults to 8080)

### Supported Video Formats

- MP4, AVI, MOV, MKV, and other formats supported by FFmpeg
- Fallback to OpenCV for additional format support

### Object Detection Features

- **Frame-based Processing**: Analyzes every N frames (configurable via `frame_interval`)
- **YOLO Integration**: Uses YOLOv8 for accurate object detection
- **Automatic Categorization**: Groups detected objects by category
- **GCS Storage**: Uploads cropped object images to organized bucket structure
- **Rich Metadata**: Returns bounding boxes, confidence scores, and timestamps

## Security

- API key authentication required
- Internal-only Cloud Run service
- Service account with minimal permissions
- Non-root container user

## Monitoring

- Health checks at `/health`
- Structured logging
- Cloud Run metrics and logs
- API Gateway monitoring

## Troubleshooting

### Common Issues

1. **FFmpeg not found**: Ensure the Dockerfile installs FFmpeg correctly
2. **Permission denied**: Check service account permissions for GCS access
3. **Video format not supported**: Check if the video format is supported by FFmpeg/OpenCV

### Logs

```bash
# View Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=video-length-service-video-length"

# View API Gateway logs
gcloud logging read "resource.type=apigateway.googleapis.com/Gateway"
```

## Development

### Local Testing

```bash
# Install dependencies
pip install -r app/requirements.txt

# Run locally
python app/main.py

# Test locally
curl -X POST http://localhost:8080/analyze_video \
  -H "Content-Type: application/json" \
  -d '{"video_uri": "gs://your-bucket/video.mp4"}'
```

### Building Locally

```bash
# Build image
docker build -t video-length-service .

# Run container
docker run -p 8080:8080 \
  -e GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json \
  video-length-service
```

## Cost Optimization

- Cloud Run scales to zero when not in use
- Use appropriate machine types for your workload
- Monitor API Gateway usage and costs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
