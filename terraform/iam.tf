# Service account for Cloud Run
resource "google_service_account" "cloud_run_sa" {
  account_id   = "${var.function_name}-cloud-run-sa"
  display_name = "Service Account for Cloud Run Video Service"
  project      = var.project_id
}

# API Gateway service account removed - Cloud Run will be publicly accessible

# Allow Cloud Run to access GCS
resource "google_project_iam_binding" "cloud_run_storage" {
  project = var.project_id
  role    = "roles/storage.objectViewer"
  members = [
    "serviceAccount:${google_service_account.cloud_run_sa.email}"
  ]
}

# API Gateway permissions removed - no longer needed 