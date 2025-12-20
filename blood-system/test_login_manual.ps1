$ErrorActionPreference = "Stop"
$body = @{
    email    = "admin@blood.com"
    password = "password123"
} | ConvertTo-Json

Write-Host "Sending Login Request..."
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -ContentType "application/json" -Body $body
    Write-Host "Login Response Success!"
    $token = $response.data.token
    Write-Host "Token: $token"

    $headers = @{ Authorization = "Bearer $token" }
    Write-Host "Requesting Users..."
    try {
        $users = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/users?hospital_id=ADMIN_HOSP" -Method Get -Headers $headers
        Write-Host "Users Response: $($users | ConvertTo-Json -Depth 5)"
    }
    catch {
        Write-Host "Users Failed: $_"
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            Write-Host "Error Body: $($reader.ReadToEnd())" 
        }
    }
}
catch {
    Write-Host "Login Failed: $_"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "Error Body: $($reader.ReadToEnd())"
    }
}
