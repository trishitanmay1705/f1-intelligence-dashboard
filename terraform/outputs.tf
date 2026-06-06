# ── Azure Infrastructure Outputs ──────────────────────────────────────────────

output "resource_group_name" {
  description = "Name of the Azure Resource Group."
  value       = azurerm_resource_group.f1_dashboard.name
}

output "acr_login_server" {
  description = "ACR login server hostname. Use this as the image registry prefix (e.g. f1dashboardacr.azurecr.io)."
  value       = azurerm_container_registry.acr.login_server
}

output "aks_cluster_name" {
  description = "Name of the AKS cluster."
  value       = azurerm_kubernetes_cluster.aks.name
}

output "aks_kube_config" {
  description = "Raw kubeconfig for the AKS cluster. Run: terraform output -raw aks_kube_config > ~/.kube/config"
  value       = azurerm_kubernetes_cluster.aks.kube_config_raw
  sensitive   = true
}

# ── Kubernetes Workload Outputs ────────────────────────────────────────────────

output "namespace" {
  description = "Kubernetes namespace where all f1-dashboard resources are deployed."
  value       = kubernetes_namespace.f1_dashboard.metadata[0].name
}

output "backend_cluster_address" {
  description = "Internal cluster DNS address of the backend service."
  value       = "http://${kubernetes_service.backend.metadata[0].name}:8000"
}

output "frontend_cluster_address" {
  description = "Internal cluster DNS address of the frontend service."
  value       = "http://${kubernetes_service.frontend.metadata[0].name}:3000"
}

output "app_url" {
  description = "Public HTTPS URL of the application."
  value       = "https://${var.domain}"
}

output "backend_image_deployed" {
  description = "Full backend image reference that was deployed."
  value       = "${var.backend_image}:${var.image_tag}"
}

output "frontend_image_deployed" {
  description = "Full frontend image reference that was deployed."
  value       = "${var.frontend_image}:${var.image_tag}"
}

