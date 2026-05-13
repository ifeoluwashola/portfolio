variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., prod, dev)"
  type        = string
  default     = "prod"
}

variable "allowed_origins" {
  description = "Allowed origins for CORS"
  type        = list(string)
  default     = ["http://localhost:3000", "https://kyberncloud.com", "https://www.kyberncloud.com"]
}
