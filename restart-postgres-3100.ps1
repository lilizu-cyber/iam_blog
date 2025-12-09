# PowerShell script to kill PostgreSQL processes and restart on port 3100

Write-Host "🔍 Checking for PostgreSQL processes..." -ForegroundColor Yellow

# Find PostgreSQL processes
$postgresProcesses = Get-Process -Name postgres -ErrorAction SilentlyContinue
if ($postgresProcesses) {
    Write-Host "Found PostgreSQL processes:" -ForegroundColor Yellow
    $postgresProcesses | Format-Table Id, ProcessName, StartTime
    
    Write-Host "`n🛑 Killing PostgreSQL processes..." -ForegroundColor Red
    $postgresProcesses | Stop-Process -Force
    Start-Sleep -Seconds 2
    Write-Host "✅ PostgreSQL processes killed" -ForegroundColor Green
} else {
    Write-Host "✅ No PostgreSQL processes found" -ForegroundColor Green
}

# Check for Docker PostgreSQL containers
Write-Host "`n🔍 Checking for Docker PostgreSQL containers..." -ForegroundColor Yellow
$dockerContainers = docker ps -a --filter "name=postgres" --format "{{.Names}}" 2>$null
if ($dockerContainers) {
    Write-Host "Found Docker containers:" -ForegroundColor Yellow
    docker ps -a --filter "name=postgres"
    
    Write-Host "`n🛑 Stopping Docker PostgreSQL containers..." -ForegroundColor Red
    docker stop $(docker ps -a --filter "name=postgres" -q) 2>$null
    docker rm $(docker ps -a --filter "name=postgres" -q) 2>$null
    Write-Host "✅ Docker containers stopped and removed" -ForegroundColor Green
} else {
    Write-Host "✅ No Docker PostgreSQL containers found" -ForegroundColor Green
}

# Check if port 3100 is available
Write-Host "`n🔍 Checking port 3100..." -ForegroundColor Yellow
$port3100 = Get-NetTCPConnection -LocalPort 3100 -ErrorAction SilentlyContinue
if ($port3100) {
    Write-Host "⚠️  Port 3100 is in use by process ID: $($port3100.OwningProcess)" -ForegroundColor Yellow
    $process = Get-Process -Id $port3100.OwningProcess -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "   Process: $($process.ProcessName)" -ForegroundColor Yellow
        Write-Host "   Killing process..." -ForegroundColor Red
        Stop-Process -Id $port3100.OwningProcess -Force
        Start-Sleep -Seconds 2
    }
}

Write-Host "`n📝 Options to start PostgreSQL on port 3100:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: Docker (Recommended)" -ForegroundColor Green
Write-Host "  docker run -d --name postgres-3100 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=iam_blog_db -p 3100:5432 postgres:15-alpine" -ForegroundColor White
Write-Host ""
Write-Host "Option 2: Docker Compose (Update docker-compose.yml)" -ForegroundColor Green
Write-Host "  Update ports from '5432:5432' to '3100:5432' in docker-compose.yml" -ForegroundColor White
Write-Host "  Then run: docker-compose up -d postgresql" -ForegroundColor White
Write-Host ""
Write-Host "Option 3: Local PostgreSQL Service" -ForegroundColor Green
Write-Host "  Update postgresql.conf: port = 3100" -ForegroundColor White
Write-Host "  Restart PostgreSQL service" -ForegroundColor White
Write-Host ""

