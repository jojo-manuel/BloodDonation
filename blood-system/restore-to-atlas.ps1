# MongoDB Atlas Restore Script
# This script restores a local backup to MongoDB Atlas

param(
    [Parameter(Mandatory=$true)]
    [string]$AtlasConnectionString,
    
    [Parameter(Mandatory=$true)]
    [string]$BackupPath,
    
    [Parameter(Mandatory=$false)]
    [string]$DatabaseName = "bloodbank",
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun
)

Write-Host "🔄 MongoDB Atlas Restore Tool" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

# Validate parameters
if (-not (Test-Path $BackupPath)) {
    Write-Host "❌ Backup path does not exist: $BackupPath" -ForegroundColor Red
    exit 1
}

if (-not $AtlasConnectionString.StartsWith("mongodb+srv://")) {
    Write-Host "❌ Invalid Atlas connection string. Should start with 'mongodb+srv://'" -ForegroundColor Red
    exit 1
}

if ($DryRun) {
    Write-Host "🧪 DRY RUN MODE - No actual restore will be performed" -ForegroundColor Yellow
    Write-Host ""
}

# Check if mongorestore is available
Write-Host "🔧 Checking MongoDB tools..." -ForegroundColor Blue
try {
    $mongorestoreVersion = mongorestore --version
    Write-Host "✅ mongorestore is available" -ForegroundColor Green
} catch {
    Write-Host "❌ mongorestore is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install MongoDB Database Tools: https://docs.mongodb.com/database-tools/" -ForegroundColor Yellow
    exit 1
}

# Analyze backup
Write-Host "📊 Analyzing backup..." -ForegroundColor Blue
$backupFiles = Get-ChildItem -Path $BackupPath -Recurse -File
$totalFiles = $backupFiles.Count
$totalSize = ($backupFiles | Measure-Object -Property Length -Sum).Sum
$totalSizeMB = [math]::Round($totalSize / 1MB, 2)

Write-Host "📁 Backup contains $totalFiles files ($totalSizeMB MB)" -ForegroundColor Gray

# Check for metadata file
$metadataFile = Join-Path $BackupPath "backup-metadata.json"
if (Test-Path $metadataFile) {
    Write-Host "📄 Found backup metadata" -ForegroundColor Green
    $metadata = Get-Content $metadataFile | ConvertFrom-Json
    Write-Host "  📅 Backup timestamp: $($metadata.timestamp)" -ForegroundColor Gray
    Write-Host "  🗄️  Original database: $($metadata.database)" -ForegroundColor Gray
    if ($metadata.collections) {
        Write-Host "  📊 Collections:" -ForegroundColor Gray
        foreach ($collection in $metadata.collections) {
            Write-Host "    📁 $($collection.name): $($collection.documents) documents" -ForegroundColor Gray
        }
    }
}

if ($DryRun) {
    Write-Host ""
    Write-Host "🧪 DRY RUN - Would restore the following:" -ForegroundColor Yellow
    Write-Host "  Source: $BackupPath" -ForegroundColor Gray
    Write-Host "  Target: $DatabaseName on Atlas" -ForegroundColor Gray
    Write-Host "  Files: $totalFiles files ($totalSizeMB MB)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "✅ Dry run completed" -ForegroundColor Green
    exit 0
}

# Confirm restore
Write-Host ""
Write-Host "⚠️  WARNING: This will replace all data in the Atlas database '$DatabaseName'" -ForegroundColor Yellow
$confirmation = Read-Host "Are you sure you want to continue? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "❌ Restore cancelled by user" -ForegroundColor Red
    exit 1
}

# Perform restore
Write-Host ""
Write-Host "🔄 Starting restore to MongoDB Atlas..." -ForegroundColor Blue
Write-Host "📍 Target: $DatabaseName" -ForegroundColor Gray

try {
    # Check if backup is in mongodump format (has .bson files) or mongoexport format (.json files)
    $bsonFiles = Get-ChildItem -Path $BackupPath -Filter "*.bson" -Recurse
    $jsonFiles = Get-ChildItem -Path $BackupPath -Filter "*.json" -Recurse | Where-Object { $_.Name -ne "backup-metadata.json" }
    
    if ($bsonFiles.Count -gt 0) {
        # Use mongorestore for BSON format
        Write-Host "📦 Detected mongodump format, using mongorestore..." -ForegroundColor Blue
        
        $restoreCommand = "mongorestore --uri `"$AtlasConnectionString`" --db $DatabaseName --drop `"$BackupPath`""
        Write-Host "🔧 Command: $restoreCommand" -ForegroundColor Gray
        
        Invoke-Expression $restoreCommand
        
    } elseif ($jsonFiles.Count -gt 0) {
        # Use mongoimport for JSON format
        Write-Host "📦 Detected mongoexport format, using mongoimport..." -ForegroundColor Blue
        
        foreach ($jsonFile in $jsonFiles) {
            $collectionName = [System.IO.Path]::GetFileNameWithoutExtension($jsonFile.Name)
            Write-Host "  📥 Importing collection: $collectionName" -ForegroundColor Gray
            
            $importCommand = "mongoimport --uri `"$AtlasConnectionString`" --db $DatabaseName --collection $collectionName --file `"$($jsonFile.FullName)`" --jsonArray"
            Invoke-Expression $importCommand
        }
    } else {
        Write-Host "❌ No valid backup files found (no .bson or .json files)" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "✅ Restore completed successfully!" -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "❌ Restore failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Verify restore
Write-Host ""
Write-Host "🔍 Verifying restore..." -ForegroundColor Blue

# Create a simple verification script
$verifyScript = @"
const { MongoClient } = require('mongodb');
async function verify() {
    const client = new MongoClient('$AtlasConnectionString');
    await client.connect();
    const db = client.db('$DatabaseName');
    const collections = await db.listCollections().toArray();
    console.log('Collections in Atlas:');
    let totalDocs = 0;
    for (const col of collections) {
        const count = await db.collection(col.name).countDocuments();
        console.log('  ' + col.name + ': ' + count + ' documents');
        totalDocs += count;
    }
    console.log('Total documents: ' + totalDocs);
    await client.close();
}
verify().catch(console.error);
"@

$verifyScript | Out-File -FilePath "temp-verify.js" -Encoding UTF8
node temp-verify.js
Remove-Item "temp-verify.js"

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Update your application's connection string to use Atlas" -ForegroundColor White
Write-Host "2. Test your application thoroughly" -ForegroundColor White
Write-Host "3. Update environment variables in production" -ForegroundColor White

Write-Host ""
Write-Host "🎉 Atlas restore completed!" -ForegroundColor Green