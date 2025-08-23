# API Gateway outputs removed - Cloud Run will be directly accessible

output "cloud_run_service_url" {
  description = "The URL of the deployed Cloud Run service."
  value       = google_cloud_run_v2_service.video_service.uri
}

output "artifact_registry_url" {
  description = "The URL of the Artifact Registry repository."
  value       = google_artifact_registry_repository.docker_repo.repository_id
} 