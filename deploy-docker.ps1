# SkillSwapConnect Docker Deployment Script
# Run this script in PowerShell as Administrator

Write-Host "🚀 SkillSwapConnect Docker Deployment" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Check if Docker is running
Write-Host "🔍 Checking Docker installation..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker is installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed or not running!" -ForegroundColor Red
    Write-Host "Please install Docker Desktop and ensure it's running." -ForegroundColor Red
    exit 1
}

# Check if .env file exists
Write-Host "🔍 Checking environment configuration..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "⚠️ .env file not found. Creating from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "📝 Please edit .env file with your TiDB Cloud credentials before continuing!" -ForegroundColor Red
    Write-Host "   - Update DATABASE_URL with your TiDB Cloud connection string" -ForegroundColor Red
    Write-Host "   - Set a secure SESSION_SECRET" -ForegroundColor Red
    Write-Host "Press any key to continue after updating .env..."
    Read-Host
}

# Build Docker image
Write-Host "🏗️ Building Docker image..." -ForegroundColor Yellow
docker build -t skillswapconnect:latest .

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Docker image built successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to build Docker image!" -ForegroundColor Red
    exit 1
}

# Stop existing container if running
Write-Host "🛑 Stopping existing container (if any)..." -ForegroundColor Yellow
docker stop skillswapconnect 2>$null
docker rm skillswapconnect 2>$null

# Run the container
Write-Host "🚀 Starting container..." -ForegroundColor Yellow
docker run -d `
    --name skillswapconnect `
    --env-file .env `
    -p 3000:3000 `
    --restart unless-stopped `
    skillswapconnect:latest

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Container started successfully!" -ForegroundColor Green
    Write-Host "🌐 Application is running at: http://localhost:3000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📊 Container status:" -ForegroundColor Yellow
    docker ps --filter "name=skillswapconnect"
    Write-Host ""
    Write-Host "📋 Useful commands:" -ForegroundColor Yellow
    Write-Host "   View logs: docker logs skillswapconnect" -ForegroundColor Gray
    Write-Host "   Stop app:  docker stop skillswapconnect" -ForegroundColor Gray
    Write-Host "   Start app: docker start skillswapconnect" -ForegroundColor Gray
    Write-Host "   Remove:    docker rm skillswapconnect" -ForegroundColor Gray
} else {
    Write-Host "❌ Failed to start container!" -ForegroundColor Red
    Write-Host "📋 Check logs with: docker logs skillswapconnect" -ForegroundColor Yellow
    exit 1
}
