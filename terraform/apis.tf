locals {
  services = toset([
    "apigateway.googleapis.com",
    "servicecontrol.googleapis.com",
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "iam.googleapis.com",
    "storage.googleapis.com",
    "cloudfunctions.googleapis.com",
    "cloudbuild.googleapis.com"
  ])
}

resource "google_project_service" "apis" {
  for_each           = local.services
  project            = var.project_id
  service            = each.key
  disable_on_destroy = false
} 