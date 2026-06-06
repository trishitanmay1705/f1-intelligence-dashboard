# ── Azure Infrastructure ───────────────────────────────────────────────────────

variable "resource_group_name" {
  description = "Name of the Azure Resource Group that contains all f1-dashboard resources."
  type        = string
  default     = "f1-dashboard-rg"
}

variable "location" {
  description = "Azure region for all resources. Choose a region close to your users."
  type        = string
  default     = "eastus"
}

variable "aks_cluster_name" {
  description = "Name of the AKS cluster. Also used as the DNS prefix."
  type        = string
  default     = "f1-dashboard-aks"
}

variable "aks_node_count" {
  description = "Number of nodes in the AKS system node pool. Minimum 2 for high availability."
  type        = number
  default     = 2
}

variable "aks_node_vm_size" {
  description = "Azure VM size for AKS nodes. Standard_B2s (2 vCPU / 4 GB RAM) is sufficient for this app."
  type        = string
  default     = "Standard_B2s"
}

variable "acr_name" {
  description = "Name of the Azure Container Registry. Must be globally unique, 5–50 lowercase alphanumeric characters."
  type        = string
  default     = "f1dashboardacr"
}

# ── Application ────────────────────────────────────────────────────────────────

variable "backend_image" {
  description = "Backend container image repository without a tag. Example: f1dashboardacr.azurecr.io/f1-intelligence-backend"
  type        = string
}

variable "frontend_image" {
  description = "Frontend container image repository without a tag. Example: f1dashboardacr.azurecr.io/f1-intelligence-frontend"
  type        = string
}

variable "image_tag" {
  description = "Docker image tag to deploy. In CI/CD this is the git SHA for exact traceability. Use 'latest' for manual local runs."
  type        = string
  default     = "latest"
}

variable "domain" {
  description = "Public hostname for the Nginx Ingress and TLS certificate. Example: f1dashboard.yourdomain.com. Replace with your actual domain."
  type        = string
  default     = "f1dashboard.yourdomain.com"
}

