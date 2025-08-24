# CLOUD FUNCTION
# Defines the Cloud Function, including its source code, runtime, and service configuration.
resource "google_cloudfunctions_function" "valuation_function" {
  name        = "valuation-research-function"
  description = "Valuation research function with API key authentication"
  runtime     = "python311"

  available_memory_mb   = 512
  source_archive_bucket = google_storage_bucket.valuation_source_bucket.name
  source_archive_object = google_storage_bucket_object.valuation_source_archive.name
  trigger_http          = true
  entry_point           = "valuation_function"
  timeout               = 300

  environment_variables = {
    PROJECT_ID = var.project_id
    API_KEY    = var.api_key
    GROQ_API_KEY = var.groq_api_key
  }

  depends_on = [
    google_project_service.apis,
    google_service_account_iam_member.valuation_function_sa_user
  ]
}

# Storage bucket for Cloud Function source code
resource "google_storage_bucket" "valuation_source_bucket" {
  name     = "${var.project_id}-valuation-function-source"
  location = var.region
  uniform_bucket_level_access = true
}

# Archive the source code
data "archive_file" "valuation_source_zip" {
  type        = "zip"
  source_dir  = "../valuation_function"
  output_path = "/tmp/valuation_function.zip"
}

# Upload the source code to the bucket
resource "google_storage_bucket_object" "valuation_source_archive" {
  name   = "valuation_function_${data.archive_file.valuation_source_zip.output_md5}.zip"
  bucket = google_storage_bucket.valuation_source_bucket.name
  source = data.archive_file.valuation_source_zip.output_path
}

# Service account for the Cloud Function
resource "google_service_account" "valuation_function_sa" {
  account_id   = "valuation-function-sa"
  display_name = "Service Account for Valuation Research Cloud Function"
  project      = var.project_id
}

# Grant the service account permission to invoke the function
resource "google_service_account_iam_member" "valuation_function_sa_user" {
  service_account_id = google_service_account.valuation_function_sa.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.valuation_function_sa.email}"
}

# IAM binding to allow authenticated access to the function
# Note: We're not making this completely public anymore since we added API key auth
# The function will only be accessible to users with the correct API key 