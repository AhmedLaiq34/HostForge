output "resource_group_name" {
  description = "The name of the created Resource Group"
  value       = module.resource_group.resource_group_name
}

output "location" {
  description = "The Azure region of the Resource Group"
  value       = module.resource_group.resource_group_location
}

output "static_site_url" {
  value = module.storage_account.primary_web_endpoint
}


