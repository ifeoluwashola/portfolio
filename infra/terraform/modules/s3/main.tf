resource "aws_s3_bucket" "academy_uploads" {
  bucket = "${var.project_name}-academy-uploads-${var.environment}"
}

resource "aws_s3_bucket_ownership_controls" "academy_uploads_ownership" {
  bucket = aws_s3_bucket.academy_uploads.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_public_access_block" "academy_uploads_public_access" {
  bucket = aws_s3_bucket.academy_uploads.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_cors_configuration" "academy_uploads_cors" {
  bucket = aws_s3_bucket.academy_uploads.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "POST", "GET"]
    allowed_origins = var.allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}
