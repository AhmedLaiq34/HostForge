# HostForge 🚀

**HostForge** is a user-friendly tool that enables non-technical users to deploy static websites to Azure without needing to use the terminal or understand complex cloud infrastructure.

## Features

- **Simple Web Interface**: Upload your static website as a ZIP file through an intuitive web form
- **One-Click Deployment**: Deploy to Azure with just a few clicks
- **Automatic Infrastructure**: Terraform automatically provisions all necessary Azure resources
- **Real-time Status Updates**: See deployment progress and get live URLs
- **No Terminal Required**: Everything runs through a web interface
- **Secure**: Validates inputs and handles errors gracefully

##  Architecture

```
HostForge/
├── frontend/           # Web interface (HTML/CSS/JS)
├── backend/           # Flask API server
├── terraform/         # Infrastructure as Code
└── start_hostforge.bat # Windows launcher
```

### How It Works

1. **User Interface**: Frontend form collects website files and configuration
2. **Backend Processing**: Flask API handles file uploads and orchestrates deployment
3. **Infrastructure**: Terraform provisions Azure Storage Account with static website hosting
4. **Deployment**: Azure CLI uploads static files to the storage account
5. **Result**: Live website URL is returned to the user

## System Requirements

### Minimum Requirements
- **Operating System**: Windows 10/11
- **Python**: 3.7 or higher
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 1GB free space
- **Internet**: Required for Azure deployment and dependency installation

### Required Software

#### 1. Python 3.7+
**Download**: [python.org/downloads](https://www.python.org/downloads/)

**Windows Installation**:
- Download the latest Python installer
- **Important**: Check "Add Python to PATH" during installation
- Verify installation: Open Command Prompt and run `python --version`

#### 2. Terraform
**Download**: [terraform.io/downloads](https://www.terraform.io/downloads.html)

**Windows Installation**:
- Download the Windows binary
- Extract to `C:\terraform\`
- Add `C:\terraform\` to your system PATH
- Verify: `terraform --version`

#### 3. Azure CLI
**Download**: [docs.microsoft.com/azure/cli](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)

**Windows Installation**:
- Download the MSI installer
- Run the installer and follow the prompts
- Verify: `az --version`

### Azure Setup
1. **Azure Account**: You need an active Azure subscription
2. **Azure Login**: Run `az login` in your terminal to authenticate with Azure
3. **Permissions**: Your account needs permissions to create resource groups and storage accounts

## Quick Start

### Windows Users
1. **Download/Clone** this repository
2. **Double-click** `start_hostforge.bat`
3. **Wait** for the application to start (first run may take longer to install dependencies)
4. **Open** your browser to the frontend interface
5. **Upload** your static website ZIP file and fill in the form
6. **Deploy** with one click!

### Manual Start (Windows)

#### Step 1: Clone the Repository
```cmd
git clone https://github.com/yourusername/HostForge.git
cd HostForge
```

#### Step 2: Install Python Dependencies
```cmd
cd backend
pip install -r requirements.txt
```

#### Step 3: Start the Backend Server
```cmd
python app.py
```

#### Step 4: Open the Frontend
- Navigate to `frontend/index.html` in your browser
- Or serve it with a local web server:
  ```cmd
  cd frontend
  python -m http.server 8000
  # Then open http://localhost:8000
  ```

## Usage Guide

### Preparing Your Static Website

1. **Create your website** with HTML, CSS, and JavaScript files
2. **Ensure you have an `index.html`** file in the root of your website
3. **Zip all files** into a single ZIP archive
4. **Keep the ZIP file size reasonable** (under 100MB recommended)

**Example website structure**:
```
my-website/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
└── images/
    └── logo.png
```

### Deployment Process

1. **Fill out the form**:
   - **Azure Location**: Choose the region closest to your users
   - **Environment**: Enter environment name (e.g., "production", "staging")
   - **Owner**: Your name or team identifier
   - **Storage Account Name**: 3-24 characters, lowercase letters and numbers only
   - **Website ZIP File**: Upload your static website

2. **Click Deploy**: The system will:
   - Validate your inputs
   - Create Azure resources
   - Upload your website files
   - Return a live URL

3. **Access your site**: Use the provided URL to view your live website

## 🔧 Configuration

### Azure Locations
HostForge supports all Azure regions that support static website hosting:
- **North America**: eastus, eastus2, centralus, westus, westus2, westus3
- **Europe**: westeurope, northeurope, uksouth, francecentral
- **Asia Pacific**: southeastasia, japaneast, koreacentral, australiaeast
- **Others**: canadacentral, brazilsouth, centralindia

### Resource Naming
- **Resource Group**: Auto-generated as `rg-{owner}-{environment}-{storage}-{date}-{id}`
- **Storage Account**: User-provided name (3-24 characters, lowercase alphanumeric)
- **Website URL**: `https://{storage-account}.z13.web.core.windows.net`

## 🛠️ Development

### Project Structure
```
HostForge/
├── frontend/
│   ├── index.html      # Main web interface
│   ├── style.css       # Styling
│   ├── script.js       # Frontend logic
│   └── images/         # Static assets
├── backend/
│   ├── app.py          # Flask API server
│   └── requirements.txt # Python dependencies
├── terraform/
│   ├── main.tf         # Main Terraform configuration
│   ├── variables.tf    # Input variables
│   ├── outputs.tf      # Output values
│   └── modules/        # Terraform modules
└── start_hostforge.bat # Windows launcher
```

### Backend API Endpoints
- `GET /` - Health check
- `GET /status` - System status and dependency check
- `POST /deploy` - Main deployment endpoint

### Terraform Modules
- **Resource Group**: Creates Azure resource group
- **Storage Account**: Creates storage account with static website hosting

## Security Features

- **Input Validation**: All user inputs are validated before processing
- **File Type Checking**: Only ZIP files are accepted
- **Storage Account Naming**: Enforces Azure naming conventions
- **Error Handling**: Comprehensive error handling and user feedback
- **Temporary File Cleanup**: Automatic cleanup of uploaded files

## Troubleshooting

### Common Issues

#### Python Issues
**"Python is not recognized"**
- Ensure Python is installed and added to PATH
- Try running `python --version`
- Reinstall Python and check "Add to PATH" during installation

**"pip is not recognized"**
- Install pip: `python -m ensurepip --upgrade`
- Or download get-pip.py and run: `python get-pip.py`

**"Permission denied"**
- Run Command Prompt as Administrator

#### Terraform Issues
**"Terraform not found"**
- Install Terraform and add to PATH
- Verify installation with `terraform --version`
- Ensure the terraform.exe is in your PATH

**"Terraform state locked"**
- Delete `.terraform.tfstate.lock.info` file
- Or run `terraform force-unlock <lock-id>`

#### Azure CLI Issues
**"Azure CLI not found"**
- Install Azure CLI and add to PATH
- Run `az login` to authenticate
- Verify with `az --version`

**"Not logged in to Azure"**
- Run `az login` in terminal
- Follow the browser authentication process
- Verify with `az account show`

#### Backend Issues
**"Backend is not responding"**
- Ensure the Flask server is running
- Check that port 5000 is not blocked by firewall
- Verify Python dependencies are installed: `pip install -r requirements.txt`
- Check backend logs for error messages

**"Port 5000 already in use"**
- Find and stop the process using port 5000
- Or change the port in `backend/app.py`

#### Deployment Issues
**"Deployment failed"**
- Check Azure subscription status
- Verify you have permissions to create resources
- Ensure storage account name is unique globally
- Check backend logs for detailed error information

**"Invalid storage account name"**
- Use only lowercase letters and numbers
- Length must be 3-24 characters
- Name must be globally unique across Azure
- Avoid reserved words like "azure", "microsoft", etc.

**"Resource group creation failed"**
- Check Azure subscription limits
- Verify you have permissions to create resource groups
- Try a different region if the current one has issues

### Getting Help

1. **Check the logs** in the backend command window
2. **Verify Azure login** with `az account show`
3. **Test Terraform** manually in the terraform directory
4. **Check file permissions** and disk space
5. **Review error messages** in the web interface

### Debug Mode
To enable debug logging, modify `backend/app.py`:
```python
logging.basicConfig(level=logging.DEBUG)
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
1. Check the troubleshooting section above
2. Review the error messages in the web interface
3. Check the backend logs for detailed error information
4. Open an issue on GitHub with detailed error information

---

**Happy Hosting! 🎉**
