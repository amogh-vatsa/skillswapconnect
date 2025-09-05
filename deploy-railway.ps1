# SkillSwapConnect Railway Deployment Script
# Run this script in PowerShell

Write-Host "🚀 SkillSwapConnect Railway Deployment" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Check if Railway CLI is installed
Write-Host "🔍 Checking Railway CLI..." -ForegroundColor Yellow
try {
    $railwayVersion = railway --version
    Write-Host "✅ Railway CLI is installed: $railwayVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g @railway/cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Railway CLI!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Railway CLI installed successfully!" -ForegroundColor Green
}

# Login to Railway
Write-Host "🔐 Please login to Railway..." -ForegroundColor Yellow
railway login

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Railway login failed!" -ForegroundColor Red
    exit 1
}

# Check for environment variables
Write-Host "⚠️ IMPORTANT: Make sure you have your TiDB Cloud details ready!" -ForegroundColor Yellow
Write-Host "You'll need:" -ForegroundColor Yellow
Write-Host "  - TiDB Cloud connection string (DATABASE_URL)" -ForegroundColor Gray
Write-Host "  - Session secret (generate one if needed)" -ForegroundColor Gray
Write-Host ""

# Prompt for environment variables
$DATABASE_URL = Read-Host "Enter your TiDB Cloud DATABASE_URL"
if ([string]::IsNullOrWhiteSpace($DATABASE_URL)) {
    Write-Host "❌ DATABASE_URL is required!" -ForegroundColor Red
    exit 1
}

$SESSION_SECRET = Read-Host "Enter your SESSION_SECRET (or press Enter to generate one)"
if ([string]::IsNullOrWhiteSpace($SESSION_SECRET)) {
    # Generate a secure random string
    $bytes = New-Object Byte[] 32
    [Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
    $SESSION_SECRET = [System.Convert]::ToBase64String($bytes)
    Write-Host "✅ Generated SESSION_SECRET: $SESSION_SECRET" -ForegroundColor Green
}

# Initialize Railway project
Write-Host "🚀 Initializing Railway project..." -ForegroundColor Yellow
railway init

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to initialize Railway project!" -ForegroundColor Red
    exit 1
}

# Set environment variables
Write-Host "🔧 Setting environment variables..." -ForegroundColor Yellow

railway variables set DATABASE_URL="$DATABASE_URL"
railway variables set SESSION_SECRET="$SESSION_SECRET"
railway variables set NODE_ENV="production"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to set environment variables!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Environment variables set successfully!" -ForegroundColor Green

# Deploy
Write-Host "🚀 Deploying to Railway..." -ForegroundColor Yellow
railway up

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Your SkillSwapConnect app is now live!" -ForegroundColor Cyan
    Write-Host "📋 Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Check Railway dashboard for your app URL" -ForegroundColor Gray
    Write-Host "   2. Test the health endpoint: /api/health" -ForegroundColor Gray
    Write-Host "   3. Try creating a user account" -ForegroundColor Gray
    Write-Host "   4. Monitor logs: railway logs" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🔗 Useful commands:" -ForegroundColor Yellow
    Write-Host "   View logs: railway logs" -ForegroundColor Gray
    Write-Host "   Open app: railway open" -ForegroundColor Gray
    Write-Host "   Dashboard: railway dashboard" -ForegroundColor Gray
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "📋 Check the logs with: railway logs" -ForegroundColor Yellow
    exit 1
}
