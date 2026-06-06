# ── F1 Dashboard — Stop Azure Resources ───────────────────────────────────────
# Stops the AKS cluster, deallocating all node VMs to stop compute billing.
# The cluster configuration and workloads are preserved — start-azure.ps1
# restores everything exactly as it was.
#
# What keeps costing (very cheap):
#   ACR Basic SKU          ~$0.17/day
#   AKS control plane      free
#   Terraform state blobs  cents/month
#
# What stops costing after this script:
#   AKS node VMs (2 × Standard_B2s)  ~$0.10/hour → $0.00/hour
#
# Usage:
#   .\scripts\stop-azure.ps1
# ------------------------------------------------------------------------------

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ── Config ────────────────────────────────────────────────────────────────────
$RESOURCE_GROUP = "f1-dashboard-rg"
$CLUSTER_NAME   = "f1-dashboard-aks"
# ------------------------------------------------------------------------------

function Write-Step { param($msg) Write-Host "`n► $msg" -ForegroundColor Cyan }
function Write-OK   { param($msg) Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  ! $msg" -ForegroundColor Yellow }
function Write-Fail { param($msg) Write-Host "  ✗ $msg" -ForegroundColor Red }

# ── Check Azure CLI ───────────────────────────────────────────────────────────
Write-Step "Checking Azure CLI"
if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Fail "Azure CLI not found. Install with: winget install Microsoft.AzureCLI"
    exit 1
}

$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Warn "Not logged in to Azure. Running az login..."
    az login
    $account = az account show | ConvertFrom-Json
}
Write-OK "Logged in as: $($account.user.name)  |  Subscription: $($account.name)"

# ── Check current cluster state ───────────────────────────────────────────────
Write-Step "Checking AKS cluster state"
$cluster = az aks show `
    --resource-group $RESOURCE_GROUP `
    --name $CLUSTER_NAME `
    --query "{state:powerState.code, provisioningState:provisioningState}" `
    -o json 2>$null | ConvertFrom-Json

if (-not $cluster) {
    Write-Fail "Cluster '$CLUSTER_NAME' not found in resource group '$RESOURCE_GROUP'."
    exit 1
}

if ($cluster.state -eq "Stopped") {
    Write-OK "Cluster is already stopped. No action needed."
    Write-Host ""
    Write-Host "Node VMs are deallocated — no compute charges are running." -ForegroundColor Green
    exit 0
}

# ── Stop the cluster ──────────────────────────────────────────────────────────
Write-Step "Stopping AKS cluster '$CLUSTER_NAME' (this takes ~3-5 minutes)"
Write-Warn "This deallocates all node VMs. Workloads are preserved and will"
Write-Warn "resume automatically when you run start-azure.ps1."
Write-Host ""

$startTime = Get-Date

az aks stop `
    --resource-group $RESOURCE_GROUP `
    --name $CLUSTER_NAME

$elapsed = [math]::Round(((Get-Date) - $startTime).TotalMinutes, 1)

# ── Verify stopped ────────────────────────────────────────────────────────────
Write-Step "Verifying cluster state"
$state = az aks show `
    --resource-group $RESOURCE_GROUP `
    --name $CLUSTER_NAME `
    --query "powerState.code" -o tsv

Write-OK "Cluster state: $state  (stopped in $elapsed min)"

# ── Cost summary ──────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "  AKS nodes deallocated — compute billing stopped." -ForegroundColor Yellow
Write-Host "  Remaining costs (minimal):" -ForegroundColor Yellow
Write-Host "    ACR Basic:          ~$0.17 / day" -ForegroundColor DarkGray
Write-Host "    Terraform state:    cents / month" -ForegroundColor DarkGray
Write-Host "    AKS control plane:  free" -ForegroundColor DarkGray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""
Write-Host "To restart:  .\scripts\start-azure.ps1" -ForegroundColor DarkGray
