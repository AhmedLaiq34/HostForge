output "primary_web_endpoint" {
  value = azurerm_storage_account.static_site.primary_web_endpoint
}

output "storage_account_name" {
  value = azurerm_storage_account.static_site.name
}
