# ============================================
# Complete System Backup Script
# ============================================
# This script backs up everything: database, uploads, and configuration

param(
    [string]$BackupDir = ".\backups\complete\$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss')"
)

Write-Host "🎯 Complete System Backup" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Create main backup directory
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

Write-Host "📦 Starting complete backup to: $BackupDir" -ForegroundColor Yellow
Write-Host ""

# 1. Backup MongoDB Database
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "1️⃣  Backing up MongoDB Database..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
& .\backup-database.ps1 -BackupDir "$BackupDir\database"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database backup failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. Backup Uploads
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "2️⃣  Backing up Uploaded Files..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
& .\backup-uploads.ps1 -BackupDir "$BackupDir\uploads"

Write-Host ""

# 3. Backup Configuration Files
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "3️⃣  Backing up Configuration..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$configDir = "$BackupDir\config"
New-Item -ItemType Directory -Force -Path $configDir | Out-Null

# Copy important config files
Copy-Item "docker-compose.yml" "$configDir\" -ErrorAction SilentlyContinue
Copy-Item "nginx-configs" "$configDir\nginx-configs" -Recurse -ErrorAction SilentlyContinue
Copy-Item ".env" "$configDir\" -ErrorAction SilentlyContinue

Write-Host "✅ Configuration backed up" -ForegroundColor Green
Write-Host ""

# 4. Export Docker Volumes Info
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "4️⃣  Exporting Docker Info..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

docker volume ls --filter "name=blood-system" --format "{{.Name}}" | Out-File "$BackupDir\docker-volumes.txt"
docker ps -a --filter "name=blood" --format "{{.Names}}: {{.Status}}" | Out-File "$BackupDir\docker-containers.txt"

Write-Host "✅ Docker info exported" -ForegroundColor Green
Write-Host ""

# Create master metadata
$totalSize = (Get-ChildItem -Path $BackupDir -Recurse | Measure-Object -Property Length -Sum).Sum
$totalSizeMB = [math]::Round($totalSize / 1MB, 2)

$masterMetadata = @{
    BackupDate  = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    BackupType  = "Complete System Backup"
    Components  = @("Database", "Uploads", "Configuration", "Docker Info")
    TotalSizeMB = $totalSizeMB
    Location    = $BackupDir
} | ConvertTo-Json -Depth 3

$masterMetadata | Out-File "$BackupDir\backup-manifest.json"

# Create README
$readme = @"
Blood Donation System - Complete Backup
========================================

Backup Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Total Size: $totalSizeMB MB

Contents:
---------
📂 database/        - MongoDB database backup (BSON + JSON)
📂 uploads/         - Uploaded profile images
📂 config/          - Configuration files (docker-compose, nginx)
📄 docker-*.txt     - Docker volumes and containers info
📄 backup-manifest.json - Backup metadata

Restore Instructions:
--------------------
1. Database:  .\restore-database.ps1 -BackupPath "$BackupDir\database"
2. Uploads:   docker cp "$BackupDir\uploads\uploads" blood-backend-donor:/app/
3. Config:    Copy files from config/ to your project directory

For help: See README.md in the project root
"@

$readme | Out-File "$BackupDir\README.txt"

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ COMPLETE BACKUP FINISHED!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Backup Location: $BackupDir" -ForegroundColor Cyan
Write-Host "📊 Total Size: $totalSizeMB MB" -ForegroundColor Cyan
Write-Host "📅 Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backup Structure:" -ForegroundColor Yellow
Write-Host "   +-- database/ (MongoDB)" -ForegroundColor Gray
Write-Host "   +-- uploads/ (Profile images)" -ForegroundColor Gray
Write-Host "   +-- config/ (Configuration files)" -ForegroundColor Gray
Write-Host "   +-- docker-volumes.txt" -ForegroundColor Gray
Write-Host "   +-- docker-containers.txt" -ForegroundColor Gray
Write-Host "   +-- backup-manifest.json" -ForegroundColor Gray
Write-Host "   +-- README.txt" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Tip: Store this backup in a safe location!" -ForegroundColor Yellow
Write-Host ""
