variable "region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "github_repo" {
  description = "GitHub repository (e.g., 'your-org/your-repo')"
  type        = string
  default     = "ifeoluwashola/portfolio"
}

variable "project_name" {
  description = "Kybern Infra"
  type        = string
  default     = "kybern"
}

variable "ssh_key_name" {
  description = "Name of the SSH key pair"
  type        = string
  default     = null
}

variable "ssh_public_key" {
  description = "Public key for the SSH key pair"
  type        = string
  default     = ""
}
