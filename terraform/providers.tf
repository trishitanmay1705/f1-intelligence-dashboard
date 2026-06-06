terraform {
  required_version = ">= 1.6"

  required_providers {
    # Azure Resource Manager — provisions AKS, ACR, resource groups, etc.
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.110"
    }
    # Kubernetes — manages Deployments, Services, Ingress inside AKS.
    # Credentials come dynamically from azurerm_kubernetes_cluster.aks,
    # so Terraform creates the cluster first, then deploys workloads.
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.27"
    }
  }
}

# Azure provider. In CI/CD, authentication uses OIDC via ARM_CLIENT_ID,
# ARM_TENANT_ID, ARM_SUBSCRIPTION_ID, and ARM_USE_OIDC=true environment
# variables set in the GitHub Actions workflow. For local runs, use
# "az login" and the provider picks up your CLI session automatically.
provider "azurerm" {
  features {}
}

# Kubernetes provider reads cluster credentials directly from the AKS
# resource — no kubeconfig file is needed in Terraform itself.
# Terraform creates the AKS cluster first (dependency graph), then uses
# its endpoint and certificates to connect for workload deployment.
provider "kubernetes" {
  host = azurerm_kubernetes_cluster.aks.kube_config[0].host

  client_certificate     = base64decode(azurerm_kubernetes_cluster.aks.kube_config[0].client_certificate)
  client_key             = base64decode(azurerm_kubernetes_cluster.aks.kube_config[0].client_key)
  cluster_ca_certificate = base64decode(azurerm_kubernetes_cluster.aks.kube_config[0].cluster_ca_certificate)
}
