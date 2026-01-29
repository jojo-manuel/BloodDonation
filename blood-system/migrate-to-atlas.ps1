# MongoDB Atlas Migration Script
# This script helps migrate data from local MongoDB container to MongoDB Atlas

param(
    [Parameter(Mandatory=$true)]
    [string]$AtlasConnectionString,
    
    [Parameter(Mandatory=$false)]
    [switch]$BackupOnly,
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun
)

Write-Host "🗄️  MongoDB Atlas Migration Tool" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Validate Atlas connection string
if (-not $AtlasConnectionString.StartsWith("mongodb+srv://")) {
    Write-Host "❌ Invalid Atlas connection string. Should start with 'mongodb+srv://'" -ForegroundColor Red
    Write-Host "Example: mongodb+srv://username:password@cluster.mongodb.net/bloodbank?retryWrites=true&w=majority" -ForegroundColor Yellow
    exit 1
}

# Check if Docker is running
Write-Host "🐳 Checking Docker status..." -ForegroundColor Blue
try {
    $dockerStatus = docker ps --format "table {{.Names}}\t{{.Status}}" | Select-String "blood-db"
    if ($dockerStatus) {
        Write-Host "✅ MongoDB container is running" -ForegroundColor Green
        Write-Host $dockerStatus -ForegroundColor Gray
    } else {
        Write-Host "❌ MongoDB container (blood-db) is not running" -ForegroundColor Red
        Write-Host "Please start the container first: docker-compose up -d blood-db" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Docker is not running or not accessible" -ForegroundColor Red
    exit 1
}

# Check if Node.js is available
Write-Host "📦 Checking Node.js..." -ForegroundColor Blue
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Install required npm packages if not present
Write-Host "📦 Checking npm dependencies..." -ForegroundColor Blue
if (-not (Test-Path "node_modules/mongodb")) {
    Write-Host "Installing mongodb package..." -ForegroundColor Yellow
    npm install mongodb
}

# Set environment variable
$env:MONGODB_ATLAS_URI = $AtlasConnectionString

if ($DryRun) {
    Write-Host "🧪 DRY RUN MODE - No actual migration will be performed" -ForegroundColor Yellow
    Write-Host ""
}

if ($BackupOnly) {
    Write-Host "💾 BACKUP ONLY MODE - Only creating local backup" -ForegroundColor Yellow
    Write-Host ""
}

# Create migration directory
$migrationDir = "migration-backup"
if (-not (Test-Path $migrationDir)) {
    New-Item -ItemType Directory -Path $migrationDir | Out-Null
    Write-Host "📁 Created migration backup directory" -ForegroundColor Green
}

Write-Host "🚀 Starting migration process..." -ForegroundColor Blue
Write-Host ""

try {
    if ($DryRun) {
        # Dry run - just analyze the database
        Write-Host "Analyzing local database structure..." -ForegroundColor Yellow
        node -e "
        const { MongoClient } = require('mongodb');
        async function analyze() {
            const client = new MongoClient('mongodb://localhost:27017/bloodbank');
            await client.connect();
            const db = client.db();
            const collections = await db.listCollections().toArray();
            console.log('Collections found:');
            for (const col of collections) {
                const count = await db.collection(col.name).countDocuments();
                console.log('  ' + col.name + ': ' + count + ' documents');
            }
            await client.close();
        }
        analyze().catch(console.error);
        "
    } elseif ($BackupOnly) {
        # Backup only
        Write-Host "Creating backup of local database..." -ForegroundColor Yellow
        node -e "
        const migrator = require('./migrate-to-atlas.js');
        const m = new migrator();
        m.connect().then(() => m.getCollectionStats()).then(async (collections) => {
            for (const collection of collections) {
                await m.backupCollection(collection);
            }
            await m.disconnect();
        }).catch(console.error);
        "
    } else {
        # Full migration
        node migrate-to-atlas.js
    }
    
    Write-Host ""
    Write-Host "✅ Process completed successfully!" -ForegroundColor Green
    
    if (-not $DryRun -and -not $BackupOnly) {
        Write-Host ""
        Write-Host "📋 Next Steps:" -ForegroundColor Cyan
        Write-Host "1. Update your application's MongoDB connection string to use Atlas" -ForegroundColor White
        Write-Host "2. Update environment variables in your containers/services" -ForegroundColor White
        Write-Host "3. Test your application with the new Atlas database" -ForegroundColor White
        Write-Host "4. Keep the local backup files for safety" -ForegroundColor White
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ Migration failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Migration process completed!" -ForegroundColor Green