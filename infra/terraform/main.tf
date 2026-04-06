module "vpc" {
  source       = "./modules/vpc"
  project_name = var.project_name
  az           = "${var.region}a"
}

module "iam" {
  source       = "./modules/iam"
  project_name = var.project_name
  github_repo  = var.github_repo
}

module "security_groups" {
  source       = "./modules/security_groups"
  project_name = var.project_name
  vpc_id       = module.vpc.vpc_id
}

module "ec2" {
  source               = "./modules/ec2"
  project_name         = var.project_name
  instance_type        = var.instance_type
  subnet_id            = module.vpc.subnet_id
  sg_id                = module.security_groups.sg_id
  iam_instance_profile = module.iam.ec2_instance_profile_name
  ssh_key_name         = var.ssh_key_name
  ssh_public_key       = var.ssh_public_key
}
