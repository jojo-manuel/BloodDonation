# Blood Bank Management System - Environment Setup Script
# Run this script to create your .env file

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Blood Bank System - Environment Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env already exists
if (Test-Path ".env") {
    Write-Host "WARNING: .env file already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/n)"
    if ($overwrite -ne "y") {
        Write-Host "Setup cancelled." -ForegroundColor Red
        exit
    }
}

Write-Host "Let's configure your environment variables..." -ForegroundColor Green
Write-Host ""

# JWT Secret
Write-Host "1. JWT SECRET" -ForegroundColor Yellow
Write-Host "   This is used to sign authentication tokens (REQUIRED)" -ForegroundColor Gray
Write-Host ""
Write-Host "   Options:" -ForegroundColor Gray
Write-Host "   [1] Generate a random secure secret (Recommended)" -ForegroundColor Gray
Write-Host "   [2] Enter your own secret" -ForegroundColor Gray
Write-Host ""
$jwtChoice = Read-Host "Choose option (1 or 2)"

if ($jwtChoice -eq "1") {
    # Generate random secret
    $JWT_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    Write-Host "   Generated: $JWT_SECRET" -ForegroundColor Green
} else {
    $JWT_SECRET = Read-Host "   Enter your JWT secret"
}

Write-Host ""

# SMTP Configuration
Write-Host "2. EMAIL NOTIFICATIONS (Optional)" -ForegroundColor Yellow
Write-Host "   Configure SMTP for sending email notifications" -ForegroundColor Gray
Write-Host ""
$configureEmail = Read-Host "Do you want to configure email notifications? (y/n)"

if ($configureEmail -eq "y") {
    Write-Host ""
    Write-Host "   Email Provider:" -ForegroundColor Gray
    Write-Host "   [1] Gmail" -ForegroundColor Gray
    Write-Host "   [2] Outlook" -ForegroundColor Gray
    Write-Host "   [3] Custom SMTP" -ForegroundColor Gray
    Write-Host ""
    $emailProvider = Read-Host "   Choose provider (1, 2, or 3)"
    
    switch ($emailProvider) {
        "1" {
            $SMTP_HOST = "smtp.gmail.com"
            $SMTP_PORT = "587"
            Write-Host ""
            Write-Host "   For Gmail, you need an App Password:" -ForegroundColor Cyan
            Write-Host "   1. Go to https://myaccount.google.com/apppasswords" -ForegroundColor Gray
            Write-Host "   2. Enable 2-Factor Authentication if not already enabled" -ForegroundColor Gray
            Write-Host "   3. Generate an app password for 'Mail'" -ForegroundColor Gray
            Write-Host "   4. Use that 16-digit password below" -ForegroundColor Gray
            Write-Host ""
        }
        "2" {
            $SMTP_HOST = "smtp.office365.com"
            $SMTP_PORT = "587"
        }
        "3" {
            $SMTP_HOST = Read-Host "   Enter SMTP host"
            $SMTP_PORT = Read-Host "   Enter SMTP port"
        }
    }
    
    Write-Host ""
    $SMTP_USER = Read-Host "   Enter email address"
    $SMTP_PASS = Read-Host "   Enter email password/app-password" -AsSecureString
    $SMTP_PASS = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($SMTP_PASS))
} else {
    $SMTP_HOST = "smtp.gmail.com"
    $SMTP_PORT = "587"
    $SMTP_USER = "your-email@gmail.com"
    $SMTP_PASS = "your-app-password"
}

Write-Host ""

# SMS Configuration
Write-Host "3. SMS NOTIFICATIONS (Optional)" -ForegroundColor Yellow
Write-Host "   Configure SMS provider API key" -ForegroundColor Gray
Write-Host ""
$configureSMS = Read-Host "Do you want to configure SMS notifications? (y/n)"

if ($configureSMS -eq "y") {
    $SMS_API_KEY = Read-Host "   Enter SMS API key (Twilio, AWS SNS, etc.)"
} else {
    $SMS_API_KEY = ""
}

Write-Host ""

# Node Environment
Write-Host "4. ENVIRONMENT" -ForegroundColor Yellow
Write-Host "   [1] Development (for testing)" -ForegroundColor Gray
Write-Host "   [2] Production (for deployment)" -ForegroundColor Gray
Write-Host ""
$envChoice = Read-Host "Choose environment (1 or 2)"

if ($envChoice -eq "2") {
    $NODE_ENV = "production"
} else {
    $NODE_ENV = "development"
}

# Create .env file
Write-Host ""
Write-Host "Creating .env file..." -ForegroundColor Cyan

$envContent = @"
# ==========================================
# Blood Bank Management System - Environment Configuration
# Generated on: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# ==========================================

# ==========================================
# JWT Configuration (REQUIRED)
# ==========================================
JWT_SECRET=$JWT_SECRET

# ==========================================
# SMTP Configuration (for Notification Service)
# ==========================================
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_USER=$SMTP_USER
SMTP_PASS=$SMTP_PASS

# ==========================================
# SMS Configuration (for Notification Service)
# ==========================================
SMS_API_KEY=$SMS_API_KEY

# ==========================================
# Node Environment
# ==========================================
NODE_ENV=$NODE_ENV
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ .env file created successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Review the .env file: notepad .env" -ForegroundColor Gray
Write-Host "2. Start the services: docker-compose up -d" -ForegroundColor Gray
Write-Host "3. Check health: curl http://localhost:3000/health" -ForegroundColor Gray
Write-Host ""
Write-Host "IMPORTANT: Never commit the .env file to version control!" -ForegroundColor Yellow
Write-Host ""
