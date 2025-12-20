$ErrorActionPreference = "Stop"

# Register the user directly as 'admin' (since validation now allows it)
$body = @{
    name        = "System Admin"
    email       = "admin@blood.com"
    password    = "password123"
    role        = "admin"
    hospital_id = "ADMIN_HOSP"
} | ConvertTo-Json

Write-Host "Registering admin user..."
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/register" -Method Post -ContentType "application/json" -Body $body
    Write-Host "Registration successful: $($response.success)"
    Write-Host "Response Message: $($response.message)"
    if ($response.data) {
        Write-Host "User ID: $($response.data.user._id)"
        Write-Host "Role: $($response.data.user.role)"
    }
}
catch {
    Write-Host "Registration failed (might already exist): $_"
    # Print detailed error if available
    try {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host "Error Details: $($reader.ReadToEnd())"
    }
    catch {}
}

Write-Host "`nAdmin Credentials Created:"
Write-Host "Email:    admin@blood.com"
Write-Host "Password: password123"
