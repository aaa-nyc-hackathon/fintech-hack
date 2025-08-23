resource "google_cloud_run_v2_service" "video_service" {
  name     = "${var.function_name}-video-length"
  location = var.region
  
  template {
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}/video-length-service:latest"
      ports {
        container_port = 8080
      }

      # Environment variables
      env {
        name  = "GCP_PROJECT"
        value = var.project_id
      }
      
      # Add API key environment variable
      env {
        name  = "API_KEY"
        value = var.api_key
      }

      # Health checks
      startup_probe {
        http_get {
          path = "/health"
          port = 8080
        }
        initial_delay_seconds = 30
        timeout_seconds       = 10
        failure_threshold     = 3
        period_seconds        = 10
      }

      liveness_probe {
        http_get {
          path = "/health"
          port = 8080
        }
        initial_delay_seconds = 60
        timeout_seconds       = 5
        failure_threshold     = 3
        period_seconds        = 10
      }
    }
    service_account = google_service_account.cloud_run_sa.email
  }
  
  ingress = "INGRESS_TRAFFIC_ALL"
} 