resource "google_artifact_registry_repository" "docker_repo" {
  location      = var.region
  repository_id = "${var.function_name}-docker-repo"
  description   = "Docker repository for the video length service"
  format        = "DOCKER"
} 