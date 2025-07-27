variable "resource_group_name" {
  description = "The name of the Resource Group to create"
  type        = string
}

variable "location" {
  description = "Azure region where resources will be created"
  type        = string
}

variable "storage_account_name" {
  description = "Name of the storage account"
  type        = string
}

variable "environment" {
  description = "Environment type (e.g., dev, test, prod)"
  type        = string
}

variable "owner" {
  description = "Owner of the deployment"
  type        = string
}
