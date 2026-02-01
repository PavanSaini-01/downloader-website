@echo off
echo ========================================
echo YouTube Cookies Base64 Encoder
echo ========================================
echo.

REM Check if cookies file exists
if not exist "www.youtube.com_cookies.txt" (
    echo ERROR: www.youtube.com_cookies.txt not found!
    echo.
    echo Please:
    echo 1. Export cookies from your browser using the extension
    echo 2. Save as www.youtube.com_cookies.txt in this folder
    echo 3. Run this script again
    echo.
    pause
    exit /b 1
)

echo Found www.youtube.com_cookies.txt
echo Converting to base64...
echo.

REM Convert to base64 and copy to clipboard
powershell -Command "[Convert]::ToBase64String([IO.File]::ReadAllBytes('www.youtube.com_cookies.txt')) | Set-Clipboard"

if %ERRORLEVEL% EQU 0 (
    echo SUCCESS! Base64 string copied to clipboard.
    echo.
    echo Next steps:
    echo 1. Go to your Render service dashboard
    echo 2. Navigate to Environment tab
    echo 3. Add environment variable:
    echo    - Key: YOUTUBE_COOKIES_BASE64
    echo    - Value: Paste from clipboard (Ctrl+V)
    echo 4. Save and redeploy
    echo.
) else (
    echo ERROR: Failed to encode cookies
    echo.
)

pause
