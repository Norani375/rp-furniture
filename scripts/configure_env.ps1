# Configure local environment without hardcoding secrets in source files.
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts\configure_env.ps1

Write-Host "`nERP Environment Configuration" -ForegroundColor Cyan
Write-Host "Paste your Neon DATABASE_URL below. It will be saved only to .env, which is ignored by git." -ForegroundColor Yellow

$databaseUrl = Read-Host "DATABASE_URL"

if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
  Write-Host "DATABASE_URL is empty. Aborting." -ForegroundColor Red
  exit 1
}

if (-not ($databaseUrl.StartsWith("postgresql://") -or $databaseUrl.StartsWith("postgres://"))) {
  Write-Host "DATABASE_URL must start with postgresql:// or postgres://" -ForegroundColor Red
  exit 1
}

if ($databaseUrl -notmatch "neon\.tech") {
  Write-Host "Warning: this URL does not look like a Neon URL." -ForegroundColor Yellow
}

$envContent = @"
DATABASE_URL=$databaseUrl
PORT=3001
NODE_ENV=development
TOKEN_SECRET=erp-local-development-secret-change-in-production
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
LOG_LEVEL=INFO
"@

$envPath = Join-Path (Get-Location) ".env"
$envContent | Set-Content -Path $envPath -Encoding UTF8

Write-Host "`n.env file created successfully at: $envPath" -ForegroundColor Green
Write-Host "Next run:" -ForegroundColor Cyan
Write-Host "  node scripts/check_db.js" -ForegroundColor White
Write-Host "  node server/index.js" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
