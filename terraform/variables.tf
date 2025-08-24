variable "project_id" {
  type        = string
  description = "The GCP project ID to deploy the resources to."
}

variable "region" {
  type        = string
  description = "The GCP region to deploy the resources to."
}

variable "function_name" {
  type        = string
  description = "The name of the Cloud Function."
  default     = "video-length-service"
}

# API Gateway variables removed - no longer needed

variable "api_key" {
  description = "API key for authentication in the Python application"
  type        = string
  sensitive   = true
}

variable "groq_api_key" {
  description = "API key for Groq LLM service"
  type        = string
  sensitive   = true
}

variable "brave_api_key" {
  description = "API key for Brave search service"
  type        = string
  sensitive   = true
}

variable "anthropic_api_key" {
  description = "API key for Anthropic Claude service"
  type        = string
  sensitive   = true
} 