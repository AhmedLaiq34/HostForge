@echo off
echo ========================================
echo           HostForge Launcher
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.7+ and try again
    pause
    exit /b 1
)

echo ✅ Python is installed and working

REM Install Python dependencies
echo.
echo 📦 Installing Python dependencies...
cd backend
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM Start the Flask backend server
echo.
echo 🔧 Starting HostForge backend server...
echo Backend will be available at: http://localhost:5000
echo.
start "HostForge Backend" cmd /k "python app.py"

REM Wait a moment for the server to start
echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak >nul

REM Open the frontend in the default browser
echo 🌐 Opening HostForge frontend in browser...
cd ..
start "" "http://localhost:5000"

echo.
echo ========================================
echo 🎉 HostForge is now running!
echo ========================================
echo.
echo Backend: http://localhost:5000
echo Frontend: Should open automatically in your browser
echo.
echo If the frontend doesn't open automatically:
echo 1. Open your web browser
echo 2. Go to: http://localhost:5000
echo.
echo To test the deployment:
echo 1. Upload a ZIP file containing your website
echo 2. Fill in the form details
echo 3. Click Deploy
echo.
echo To stop the application:
echo 1. Close the backend command window
echo 2. Close this window
echo.
echo Press any key to close this window...
pause >nul 