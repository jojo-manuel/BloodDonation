# Update Environment Variables for MongoDB Atlas
# This script helps update all .env files to use MongoDB Atlas connection string

param(
    [Parameter(Mandatory=$true)]
    [string]$AtlasConnectionString,
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun
)

Write-Host "🔧 Environment Configuration Update Tool" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "🧪 DRY RUN MODE - No files will be modified" -ForegroundColor Yellow
    Write-Host ""
}

# Validate Atlas connection string
if (-not $AtlasConnectionString.StartsWith("mongodb+srv://")) {
    Write-Host "❌ Invalid Atlas connection string. Should start with 'mongodb+srv://'" -ForegroundColor Red
    exit 1
}

# Find all .env files in the project
Write-Host "🔍 Searching for .env files..." -ForegroundColor Blue

$envFiles = @()
$searchPaths = @(".", "..", "backend", "backend-bloodbank", "backend-admin", "backend-donor", "backend-login")

foreach ($searchPath in $searchPaths) {
    if (Test-Path $searchPath) {
        $files = Get-ChildItem -Path $searchPath -Filter ".env*" -File
        foreach ($file in $files) {
            $envFiles += $file.FullName
        }
    }
}

if ($envFiles.Count -eq 0) {
    Write-Host "⚠️  No .env files found" -ForegroundColor Yellow
    Write-Host "You may need to create .env files manually" -ForegroundColor Gray
} else {
    Write-Host "📁 Found $($envFiles.Count) .env files:" -ForegroundColor Green
    foreach ($file in $envFiles) {
        Write-Host "  📄 $file" -ForegroundColor Gray
    }
}

# Environment variables to update
$mongoVars = @(
    "MONGODB_URI",
    "MONGODB_URL", 
    "MONGO_URI",
    "MONGO_URL",
    "DATABASE_URL",
    "DB_URI",
    "DB_URL"
)

Write-Host ""
Write-Host "🔄 Processing .env files..." -ForegroundColor Blue

foreach ($envFile in $envFiles) {
    Write-Host ""
    Write-Host "📝 Processing: $envFile" -ForegroundColor Cyan
    
    if (-not (Test-Path $envFile)) {
        Write-Host "  ⚠️  File not found, skipping" -ForegroundColor Yellow
        continue
    }
    
    $content = Get-Content $envFile
    $updated = $false
    $newContent = @()
    
    foreach ($line in $content) {
        $updatedLine = $line
        
        # Check if line contains any MongoDB variable
        foreach ($var in $mongoVars) {
            if ($line -match "^$var\s*=") {
                Write-Host "  🔧 Updating $var" -ForegroundColor Yellow
                $updatedLine = "$var=$AtlasConnectionString"
                $updated = $true
                break
            }
        }
        
        $newContent += $updatedLine
    }
    
    # If no MongoDB variables found, add MONGODB_URI
    if (-not $updated) {
        Write-Host "  ➕ Adding MONGODB_URI" -ForegroundColor Green
        $newContent += "MONGODB_URI=$AtlasConnectionString"
        $updated = $true
    }
    
    if ($updated) {
        if ($DryRun) {
            Write-Host "  🧪 Would update file (dry run)" -ForegroundColor Yellow
        } else {
            # Create backup
            $backupFile = "$envFile.backup-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss')"
            Copy-Item $envFile $backupFile
            Write-Host "  💾 Backup created: $backupFile" -ForegroundColor Gray
            
            # Write updated content
            $newContent | Out-File -FilePath $envFile -Encoding UTF8
            Write-Host "  ✅ File updated successfully" -ForegroundColor Green
        }
    } else {
        Write-Host "  ℹ️  No changes needed" -ForegroundColor Gray
    }
}

# Update Docker Compose files
Write-Host ""
Write-Host "🐳 Checking Docker Compose files..." -ForegroundColor Blue

$dockerComposeFiles = @()
$composeSearchPaths = @(".", "..")

foreach ($searchPath in $composeSearchPaths) {
    if (Test-Path $searchPath) {
        $files = Get-ChildItem -Path $searchPath -Filter "docker-compose*.yml" -File
        foreach ($file in $files) {
            $dockerComposeFiles += $file.FullName
        }
    }
}

foreach ($composeFile in $dockerComposeFiles) {
    Write-Host ""
    Write-Host "📝 Processing Docker Compose: $composeFile" -ForegroundColor Cyan
    
    $content = Get-Content $composeFile
    $updated = $false
    $newContent = @()
    
    foreach ($line in $content) {
        $updatedLine = $line
        
        # Look for MongoDB environment variables in docker-compose
        foreach ($var in $mongoVars) {
            if ($line -match "^\s*-?\s*$var\s*[:=]") {
                Write-Host "  🔧 Updating $var in Docker Compose" -ForegroundColor Yellow
                if ($line -match "^\s*-\s*") {
                    # YAML array format
                    $updatedLine = $line -replace "$var[:=].*", "$var=$AtlasConnectionString"
                } else {
                    # YAML key-value format
                    $updatedLine = $line -replace "$var\s*:.*", "$var`: $AtlasConnectionString"
                }
                $updated = $true
                break
            }
        }
        
        $newContent += $updatedLine
    }
    
    if ($updated) {
        if ($DryRun) {
            Write-Host "  🧪 Would update Docker Compose file (dry run)" -ForegroundColor Yellow
        } else {
            # Create backup
            $backupFile = "$composeFile.backup-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss')"
            Copy-Item $composeFile $backupFile
            Write-Host "  💾 Backup created: $backupFile" -ForegroundColor Gray
            
            # Write updated content
            $newContent | Out-File -FilePath $composeFile -Encoding UTF8
            Write-Host "  ✅ Docker Compose file updated" -ForegroundColor Green
        }
    } else {
        Write-Host "  ℹ️  No MongoDB variables found in Docker Compose" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "  📄 .env files processed: $($envFiles.Count)" -ForegroundColor White
Write-Host "  🐳 Docker Compose files processed: $($dockerComposeFiles.Count)" -ForegroundColor White

if (-not $DryRun) {
    Write-Host "  💾 Backup files created for all modified files" -ForegroundColor White
}

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Review the updated configuration files" -ForegroundColor White
Write-Host "2. Restart your applications/containers to use Atlas" -ForegroundColor White
Write-Host "3. Test database connectivity" -ForegroundColor White
Write-Host "4. Remove backup files once everything is working" -ForegroundColor White

if ($DryRun) {
    Write-Host ""
    Write-Host "🧪 This was a dry run. Run without -DryRun to apply changes." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Environment configuration update completed!" -ForegroundColor Green