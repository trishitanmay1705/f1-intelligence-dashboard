# ── Azure Infrastructure ───────────────────────────────────────────────────────
#
# This file provisions all Azure cloud resources required to run the
# F1 Intelligence Dashboard in production:
#
#   Resource Group          →  logical container for all resources
#   Azure Container Registry (ACR)  →  private Docker image registry
#   AKS Cluster             →  managed Kubernetes control plane + node pool
#   ACR ↔ AKS Role Assignment  →  grants AKS permission to pull images from ACR
#
# Run once to provision, then idempotent on every CD run.
# On subsequent runs Terraform only modifies what has changed.
# ──────────────────────────────────────────────────────────────────────────────


# ── Resource Group ─────────────────────────────────────────────────────────────
# A resource group is a logical container in Azure. All resources in this
# project live in one resource group, making it easy to view costs, apply
# policies, and clean up (delete the group to remove everything at once).

resource "azurerm_resource_group" "f1_dashboard" {
  name     = var.resource_group_name
  location = var.location

  tags = {
    project     = "f1-intelligence-dashboard"
    managed-by  = "terraform"
  }
}


# ── Azure Container Registry (ACR) ────────────────────────────────────────────
# ACR is a private Docker registry hosted in Azure. The CI/CD pipeline pushes
# backend and frontend images here. AKS pulls images from ACR using a
# managed identity — no registry passwords are stored in K8s secrets.
#
# SKU: Basic is sufficient for a single-project registry.
# admin_enabled = false: using managed identity, never admin credentials.

resource "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = azurerm_resource_group.f1_dashboard.name
  location            = azurerm_resource_group.f1_dashboard.location
  sku                 = "Basic"
  admin_enabled       = false

  tags = {
    project    = "f1-intelligence-dashboard"
    managed-by = "terraform"
  }
}


# ── AKS Cluster ───────────────────────────────────────────────────────────────
# Azure Kubernetes Service (AKS) is a managed Kubernetes cluster. Azure runs
# the control plane (API server, etcd, scheduler) for free; you only pay for
# the agent nodes (VMs).
#
# Key design decisions:
#   identity.type = "SystemAssigned"
#     AKS gets a managed identity automatically. Used for the ACR role
#     assignment below — no service principal passwords to rotate.
#
#   default_node_pool.node_count = 2
#     Two nodes provide redundancy: if one node fails, all pods move to the
#     other node with zero downtime (because Deployments have replicas: 2 and
#     maxUnavailable: 0).
#
#   vm_size = "Standard_B2s"
#     2 vCPU / 4 GB RAM per node. Sufficient for 2 × backend + 2 × frontend
#     pods with headroom for rolling updates (maxSurge: 1).
#
#   network_plugin = "kubenet"
#     Simpler network model: pods get IPs from an internal subnet managed by
#     Kubernetes. Use "azure" (Azure CNI) if you need direct VNet integration.
#
#   load_balancer_sku = "standard"
#     Required for availability zones and managed outbound IPs.
#     The NGINX ingress controller creates a Standard Load Balancer with a
#     static public IP automatically.

resource "azurerm_kubernetes_cluster" "aks" {
  name                = var.aks_cluster_name
  location            = azurerm_resource_group.f1_dashboard.location
  resource_group_name = azurerm_resource_group.f1_dashboard.name
  dns_prefix          = var.aks_cluster_name

  default_node_pool {
    name            = "system"
    node_count      = var.aks_node_count
    vm_size         = var.aks_node_vm_size
    os_disk_size_gb = 30
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin    = "kubenet"
    load_balancer_sku = "standard"
  }

  tags = {
    project    = "f1-intelligence-dashboard"
    managed-by = "terraform"
  }
}


# ── ACR Pull Permission for AKS ───────────────────────────────────────────────
# Grants the AKS kubelet (node) identity the "AcrPull" role on ACR.
# This lets every node in the cluster pull images from ACR without
# configuring imagePullSecrets in each Kubernetes workload manifest.
#
# azurerm_kubernetes_cluster.aks.kubelet_identity[0].object_id
#   This is the managed identity that each AKS node uses when pulling images.
#   It is NOT the cluster identity (identity.principal_id) — kubelet and
#   cluster identities are separate.

resource "azurerm_role_assignment" "aks_acr_pull" {
  principal_id                     = azurerm_kubernetes_cluster.aks.kubelet_identity[0].object_id
  role_definition_name             = "AcrPull"
  scope                            = azurerm_container_registry.acr.id
  skip_service_principal_aad_check = true
}
