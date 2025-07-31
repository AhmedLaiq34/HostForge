import warnings
warnings.filterwarnings("ignore", message=".*development server.*")

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import subprocess
import zipfile
import tempfile
import shutil
import uuid
import re
from datetime import datetime
import logging

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TERRAFORM_DIR = os.path.abspath("../terraform")
UPLOADS_DIR = os.path.join(tempfile.gettempdir(), "hostforge_upload")

# Security: Validate storage account name format
def validate_storage_account_name(name):
    """Validate Azure storage account name format"""
    if not name or len(name) < 3 or len(name) > 24:
        return False
    # Must be lowercase letters and numbers only
    if not re.match(r'^[a-z0-9]+$', name):
        return False
    return True

def generate_resource_group_name(owner, environment, storage_name):
    """Generate a unique resource group name"""
    timestamp = datetime.now().strftime("%Y%m%d")
    unique_id = str(uuid.uuid4())[:8]
    return f"rg-{owner}-{environment}-{storage_name}-{timestamp}-{unique_id}".lower()

def get_static_website_endpoint(location):
    """Get the correct static website endpoint suffix based on location"""
    # Map of Azure regions to their static website endpoint suffixes
    endpoint_map = {
        "eastus": "z13.web.core.windows.net",
        "eastus2": "z13.web.core.windows.net", 
        "southcentralus": "z13.web.core.windows.net",
        "westus2": "z13.web.core.windows.net",
        "westus3": "z13.web.core.windows.net",
        "canadacentral": "z13.web.core.windows.net",
        "canadaeast": "z13.web.core.windows.net",
        "northeurope": "z13.web.core.windows.net",
        "westeurope": "z13.web.core.windows.net",
        "uksouth": "z13.web.core.windows.net",
        "ukwest": "z13.web.core.windows.net",
        "eastasia": "z13.web.core.windows.net",
        "southeastasia": "z13.web.core.windows.net",
        "japaneast": "z13.web.core.windows.net",
        "japanwest": "z13.web.core.windows.net",
        "australiaeast": "z13.web.core.windows.net",
        "australiasoutheast": "z13.web.core.windows.net",
        "centralindia": "z13.web.core.windows.net",
        "southindia": "z13.web.core.windows.net",
        "westindia": "z13.web.core.windows.net",
        "brazilsouth": "z13.web.core.windows.net",
        "southafricanorth": "z13.web.core.windows.net",
        "uaenorth": "z13.web.core.windows.net"
    }
    
    # Default to z13 if location not found
    return endpoint_map.get(location.lower(), "z13.web.core.windows.net")

def check_dependencies():
    """Check if required tools are installed"""
    missing = []
    
    # Check for Terraform
    terraform_path = shutil.which("terraform")
    if not terraform_path:
        # Try common installation paths on Windows
        common_paths = [
            r"C:\Program Files\Terraform\terraform.exe",
            r"C:\terraform\terraform.exe",
            os.path.expanduser(r"~\AppData\Local\Microsoft\WinGet\Packages\HashiCorp.Terraform_Microsoft.Winget.Source_8wekyb3d8bbwe\terraform.exe")
        ]
        for path in common_paths:
            if os.path.exists(path):
                terraform_path = path
                break
    
    if not terraform_path:
        missing.append("Terraform")
    
    # Check for Azure CLI
    az_path = shutil.which("az")
    if not az_path:
        # Try common installation paths on Windows
        common_paths = [
            r"C:\Program Files (x86)\Microsoft SDKs\Azure\CLI2\wbin\az.cmd",
            r"C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd",
            os.path.expanduser(r"~\AppData\Local\Programs\Microsoft Azure CLI\az.cmd")
        ]
        for path in common_paths:
            if os.path.exists(path):
                az_path = path
                break
    
    if not az_path:
        missing.append("Azure CLI")

    if missing:
        raise EnvironmentError(f"The following tools are not installed or not in PATH: {', '.join(missing)}")
    
    return terraform_path, az_path

def cleanup_temp_files():
    """Clean up temporary files"""
    try:
        if os.path.exists(UPLOADS_DIR):
            shutil.rmtree(UPLOADS_DIR)
    except Exception as e:
        logger.warning(f"Failed to cleanup temp files: {e}")

def find_index_html(directory):
    """Find index.html file in the directory or its subdirectories"""
    for root, dirs, files in os.walk(directory):
        if 'index.html' in files:
            return root
    return None

@app.route('/')
def home():
    """Serve the main frontend page"""
    response = send_from_directory('../frontend', 'landing.html')
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route('/test')
def test():
    """Test route to verify Flask is working"""
    return jsonify({'message': 'Flask is working! Landing page should be served at /'})

@app.route('/<path:filename>')
def serve_frontend(filename):
    """Serve frontend static files"""
    response = send_from_directory('../frontend', filename)
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route('/deploy', methods=['POST'])
def deploy_site():
    """Main deployment endpoint"""
    try:
        # Check dependencies first
        terraform_path, az_path = check_dependencies()
    except EnvironmentError as e:
        return jsonify({'error': str(e)}), 500

    # Create uploads directory if it doesn't exist
    os.makedirs(UPLOADS_DIR, exist_ok=True)

    try:
        # Get form fields
        location = request.form.get("location")
        environment = request.form.get("environment")
        owner = request.form.get("owner")
        storage_account_name = request.form.get("storage_account_name")
        zip_file = request.files.get("zip_file")

        # Validate required fields
        if not all([location, environment, owner, storage_account_name, zip_file]):
            return jsonify({"error": "Missing one or more required fields"}), 400

        # Validate storage account name
        if not validate_storage_account_name(storage_account_name):
            return jsonify({"error": "Invalid storage account name. Must be 3-24 characters, lowercase letters and numbers only."}), 400

        # Generate resource group name
        resource_group_name = generate_resource_group_name(owner, environment, storage_account_name)

        # Validate zip file
        if not zip_file.filename.endswith('.zip'):
            return jsonify({"error": "Please upload a valid ZIP file"}), 400

        # Save terraform.tfvars.json
        tfvars_data = {
            "resource_group_name": resource_group_name,
            "location": location,
            "environment": environment,
            "owner": owner,
            "storage_account_name": storage_account_name
        }

        tfvars_path = os.path.join(TERRAFORM_DIR, "terraform.tfvars.json")
        with open(tfvars_path, 'w') as f:
            json.dump(tfvars_data, f, indent=2)

        # Save and unzip static website files
        zip_path = os.path.join(UPLOADS_DIR, "site.zip")
        zip_file.save(zip_path)

        extracted_dir = os.path.join(UPLOADS_DIR, "unzipped")
        os.makedirs(extracted_dir, exist_ok=True)

        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extracted_dir)

        # Find the directory containing index.html
        website_root = find_index_html(extracted_dir)
        if not website_root:
            return jsonify({"error": "ZIP file must contain an index.html file"}), 400
        
        # Use the directory containing index.html as the source for upload
        extracted_dir = website_root

        # Ensure Azure login
        try:
            # Call Azure CLI directly
            result = subprocess.run([az_path, "account", "show"], 
                                  check=True, capture_output=True, text=True, timeout=30)
        except subprocess.CalledProcessError:
            return jsonify({"error": "Please run 'az login' in your terminal first"}), 500
        except subprocess.TimeoutExpired:
            return jsonify({"error": "Azure CLI command timed out. Please check your Azure login status."}), 500

        # Run Terraform commands
        logger.info("Initializing Terraform...")
        subprocess.run([terraform_path, "init"], cwd=TERRAFORM_DIR, check=True, capture_output=True, timeout=300)

        logger.info("Applying Terraform configuration...")
        subprocess.run([terraform_path, "apply", "-auto-approve"], cwd=TERRAFORM_DIR, check=True, capture_output=True, timeout=600)

        # Get storage key
        logger.info("Getting storage account key...")
        key_result = subprocess.run([az_path, "storage", "account", "keys", "list", 
                                   "--account-name", storage_account_name,
                                   "--query", "[0].value",
                                   "--output", "tsv"], 
                                  capture_output=True, text=True, check=True, timeout=60)
        storage_key = key_result.stdout.strip()

        # Upload static files
        logger.info("Uploading static files...")
        logger.info(f"Source directory: {extracted_dir}")
        logger.info(f"Storage account: {storage_account_name}")
        
        # Call Azure CLI directly without PowerShell to avoid $ character issues
        upload_cmd = [az_path, "storage", "blob", "upload-batch", 
                     "--account-name", storage_account_name,
                     "--account-key", storage_key,
                     "--destination", "$web",
                     "--source", extracted_dir]
        logger.info(f"Upload command: {' '.join(upload_cmd)}")
        
        try:
            upload_result = subprocess.run(upload_cmd, 
                                         check=True, capture_output=True, text=True, timeout=300)
            logger.info("Upload completed successfully")
            logger.info(f"Upload output: {upload_result.stdout}")
        except subprocess.CalledProcessError as e:
            logger.error(f"Upload failed: {e}")
            logger.error(f"Upload stderr: {e.stderr}")
            return jsonify({"error": f"File upload failed: {e.stderr}"}), 500
        except subprocess.TimeoutExpired as e:
            logger.error(f"Upload timed out: {e}")
            return jsonify({"error": "File upload timed out. Please try again."}), 500

        # Get output URL from Terraform
        logger.info("Getting deployment URL...")
        output = subprocess.run(
            [terraform_path, "output", "-json"],
            cwd=TERRAFORM_DIR,
            capture_output=True, text=True, check=True, timeout=60
        )
        
        try:
            outputs = json.loads(output.stdout)
            logger.info(f"Terraform outputs: {outputs}")
            
            # Check if static_site_url exists and has a value
            if "static_site_url" not in outputs:
                logger.error("static_site_url not found in Terraform outputs")
                raise KeyError("static_site_url not found in outputs")
            
            url = outputs["static_site_url"]["value"]
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Failed to parse Terraform outputs: {e}")
            logger.info("Attempting to construct URL manually...")
            # Construct URL based on location
            endpoint_suffix = get_static_website_endpoint(location)
            url = f"https://{storage_account_name}.{endpoint_suffix}/"
            logger.info(f"Using fallback URL: {url}")
        if not url:
            logger.error("static_site_url value is empty or null")
            # Fallback: construct URL manually
            logger.info("Attempting to construct URL manually...")
            endpoint_suffix = get_static_website_endpoint(location)
            fallback_url = f"https://{storage_account_name}.{endpoint_suffix}/"
            logger.info(f"Using fallback URL: {fallback_url}")
            url = fallback_url
        
        logger.info(f"Deployment URL: {url}")

        # Cleanup temp files
        cleanup_temp_files()

        logger.info(f"Deployment successful: {url}")
        response_data = {
            "success": True, 
            "url": url,
            "resource_group_name": resource_group_name,
            "storage_account_name": storage_account_name
        }
        logger.info(f"Sending response: {response_data}")
        return jsonify(response_data)

    except subprocess.CalledProcessError as e:
        cleanup_temp_files()
        error_msg = e.stderr.decode() if e.stderr else str(e)
        logger.error(f"Deployment failed: {error_msg}")
        return jsonify({"error": f"Deployment failed: {error_msg}"}), 500
    except subprocess.TimeoutExpired as e:
        cleanup_temp_files()
        logger.error(f"Command timed out: {e}")
        return jsonify({"error": f"Operation timed out: {e}"}), 500
    except Exception as e:
        cleanup_temp_files()
        logger.error(f"Unexpected error: {e}")
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

@app.route('/status')
def status():
    """Health check endpoint"""
    try:
        terraform_path, az_path = check_dependencies()
        return jsonify({
            "status": "healthy", 
            "dependencies": "all_installed",
            "terraform_path": terraform_path,
            "az_path": az_path
        })
    except EnvironmentError as e:
        return jsonify({"status": "unhealthy", "error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
