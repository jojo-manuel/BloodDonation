# ============================================
# MongoDB Database Restore Script
# ============================================
# This script restores your MongoDB database from a backup

param(
    [Parameter(Mandatory = $true)]
    [string]$BackupPath
)

Write-Host "🔄 MongoDB Restore Script" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Validate backup path
if (-not (Test-Path $BackupPath)) {
    Write-Host "❌ Error: Backup path not found: $BackupPath" -ForegroundColor Red
    exit 1
}

# Check if it's a valid backup
$bsonBackup = Join-Path $BackupPath "blood-monolith"
if (-not (Test-Path $bsonBackup)) {
    Write-Host "❌ Error: Invalid backup - blood-monolith folder not found" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Backup location: $BackupPath" -ForegroundColor Yellow
Write-Host ""

# Warning prompt
Write-Host "⚠️  WARNING: This will REPLACE all current data!" -ForegroundColor Red
$confirmation = Read-Host "Are you sure you want to restore? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "❌ Restore cancelled" -ForegroundColor Yellow
    exit 0
}

# Check if MongoDB container is running
Write-Host ""
Write-Host "🔍 Checking MongoDB container status..." -ForegroundColor Yellow
$containerStatus = docker ps --filter "name=blood-db" --format "{{.Status}}"
if (-not $containerStatus) {
    Write-Host "❌ Error: MongoDB container is not running!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ MongoDB container is running" -ForegroundColor Green

# Copy backup to container
Write-Host ""
Write-Host "📤 Copying backup to container..." -ForegroundColor Yellow
docker cp "$bsonBackup" blood-db:/tmp/restore

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error copying backup to container" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backup copied to container" -ForegroundColor Green

# Restore database
Write-Host ""
Write-Host "🔄 Restoring database..." -ForegroundColor Yellow
docker exec blood-db mongorestore --db=blood-monolith --drop /tmp/restore

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database restored successfully" -ForegroundColor Green
}
else {
    Write-Host "❌ Error restoring database" -ForegroundColor Red
    exit 1
}

# Clean up
docker exec blood-db rm -rf /tmp/restore 2>&1 | Out-Null

Write-Host ""
Write-Host "✅ RESTORE COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "🔄 Please restart your application containers:" -ForegroundColor Yellow
Write-Host "   docker compose restart" -ForegroundColor Cyan
Write-Host ""
