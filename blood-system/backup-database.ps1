# MongoDB Database Backup Script
# This script creates a backup of the local MongoDB database using mongodump

param(
    [Parameter(Mandatory=$false)]
    [string]$BackupPath = ".\database-backup",
    
    [Parameter(Mandatory=$false)]
    [string]$DatabaseName = "bloodbank"
)

Write-Host "💾 MongoDB Database Backup Tool" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running and MongoDB container is available
Write-Host "🐳 Checking MongoDB container..." -ForegroundColor Blue
try {
    $containerStatus = docker ps --format "table {{.Names}}\t{{.Status}}" | Select-String "blood-db"
    if ($containerStatus) {
        Write-Host "✅ MongoDB container is running" -ForegroundColor Green
    } else {
        Write-Host "❌ MongoDB container (blood-db) is not running" -ForegroundColor Red
        Write-Host "Starting MongoDB container..." -ForegroundColor Yellow
        docker-compose up -d blood-db
        Start-Sleep -Seconds 5
    }
} catch {
    Write-Host "❌ Docker is not running or not accessible" -ForegroundColor Red
    exit 1
}

# Create backup directory
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$fullBackupPath = Join-Path $BackupPath "$DatabaseName-backup-$timestamp"

if (-not (Test-Path $BackupPath)) {
    New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
}

Write-Host "📁 Creating backup directory: $fullBackupPath" -ForegroundColor Blue
New-Item -ItemType Directory -Path $fullBackupPath -Force | Out-Null

# Method 1: Using mongodump inside the container
Write-Host "💾 Creating database backup using mongodump..." -ForegroundColor Blue
try {
    # Execute mongodump inside the MongoDB container
    docker exec blood-db mongodump --db $DatabaseName --out /tmp/backup
    
    # Copy the backup from container to host
    docker cp blood-db:/tmp/backup/$DatabaseName $fullBackupPath
    
    Write-Host "✅ Database backup created successfully" -ForegroundColor Green
    Write-Host "📍 Backup location: $fullBackupPath" -ForegroundColor Gray
    
    # Get backup size
    $backupSize = (Get-ChildItem -Path $fullBackupPath -Recurse | Measure-Object -Property Length -Sum).Sum
    $backupSizeMB = [math]::Round($backupSize / 1MB, 2)
    Write-Host "📊 Backup size: $backupSizeMB MB" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Backup failed with mongodump: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Trying alternative method..." -ForegroundColor Yellow
    
    # Method 2: Using mongoexport for each collection
    Write-Host "💾 Creating backup using mongoexport..." -ForegroundColor Blue
    
    # Get list of collections
    $collections = docker exec blood-db mongo $DatabaseName --quiet --eval "db.getCollectionNames().join(',')"
    $collectionList = $collections -split ","
    
    foreach ($collection in $collectionList) {
        if ($collection.Trim()) {
            Write-Host "  Exporting collection: $collection" -ForegroundColor Gray
            $outputFile = Join-Path $fullBackupPath "$collection.json"
            docker exec blood-db mongoexport --db $DatabaseName --collection $collection --out "/tmp/$collection.json"
            docker cp "blood-db:/tmp/$collection.json" $outputFile
        }
    }
    
    Write-Host "✅ Alternative backup method completed" -ForegroundColor Green
}

# Create backup metadata
$metadata = @{
    timestamp = $timestamp
    database = $DatabaseName
    backupPath = $fullBackupPath
    method = "mongodump"
    collections = @()
}

# Get collection information
Write-Host "📊 Gathering collection statistics..." -ForegroundColor Blue
try {
    $stats = docker exec blood-db mongo $DatabaseName --quiet --eval "
        db.getCollectionNames().forEach(function(collection) {
            var count = db.getCollection(collection).count();
            print(collection + ':' + count);
        });
    "
    
    $stats -split "`n" | ForEach-Object {
        if ($_ -match "(.+):(\d+)") {
            $collectionName = $matches[1]
            $documentCount = [int]$matches[2]
            $metadata.collections += @{
                name = $collectionName
                documents = $documentCount
            }
            Write-Host "  📁 $collectionName`: $documentCount documents" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "⚠️  Could not gather collection statistics" -ForegroundColor Yellow
}

# Save metadata
$metadataFile = Join-Path $fullBackupPath "backup-metadata.json"
$metadata | ConvertTo-Json -Depth 3 | Out-File -FilePath $metadataFile -Encoding UTF8

Write-Host ""
Write-Host "✅ Backup completed successfully!" -ForegroundColor Green
Write-Host "📍 Backup location: $fullBackupPath" -ForegroundColor Cyan
Write-Host "📄 Metadata file: $metadataFile" -ForegroundColor Cyan

# Display next steps
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Verify backup contents in: $fullBackupPath" -ForegroundColor White
Write-Host "2. Use this backup for Atlas migration or disaster recovery" -ForegroundColor White
Write-Host "3. To restore: mongorestore --db $DatabaseName $fullBackupPath" -ForegroundColor White

Write-Host ""
Write-Host "🎉 Backup process completed!" -ForegroundColor Green