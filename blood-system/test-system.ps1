# Blood Bank System - Quick Test Script
# This script demonstrates the basic functionality

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Blood Bank System - Quick Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000/api"

# Step 1: Register an Admin User
Write-Host "Step 1: Registering admin user..." -ForegroundColor Yellow
$registerBody = @{
    email       = "admin@hospital1.com"
    password    = "test123"
    name        = "Admin User"
    role        = "BLOODBANK_ADMIN"
    hospital_id = "hospital1"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    Write-Host "✓ Admin user registered successfully" -ForegroundColor Green
    $token = $registerResponse.data.token
}
catch {
    Write-Host "✗ Registration failed (user may already exist)" -ForegroundColor Yellow
    
    # Try to login instead
    Write-Host "  Attempting to login..." -ForegroundColor Yellow
    $loginBody = @{
        email    = "admin@hospital1.com"
        password = "test123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    Write-Host "✓ Logged in successfully" -ForegroundColor Green
    $token = $loginResponse.data.token
}

Write-Host "`nJWT Token: $($token.Substring(0, 50))..." -ForegroundColor Gray

# Step 2: Create a Donor
Write-Host "`nStep 2: Creating a donor..." -ForegroundColor Yellow
$donorBody = @{
    name        = "John Donor"
    blood_group = "O+"
    contact     = "+1234567890"
    email       = "john@example.com"
    age         = 25
    weight      = 70
    hospital_id = "hospital1"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}

try {
    $donorResponse = Invoke-RestMethod -Uri "$baseUrl/donors" -Method Post -Body $donorBody -Headers $headers
    Write-Host "✓ Donor created successfully" -ForegroundColor Green
    Write-Host "  Name: $($donorResponse.data.donor.name)" -ForegroundColor Gray
    Write-Host "  Blood Group: $($donorResponse.data.donor.blood_group)" -ForegroundColor Gray
    Write-Host "  Eligible: $($donorResponse.data.eligibility.eligible)" -ForegroundColor Gray
}
catch {
    Write-Host "✗ Failed to create donor: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 3: Add Blood to Inventory
Write-Host "`nStep 3: Adding blood units to inventory..." -ForegroundColor Yellow
$inventoryBody = @{
    blood_group = "O+"
    quantity    = 5
    expiry_date = "2025-12-31"
    unit_type   = "Whole Blood"
    hospital_id = "hospital1"
} | ConvertTo-Json

try {
    $inventoryResponse = Invoke-RestMethod -Uri "$baseUrl/inventory" -Method Post -Body $inventoryBody -Headers $headers
    Write-Host "✓ Blood units added successfully" -ForegroundColor Green
    Write-Host "  Blood Group: $($inventoryResponse.data.blood_group)" -ForegroundColor Gray
    Write-Host "  Quantity: $($inventoryResponse.data.quantity) units" -ForegroundColor Gray
}
catch {
    Write-Host "✗ Failed to add inventory: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Check Availability
Write-Host "`nStep 4: Checking blood availability..." -ForegroundColor Yellow
try {
    $availabilityResponse = Invoke-RestMethod -Uri "$baseUrl/inventory/availability?blood_group=O+" -Headers $headers
    Write-Host "✓ Availability check successful" -ForegroundColor Green
    foreach ($item in $availabilityResponse.data.availability) {
        Write-Host "  Blood Group: $($item._id)" -ForegroundColor Gray
        Write-Host "  Total Quantity: $($item.total_quantity) units" -ForegroundColor Gray
        Write-Host "  Number of Units: $($item.units_count)" -ForegroundColor Gray
    }
}
catch {
    Write-Host "✗ Failed to check availability: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 5: Create a Blood Request
Write-Host "`nStep 5: Creating a blood request..." -ForegroundColor Yellow
$requestBody = @{
    blood_group  = "O+"
    quantity     = 2
    urgency      = "high"
    patient_name = "Emergency Patient"
    reason       = "Surgery"
    hospital_id  = "hospital1"
} | ConvertTo-Json

try {
    $requestResponse = Invoke-RestMethod -Uri "$baseUrl/requests" -Method Post -Body $requestBody -Headers $headers
    Write-Host "✓ Blood request created successfully" -ForegroundColor Green
    Write-Host "  Request ID: $($requestResponse.data.request._id)" -ForegroundColor Gray
    Write-Host "  Status: $($requestResponse.data.request.status)" -ForegroundColor Gray
    Write-Host "  Sufficient Stock: $($requestResponse.data.availability.sufficient)" -ForegroundColor Gray
    $requestId = $requestResponse.data.request._id
}
catch {
    Write-Host "✗ Failed to create request: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 6: List All Requests
Write-Host "`nStep 6: Listing all blood requests..." -ForegroundColor Yellow
try {
    $requestsResponse = Invoke-RestMethod -Uri "$baseUrl/requests" -Headers $headers
    Write-Host "✓ Found $($requestsResponse.data.requests.Count) request(s)" -ForegroundColor Green
    foreach ($req in $requestsResponse.data.requests) {
        Write-Host "  - $($req.blood_group) | Qty: $($req.quantity) | Status: $($req.status) | Urgency: $($req.urgency)" -ForegroundColor Gray
    }
}
catch {
    Write-Host "✗ Failed to list requests: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test completed successfully!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. View API documentation: notepad API_DOCUMENTATION.md" -ForegroundColor Gray
Write-Host "2. Check service logs: docker-compose logs -f" -ForegroundColor Gray
Write-Host "3. Stop services: docker-compose down" -ForegroundColor Gray
Write-Host ""
