# MongoDB Database Backup Script
# Creates a complete backup of your MongoDB database

param(
    [string]$BackupDir = ".\backups\mongodb\$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss')"
)

Write-Host "MongoDB Backup Script" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host ""

# Create backup directory
Write-Host "Creating backup directory: $BackupDir" -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

# Check if MongoDB container is running
Write-Host "Checking MongoDB container status..." -ForegroundColor Yellow
$containerStatus = docker ps --filter "name=blood-db" --format "{{.Status}}"
if (-not $containerStatus) {
    Write-Host "ERROR: MongoDB container is not running!" -ForegroundColor Red
    Write-Host "Please start the containers with: docker compose up -d" -ForegroundColor Yellow
    exit 1
}
Write-Host "MongoDB container is running" -ForegroundColor Green

# Backup using mongodump
Write-Host ""
Write-Host "Creating database backup..." -ForegroundColor Yellow
docker exec blood-db mongodump --db=blood-monolith --out=/tmp/backup 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database dump created successfully" -ForegroundColor Green
}
else {
    Write-Host "ERROR creating database dump" -ForegroundColor Red
    exit 1
}

# Copy backup from container to host
Write-Host "Copying backup to host..." -ForegroundColor Yellow
docker cp blood-db:/tmp/backup/blood-monolith "$BackupDir\blood-monolith"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup copied successfully" -ForegroundColor Green
}
else {
    Write-Host "ERROR copying backup" -ForegroundColor Red
    exit 1
}

# Clean up container backup
docker exec blood-db rm -rf /tmp/backup 2>&1 | Out-Null

# Export each collection to JSON for easy viewing
Write-Host ""
Write-Host "Exporting collections to JSON..." -ForegroundColor Yellow

$collections = @('users', 'patients', 'donors', 'donationrequests', 'bookings', 'notifications', 'reviews')
$jsonDir = "$BackupDir\json"
New-Item -ItemType Directory -Force -Path $jsonDir | Out-Null

foreach ($collection in $collections) {
    Write-Host "   Exporting $collection..." -ForegroundColor Gray
    docker exec blood-db mongoexport --db=blood-monolith --collection=$collection --out=/tmp/$collection.json 2>&1 | Out-Null
    docker cp blood-db:/tmp/$collection.json "$jsonDir\$collection.json" 2>&1 | Out-Null
    docker exec blood-db rm /tmp/$collection.json 2>&1 | Out-Null
}

Write-Host "JSON exports completed" -ForegroundColor Green

# Create backup metadata
$metadata = @{
    BackupDate   = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    DatabaseName = "blood-monolith"
    Collections  = $collections
    BackupMethod = "mongodump + mongoexport"
} | ConvertTo-Json

$metadata | Out-File "$BackupDir\backup-info.json"

# Calculate backup size
$backupSize = (Get-ChildItem -Path $BackupDir -Recurse | Measure-Object -Property Length -Sum).Sum
$backupSizeMB = [math]::Round($backupSize / 1MB, 2)

Write-Host ""
Write-Host "BACKUP COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green
Write-Host "Location: $BackupDir" -ForegroundColor Cyan
Write-Host "Size: $backupSizeMB MB" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backup contains:" -ForegroundColor Yellow
Write-Host "  - blood-monolith/ (BSON format - for restore)" -ForegroundColor Gray
Write-Host "  - json/ (JSON format - human readable)" -ForegroundColor Gray
Write-Host "  - backup-info.json (metadata)" -ForegroundColor Gray
Write-Host ""
