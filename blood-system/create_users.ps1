$headers = @{
    "Content-Type" = "application/json"
}

# 1. Create a Donor User
$donorBody = @{
    email       = "donor@blood.com"
    password    = "password123"
    name        = "Test Donor"
    role        = "DONOR"
    hospital_id = "HOSP_001" # Creating a dummy hospital ID for context
} | ConvertTo-Json

try {
    Write-Host "Creating Donor..."
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method Post -Headers $headers -Body $donorBody
    Write-Host "Type: Donor"
    Write-Host "Email: donor@blood.com"
    Write-Host "Password: password123"
    Write-Host "------------------------"
}
catch {
    Write-Host "Error creating Donor: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "Details: $($reader.ReadToEnd())"
    }
}

# 2. Create a Blood Bank Admin User
$bbBody = @{
    email       = "bloodbank@blood.com"
    password    = "password123"
    name        = "Test Blood Bank"
    role        = "BLOODBANK_ADMIN"
    hospital_id = "BB_001"
} | ConvertTo-Json

try {
    Write-Host "Creating Blood Bank Admin..."
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method Post -Headers $headers -Body $bbBody
    Write-Host "Type: Blood Bank Admin"
    Write-Host "Email: bloodbank@blood.com"
    Write-Host "Password: password123"
    Write-Host "------------------------"
}
catch {
    Write-Host "Error creating Blood Bank Admin: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "Details: $($reader.ReadToEnd())"
    }
}
