# ── F1 Dashboard — Start Azure Resources ──────────────────────────────────────
# Starts the AKS cluster (reallocates node VMs) and shows the app URL.
# Run this when you want to use the app.
# Pair with stop-azure.ps1 to avoid paying for idle compute.
#
# Usage:
#   .\scripts\start-azure.ps1
# ------------------------------------------------------------------------------

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ── Config ────────────────────────────────────────────────────────────────────
$RESOURCE_GROUP = "f1-dashboard-rg"
$CLUSTER_NAME   = "f1-dashboard-aks"
# ------------------------------------------------------------------------------

function Write-Step  { param($msg) Write-Host "`n► $msg" -ForegroundColor Cyan }
function Write-OK    { param($msg) Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Warn  { param($msg) Write-Host "  ! $msg" -ForegroundColor Yellow }
function Write-Fail  { param($msg) Write-Host "  ✗ $msg" -ForegroundColor Red }

# ── Check Azure CLI is available ──────────────────────────────────────────────
Write-Step "Checking Azure CLI"
if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Fail "Azure CLI not found. Install with: winget install Microsoft.AzureCLI"
    exit 1
}

# ── Check logged in ───────────────────────────────────────────────────────────
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
    Write-Warn "Run 'terraform apply' first to provision the cluster."
    exit 1
}

if ($cluster.state -eq "Running") {
    Write-OK "Cluster is already running."
} else {
    Write-OK "Cluster is currently: $($cluster.state). Starting now..."

    # ── Start the cluster ─────────────────────────────────────────────────────
    Write-Step "Starting AKS cluster '$CLUSTER_NAME' (this takes ~5-10 minutes)"
    $startTime = Get-Date

    az aks start `
        --resource-group $RESOURCE_GROUP `
        --name $CLUSTER_NAME

    $elapsed = [math]::Round(((Get-Date) - $startTime).TotalMinutes, 1)
    Write-OK "Cluster started in $elapsed min."
}

# ── Get kubectl credentials ───────────────────────────────────────────────────
Write-Step "Fetching AKS credentials (updating ~/.kube/config)"
az aks get-credentials `
    --resource-group $RESOURCE_GROUP `
    --name $CLUSTER_NAME `
    --overwrite-existing
Write-OK "kubectl context set to: $CLUSTER_NAME"

# ── Wait for nodes to be Ready ────────────────────────────────────────────────
Write-Step "Waiting for nodes to be Ready"
$timeout = 180
$elapsed = 0
$interval = 10
do {
    Start-Sleep -Seconds $interval
    $elapsed += $interval
    $notReady = kubectl get nodes --no-headers 2>$null |
        Where-Object { $_ -notmatch "\sReady\s" -and $_.Trim() -ne "" }
    $readyCount = (kubectl get nodes --no-headers 2>$null | Where-Object { $_ -match "\sReady\s" }).Count
    Write-Host "  [$elapsed s] $readyCount node(s) Ready..." -ForegroundColor DarkGray
} while ($notReady -and $elapsed -lt $timeout)

if ($notReady) {
    Write-Warn "Some nodes not Ready after ${timeout}s. Pods may take a moment longer."
} else {
    Write-OK "All nodes are Ready."
}

# ── Wait for app pods ─────────────────────────────────────────────────────────
Write-Step "Waiting for backend + frontend pods to be Running"
$elapsed = 0
do {
    Start-Sleep -Seconds 10
    $elapsed += 10
    $pending = kubectl get pods -n f1-dashboard --no-headers 2>$null |
        Where-Object { $_ -notmatch "\sRunning\s" -and $_.Trim() -ne "" }
    $runningCount = (kubectl get pods -n f1-dashboard --no-headers 2>$null | Where-Object { $_ -match "\sRunning\s" }).Count
    Write-Host "  [$elapsed s] $runningCount pod(s) Running..." -ForegroundColor DarkGray
} while ($pending -and $elapsed -lt 180)

kubectl get pods -n f1-dashboard

# ── Show ingress / app URL ────────────────────────────────────────────────────
Write-Step "Ingress / App URL"
$ingress = kubectl get ingress -n f1-dashboard -o json 2>$null | ConvertFrom-Json
$ip = $ingress.items[0].status.loadBalancer.ingress[0].ip
$hostname = $ingress.items[0].spec.rules[0].host

if ($ip) {
    Write-OK "LoadBalancer IP : $ip"
    Write-Warn "If your DNS A record ($hostname) is not pointing to this IP, update it now."
} else {
    Write-Warn "LoadBalancer IP not yet assigned — wait a moment and run:"
    Write-Warn "  kubectl get ingress -n f1-dashboard"
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "  App URL :  https://$hostname" -ForegroundColor Green
Write-Host "  API docs:  https://$hostname/api/docs" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "When you're done, run:  .\scripts\stop-azure.ps1" -ForegroundColor DarkGray
