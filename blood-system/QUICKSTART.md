# Blood Bank Management System - Quick Start Guide

## Step 1: Configure Environment Variables

### Option A: Interactive Setup (Recommended)

Run the setup script in PowerShell:

```powershell
cd d:\BloodDonation\blood-system
.\setup-env.ps1
```

The script will guide you through:
- ✅ Generating a secure JWT secret
- ✅ Configuring email (Gmail/Outlook/Custom)
- ✅ Configuring SMS (optional)
- ✅ Setting environment (development/production)

### Option B: Manual Setup

1. **Copy the template:**
   ```powershell
   cd d:\BloodDonation\blood-system
   copy .env.example .env
   ```

2. **Edit the file:**
   ```powershell
   notepad .env
   ```

3. **Configure these values:**

   **Minimum Configuration (Required):**
   ```env
   JWT_SECRET=YourSecureSecretHere_ChangeThis123!
   NODE_ENV=development
   ```

   **Full Configuration (with Email):**
   ```env
   JWT_SECRET=YourSecureSecretHere_ChangeThis123!
   
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-digit-app-password
   
   SMS_API_KEY=
   
   NODE_ENV=development
   ```

### Gmail App Password Setup

If using Gmail for notifications:

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification**
3. Go to https://myaccount.google.com/apppasswords
4. Select **Mail** and **Windows Computer**
5. Click **Generate**
6. Copy the 16-digit password (remove spaces)
7. Use this password in `SMTP_PASS`

## Step 2: Start the System

### Start Core Services Only

```powershell
docker-compose up -d
```

This starts:
- ✅ API Gateway (port 3000)
- ✅ Auth Service (port 3001)
- ✅ Donor Service (port 3002)
- ✅ Inventory Service (port 3003)
- ✅ Request Service (port 3004)

### Start with Optional Services

```powershell
docker-compose --profile optional up -d
```

This additionally starts:
- ✅ Notification Service (port 3005)
- ✅ IoT Service (port 3006)
- ✅ Ledger Service (port 3007)

## Step 3: Verify Installation

### Check Services Status

```powershell
# View running containers
docker-compose ps

# Check logs
docker-compose logs -f

# Check specific service
docker-compose logs -f gateway
```

### Test Health Endpoints

```powershell
# Test Gateway
curl http://localhost:3000/health

# Test Auth Service
curl http://localhost:3001/health

# Test Donor Service
curl http://localhost:3002/health

# Test Inventory Service
curl http://localhost:3003/health

# Test Request Service
curl http://localhost:3004/health
```

Expected response:
```json
{
  "success": true,
  "service": "API Gateway",
  "timestamp": "2024-12-15T10:30:00.000Z",
  "uptime": 123.456
}
```

## Step 4: Test the System

### Register a User

```powershell
# Register an admin user
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    \"email\": \"admin@hospital1.com\",
    \"password\": \"test123\",
    \"name\": \"Admin User\",
    \"role\": \"BLOODBANK_ADMIN\",
    \"hospital_id\": \"hospital1\"
  }'
```

### Login and Get Token

```powershell
# Login
curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{
    \"email\": \"admin@hospital1.com\",
    \"password\": \"test123\"
  }'
```

Copy the `token` from the response.

### Test Protected Endpoints

```powershell
# Set your token
$TOKEN = "your-jwt-token-here"

# Create a donor
curl -X POST http://localhost:3000/api/donors `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    \"name\": \"John Donor\",
    \"blood_group\": \"O+\",
    \"contact\": \"+1234567890\",
    \"age\": 25,
    \"hospital_id\": \"hospital1\"
  }'

# List donors
curl -X GET http://localhost:3000/api/donors `
  -H "Authorization: Bearer $TOKEN"

# Check inventory availability
curl -X GET "http://localhost:3000/api/inventory/availability?blood_group=O+" `
  -H "Authorization: Bearer $TOKEN"
```

## Troubleshooting

### Services Won't Start

```powershell
# Check logs for errors
docker-compose logs

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Port Already in Use

```powershell
# Check what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Database Connection Issues

```powershell
# Check MongoDB containers
docker-compose ps | findstr db

# Restart databases
docker-compose restart auth-db donor-db inventory-db request-db
```

### Reset Everything

```powershell
# Stop and remove all containers and volumes
docker-compose down -v

# Start fresh
docker-compose up -d
```

## Common Commands

```powershell
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f gateway

# Restart a service
docker-compose restart gateway

# Rebuild a service
docker-compose build gateway
docker-compose up -d gateway

# Check resource usage
docker stats

# Remove unused images
docker image prune -a
```

## Next Steps

1. ✅ Read `API_DOCUMENTATION.md` for complete API reference
2. ✅ Read `DEPLOYMENT.md` for production deployment
3. ✅ Test all endpoints using the API documentation
4. ✅ Configure HTTPS for production (see DEPLOYMENT.md)

## Support

- **API Documentation:** `API_DOCUMENTATION.md`
- **Deployment Guide:** `DEPLOYMENT.md`
- **Architecture Overview:** `README.md`
- **Logs:** `docker-compose logs -f`

---

**Quick Reference:**

| Service | Port | Purpose |
|---------|------|---------|
| Gateway | 3000 | API entry point |
| Auth | 3001 | User authentication |
| Donor | 3002 | Donor management |
| Inventory | 3003 | Blood inventory |
| Request | 3004 | Blood requests |
| Notification | 3005 | Email/SMS (optional) |
| IoT | 3006 | Sensor data (optional) |
| Ledger | 3007 | Audit logs (optional) |
