@echo off
echo Starting Downloader Website...

:: Start Server
start "Downloader Server" cmd /k "cd server && npm install && npm start"

:: Start Client
start "Downloader Client" cmd /k "cd client && npm install && npm run dev"

echo.
echo Application is launching in two new windows!
echo Once the client builds, open the Local URL (usually http://localhost:5173) in your browser.
echo.
pause
