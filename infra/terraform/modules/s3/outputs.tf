output "bucket_name" {
  description = "The name of the bucket"
  value       = aws_s3_bucket.academy_uploads.id
}

output "bucket_arn" {
  description = "The ARN of the bucket"
  value       = aws_s3_bucket.academy_uploads.arn
}
