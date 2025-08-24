# GCS Video Upload Setup

## Environment Variables Required

Create a `.env.local` file in your `frontend` directory with the following variables:

```bash
# Google Cloud Storage Credentials for Video Uploads

# Your GCP Project ID
NEXT_PUBLIC_PROJECT_ID=your-gcp-project-id

# GCS Bucket Name  
NEXT_PUBLIC_GCS_BUCKET_NAME=your-gcs-bucket-name

# Service Account Credentials
NEXT_PUBLIC_GCS_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
NEXT_PUBLIC_GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour actual private key here\n-----END PRIVATE KEY-----"

# Video Analysis API Key
NEXT_PUBLIC_VIDEO_ANALYSIS_API_KEY=your-video-analysis-api-key-here

# Valuation API Key
NEXT_PUBLIC_VALUATION_API_KEY=your-valuation-api-key-here
```

## How to Get These Values

1. **NEXT_PUBLIC_PROJECT_ID**: Your Google Cloud Project ID (e.g., `ai-fintech-hackathon`)

2. **NEXT_PUBLIC_GCS_BUCKET_NAME**: The name of your GCS bucket (e.g., `finteck-hackathon`)

3. **NEXT_PUBLIC_GCS_CLIENT_EMAIL**: The email from your service account JSON file

4. **NEXT_PUBLIC_GCS_PRIVATE_KEY**: The private key from your service account JSON file

## Service Account Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to IAM & Admin > Service Accounts
3. Create a new service account or use existing one
4. Download the JSON key file
5. Copy the `client_email` and `private_key` values to your `.env.local`

## Bucket Permissions

### Service Account Permissions
Ensure your service account has the following roles on the bucket:
- `Storage Object Admin` - for uploading files
- `Storage Object Viewer` - for reading files

### Public Read Access (Required for Frontend Display)
Since your bucket uses Uniform Bucket-Level Access, you need to grant public read access at the bucket level:

**Option 1: Google Cloud Console**
1. Go to Cloud Storage > Buckets
2. Select your bucket (`finteck-hackathon`)
3. Go to Permissions tab
4. Click "Grant Access"
5. Add `allUsers` with role `Storage Object Viewer`

**Option 2: Command Line (gsutil)**
```bash
gsutil iam ch allUsers:objectViewer gs://finteck-hackathon
```

**Option 3: Terraform (if you want to manage this in code)**
```hcl
resource "google_storage_bucket_iam_member" "public_read" {
  bucket = google_storage_bucket.your_bucket.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}
```

## Security Note

- Never commit `.env.local` to version control
- The `.env.local` file is already in `.gitignore`
- Keep your service account credentials secure 