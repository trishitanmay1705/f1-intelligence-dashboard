# ── Terraform State Backend — Azure Blob Storage ──────────────────────────────
#
# Terraform stores a "state file" that tracks which real-world resources it
# manages. State is stored remotely in Azure Blob Storage so that:
#   - CI/CD runners (ephemeral VMs) always start from current state.
#   - Concurrent applies are prevented via blob lease locking.
#   - State is encrypted at rest by Azure Storage Service Encryption.
#   - State is never stored in git (it can contain sensitive resource IDs).
#
# ── One-time Setup ────────────────────────────────────────────────────────────
#
# Run these commands ONCE before the first "terraform init":
#
#   # Create a dedicated resource group for Terraform state
#   az group create --name f1-dashboard-tfstate-rg --location eastus
#
#   # Create a storage account (name must be globally unique, 3–24 chars)
#   az storage account create \
#     --name f1dashboardtfstate \
#     --resource-group f1-dashboard-tfstate-rg \
#     --sku Standard_LRS \
#     --encryption-services blob
#
#   # Create the blob container
#   az storage container create \
#     --name tfstate \
#     --account-name f1dashboardtfstate
#
#   # Retrieve the storage account key (add to GitHub secret TF_STATE_STORAGE_KEY)
#   az storage account keys list \
#     --account-name f1dashboardtfstate \
#     --resource-group f1-dashboard-tfstate-rg \
#     --query "[0].value" -o tsv
#
# ── Authentication ────────────────────────────────────────────────────────────
#
# The azurerm backend authenticates using the storage account key provided
# via the ARM_ACCESS_KEY environment variable. In the GitHub Actions CD
# workflow this is set to ${{ secrets.TF_STATE_STORAGE_KEY }}.
#
# Never commit the storage account key to git.

terraform {
  backend "azurerm" {
    resource_group_name  = "f1-dashboard-tfstate-rg"
    storage_account_name = "f1dashboardtfstate"
    container_name       = "tfstate"
    key                  = "f1-dashboard.tfstate"
  }
}

