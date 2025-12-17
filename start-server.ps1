# Script لتشغيل Angular Development Server
# يمكنك تشغيل هذا الملف من أي مكان

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# البحث عن angular.json في المجلد الحالي أو المجلدات الفرعية
$angularJsonPath = $null
if (Test-Path (Join-Path $scriptPath "angular.json")) {
    $angularJsonPath = $scriptPath
} elseif (Test-Path (Join-Path $scriptPath "Pick_go-Front\angular.json")) {
    $angularJsonPath = Join-Path $scriptPath "Pick_go-Front"
}

if ($angularJsonPath) {
    Write-Host "✓ تم العثور على المشروع في: $angularJsonPath" -ForegroundColor Green
    Set-Location $angularJsonPath
    Write-Host "`n🚀 بدء تشغيل السيرفر..." -ForegroundColor Cyan
    ng serve -o
} else {
    Write-Host "✗ خطأ: لم يتم العثور على angular.json" -ForegroundColor Red
    Write-Host "المسار الحالي: $scriptPath" -ForegroundColor Yellow
    Write-Host "يرجى التأكد من أنك في مجلد المشروع الصحيح" -ForegroundColor Yellow
    pause
    exit 1
}

