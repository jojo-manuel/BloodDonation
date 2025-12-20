$headers = @{
    "Content-Type" = "application/json"
}

$registerBody = @{
    name        = "Test User"
    email       = "testuser@example.com"
    password    = "password123"
    role        = "DONOR"
    hospital_id = "HUSP123"
} | ConvertTo-Json

Write-Host "Testing Registration..."
try {
    $response = Invoke-RestMethod -Method Post -Uri "http://localhost:3001/register" -Headers $headers -Body $registerBody
    Write-Host "Registration Success!"
    Write-Host ($response | ConvertTo-Json -Depth 5)
}
catch {
    Write-Host "Registration Failed!"
    Write-Host $_.Exception.ToString()
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $details = $reader.ReadToEnd()
        Write-Host "Response Details: $details"
    }
}

$loginBody = @{
    email    = "testuser@example.com"
    password = "password123"
} | ConvertTo-Json

Write-Host "`nTesting Login..."
try {
    $response = Invoke-RestMethod -Method Post -Uri "http://localhost:3001/login" -Headers $headers -Body $loginBody
    Write-Host "Login Success!"
    Write-Host ($response | ConvertTo-Json -Depth 5)
}
catch {
    Write-Host "Login Failed!"
    Write-Host $_.Exception.ToString()
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $details = $reader.ReadToEnd()
        Write-Host "Response Details: $details"
    }
}
