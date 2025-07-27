@echo off
setlocal enabledelayedexpansion

echo ========================================
echo           HostForge Launcher
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo.
    echo Would you like to install Python automatically? (Y/N)
    set /p install_python=
    
    if /i "!install_python!"=="Y" (
        echo.
        echo 📥 Installing Python...
        echo This will download and install the latest Python version.
        echo.
        
        REM Download Python installer using PowerShell
        powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.5/python-3.11.5-amd64.exe' -OutFile 'python-installer.exe'}"
        
        if exist python-installer.exe (
            echo Installing Python...
            python-installer.exe /quiet InstallAllUsers=1 PrependPath=1 Include_test=0
            del python-installer.exe
            
            echo.
            echo ✅ Python installed successfully!
            echo Please restart this batch file to continue.
            pause
            exit /b 0
        ) else (
            echo ❌ Failed to download Python installer
            echo.
            echo Please install Python manually:
            echo 1. Go to https://www.python.org/downloads/
            echo 2. Download the latest Python version
            echo 3. Run the installer and check "Add Python to PATH"
            echo 4. Restart this batch file
            pause
            exit /b 1
        )
    ) else (
        echo.
        echo Please install Python manually:
        echo 1. Go to https://www.python.org/downloads/
        echo 2. Download the latest Python version
        echo 3. Run the installer and check "Add Python to PATH"
        echo 4. Restart this batch file
        pause
        exit /b 1
    )
)

echo ✅ Python is installed and working

REM Check Python version
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set python_version=%%i
echo 📋 Python version: !python_version!

REM Check if pip is available
python -m pip --version >nul 2>&1
if errorlevel 1 (
    echo ❌ pip is not available
    echo Installing pip...
    python -m ensurepip --upgrade
    if errorlevel 1 (
        echo ❌ Failed to install pip
        pause
        exit /b 1
    )
)

echo ✅ pip is available

REM Install Python dependencies
echo.
echo 📦 Installing Python dependencies...
cd backend

REM Upgrade pip first
python -m pip install --upgrade pip

REM Install dependencies
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Failed to install Python dependencies
    echo.
    echo Trying alternative installation methods...
    
    REM Try with --user flag
    pip install --user -r requirements.txt
    if errorlevel 1 (
        echo ❌ Failed to install dependencies even with --user flag
        echo.
        echo Please try running as Administrator or install manually:
        echo 1. Open Command Prompt as Administrator
        echo 2. Navigate to the backend directory
        echo 3. Run: pip install -r requirements.txt
        pause
        exit /b 1
    )
)

echo ✅ Dependencies installed successfully

REM Check for Terraform
terraform --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Warning: Terraform not found in PATH
    echo.
    echo Terraform is required for deployment. Please install it:
    echo 1. Go to https://www.terraform.io/downloads.html
    echo 2. Download the Windows binary
    echo 3. Extract to C:\terraform\
    echo 4. Add C:\terraform\ to your system PATH
    echo.
    echo You can still test the application, but deployment will fail.
    echo.
)

REM Check for Azure CLI
az --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Warning: Azure CLI not found in PATH
    echo.
    echo Azure CLI is required for deployment. Please install it:
    echo 1. Go to https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
    echo 2. Download and install Azure CLI
    echo 3. Run 'az login' to authenticate
    echo.
    echo You can still test the application, but deployment will fail.
    echo.
)

REM Start the Flask backend server
echo.
echo 🔧 Starting HostForge backend server...
echo Backend will be available at: http://localhost:5000
echo.
start "HostForge Backend" cmd /k "python app.py"

REM Wait a moment for the server to start
echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak >nul

REM Check if server started successfully
curl -s http://localhost:5000 >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Warning: Backend server may not have started properly
    echo Check the backend window for error messages
    echo.
)

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