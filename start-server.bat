@echo off
REM Batch file لتشغيل Angular Development Server
REM يمكنك النقر المزدوج على هذا الملف لتشغيل السيرفر

cd /d "%~dp0"
if exist "angular.json" (
    echo ✓ تم العثور على المشروع في المجلد الحالي
    echo.
    echo 🚀 بدء تشغيل السيرفر...
    ng serve -o
) else if exist "Pick_go-Front\angular.json" (
    cd /d "%~dp0Pick_go-Front"
    echo ✓ تم العثور على المشروع في Pick_go-Front
    echo.
    echo 🚀 بدء تشغيل السيرفر...
    ng serve -o
) else (
    echo ✗ خطأ: لم يتم العثور على angular.json
    echo المسار الحالي: %CD%
    echo.
    echo يرجى التأكد من أنك في مجلد المشروع الصحيح
    pause
    exit /b 1
)

