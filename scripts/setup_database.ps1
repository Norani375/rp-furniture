# ============================================
# Neon Database Auto-Setup Script
# Run this ONCE to initialize your database
# ============================================

param(
    [string]$DatabaseUrl = "postgresql://neondb_owner:npg_3BDYyoPGWh6g@ep-plain-fire-aqjgfoax-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
)

Write-Host "`n🚀 Starting Neon Database Auto-Setup...`n" -ForegroundColor Cyan

# Check if psql is installed
$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
    Write-Host "❌ PostgreSQL client (psql) not found!" -ForegroundColor Red
    Write-Host "📥 Install it from: https://www.postgresql.org/download/windows/`n" -ForegroundColor Yellow
    exit 1
}

# Read SQL file
$sqlFile = Join-Path $PSScriptRoot "..\database\neon_clean_setup.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ SQL file not found: $sqlFile" -ForegroundColor Red
    exit 1
}

Write-Host "📄 Reading SQL file..." -ForegroundColor Blue
$sqlContent = Get-Content $sqlFile -Raw -Encoding UTF8

# Execute SQL
Write-Host "🔌 Connecting to Neon database..." -ForegroundColor Blue
Write-Host "📍 Host: ep-plain-fire-aqjgfoax-pooler.c-8.us-east-1.aws.neon.tech`n" -ForegroundColor Gray

try {
    $process = Start-Process -FilePath "psql" -ArgumentList $DatabaseUrl -NoNewWindow -Wait -PassThru -RedirectStandardInput "$env:TEMP\neon_sql_input.sql" -RedirectStandardOutput "$env:TEMP\neon_sql_output.log" -RedirectStandardError "$env:TEMP\neon_sql_error.log"
    
    # Write SQL to temp file
    Set-Content -Path "$env:TEMP\neon_sql_input.sql" -Value $sqlContent -Encoding UTF8
    
    Write-Host "⏳ Executing SQL..." -ForegroundColor Yellow
    
    # Run psql
    $output = & psql $DatabaseUrl -f $sqlFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Database setup completed successfully!" -ForegroundColor Green
        Write-Host "`n📊 Tables created:" -ForegroundColor Cyan
        $output | Select-String "CREATE TABLE" | ForEach-Object { Write-Host "  ✓ $_" -ForegroundColor Green }
    } else {
        Write-Host "`n⚠️ Some errors occurred (this is usually OK):`n" -ForegroundColor Yellow
        $output | Where-Object { $_ -match "ERROR|error" } | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    }
    
    Write-Host "`n🎉 Setup finished!`n" -ForegroundColor Green
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Run backend: node server/index.js" -ForegroundColor White
    Write-Host "  2. Run frontend: npm run dev" -ForegroundColor White
    Write-Host "  3. Open: http://localhost:5173" -ForegroundColor White
    Write-Host "  4. Login: admin@erp.com / admin123`n" -ForegroundColor White
    
} catch {
    Write-Host "`n❌ Error: $_`n" -ForegroundColor Red
    Write-Host "💡 Alternative: Run SQL manually in Neon Dashboard:" -ForegroundColor Yellow
    Write-Host "   1. Go to https://neon.tech" -ForegroundColor Gray
    Write-Host "   2. Open SQL Editor" -ForegroundColor Gray
    Write-Host "   3. Paste contents of: database/neon_clean_setup.sql`n" -ForegroundColor Gray
}
