$port = 3001
$url = "http://localhost:3001"
$isRunning = $false

try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $tcp.Connect("127.0.0.1", $port)
    $tcp.Close()
    $isRunning = $true
} catch {
    $isRunning = $false
}

if (-not $isRunning) {
    # Start node completely hidden (no console window)
    Start-Process -FilePath "d:\Shlagbaun\node.exe" -ArgumentList "index.js" -WorkingDirectory "d:\Shlagbaun\backend" -WindowStyle Hidden
    
    $attempts = 0
    while ($attempts -lt 25) {
        Start-Sleep -Milliseconds 250
        try {
            $tcp = New-Object System.Net.Sockets.TcpClient
            $tcp.Connect("127.0.0.1", $port)
            $tcp.Close()
            break
        } catch {
            $attempts++
        }
    }
}

# Open browser
Start-Process $url
