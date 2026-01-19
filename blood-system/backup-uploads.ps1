# ============================================
# Uploaded Files Backup Script
# ============================================
# This script backs up all uploaded profile images

param(
    [string]$BackupDir = ".\backups\uploads\$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss')"
)

Write-Host "📸 Uploads Backup Script" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

# Create backup directory
Write-Host "📁 Creating backup directory: $BackupDir" -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

# Check if backend-donor container is running
Write-Host "🔍 Checking backend-donor container status..." -ForegroundColor Yellow
$containerStatus = docker ps --filter "name=blood-backend-donor" --format "{{.Status}}"
if (-not $containerStatus) {
    Write-Host "❌ Error: backend-donor container is not running!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Container is running" -ForegroundColor Green

# Check if uploads directory exists
Write-Host ""
Write-Host "🔍 Checking uploads directory..." -ForegroundColor Yellow
$uploadsCheck = docker exec blood-backend-donor sh -c "test -d /app/uploads && echo 'exists' || echo 'notfound'"
if ($uploadsCheck -ne "exists") {
    Write-Host "⚠️  Warning: No uploads directory found" -ForegroundColor Yellow
    Write-Host "   Creating empty backup..." -ForegroundColor Gray
    "No uploads found at backup time" | Out-File "$BackupDir\README.txt"
    exit 0
}

# Copy uploads from container
Write-Host "📤 Copying uploads from container..." -ForegroundColor Yellow
docker cp blood-backend-donor:/app/uploads "$BackupDir\uploads"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Uploads copied successfully" -ForegroundColor Green
}
else {
    Write-Host "❌ Error copying uploads" -ForegroundColor Red
    exit 1
}

# Count files
$fileCount = (Get-ChildItem -Path "$BackupDir\uploads" -Recurse -File).Count
$backupSize = (Get-ChildItem -Path "$BackupDir" -Recurse | Measure-Object -Property Length -Sum).Sum
$backupSizeMB = [math]::Round($backupSize / 1MB, 2)

# Create metadata
$metadata = @{
    BackupDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    FileCount  = $fileCount
    SizeMB     = $backupSizeMB
} | ConvertTo-Json

$metadata | Out-File "$BackupDir\backup-info.json"

Write-Host ""
Write-Host "✅ BACKUP COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "📁 Location: $BackupDir" -ForegroundColor Cyan
Write-Host "📊 Files: $fileCount" -ForegroundColor Cyan
Write-Host "📊 Size: $backupSizeMB MB" -ForegroundColor Cyan
Write-Host ""
