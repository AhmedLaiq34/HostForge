document.addEventListener("DOMContentLoaded", () => {
  const locationSelect = document.getElementById("location");
  const form = document.getElementById("deploy-form");
  const statusDiv = document.getElementById("status");
  const submitButton = form.querySelector('button[type="submit"]');
  const fileInput = document.getElementById("zip_file");
  const fileUploadLabel = document.querySelector('.file-upload-label');

  // Valid Azure locations supporting static website hosting
  const azureLocations = [
    "eastus", "eastus2", "centralus", "northcentralus", "southcentralus",
    "westus", "westus2", "westus3", "westeurope", "northeurope", "uksouth",
    "canadacentral", "australiaeast", "southeastasia", "japaneast", "koreacentral",
    "centralindia", "brazilsouth", "francecentral"
  ];

  // Populate dropdown with animation
  azureLocations.forEach((loc, index) => {
    const option = document.createElement("option");
    option.value = loc;
    option.textContent = loc;
    locationSelect.appendChild(option);
    
    // Add staggered animation
    setTimeout(() => {
      option.style.opacity = "1";
      option.style.transform = "translateY(0)";
    }, index * 50);
  });

  // Set default location
  locationSelect.value = "eastus";

  // Enhanced status update with animations
  function updateStatus(message, type = "info") {
    const statusClass = type === "error" ? "error" : type === "success" ? "success" : "info";
    
    // Remove existing status with fade out
    const existingStatus = statusDiv.querySelector('.status');
    if (existingStatus) {
      existingStatus.style.opacity = "0";
      existingStatus.style.transform = "translateY(-10px)";
      setTimeout(() => {
        existingStatus.remove();
      }, 300);
    }

    // Add new status with fade in
    setTimeout(() => {
      statusDiv.innerHTML = `<div class="status ${statusClass}">${message}</div>`;
      const newStatus = statusDiv.querySelector('.status');
      newStatus.style.opacity = "0";
      newStatus.style.transform = "translateY(10px)";
      
      requestAnimationFrame(() => {
        newStatus.style.opacity = "1";
        newStatus.style.transform = "translateY(0)";
      });
    }, 300);
  }

  // Enhanced loading state
  function setLoading(loading) {
    submitButton.disabled = loading;
    
    if (loading) {
      submitButton.innerHTML = '<span class="loading-spinner"></span>Deploying...';
      submitButton.style.background = 'linear-gradient(135deg, #017392, #790b6a)';
    } else {
      submitButton.innerHTML = '🚀 Deploy Website';
      submitButton.style.background = 'linear-gradient(135deg, #0189af, #9c0d82)';
    }
  }

  // File upload enhancements
  function updateFileLabel(file) {
    if (file) {
      fileUploadLabel.innerHTML = `📁 ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
      fileUploadLabel.style.background = 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(76, 175, 80, 0.1))';
      fileUploadLabel.style.borderColor = '#4caf50';
    } else {
      fileUploadLabel.innerHTML = '📁 Choose a ZIP file or drag and drop here';
      fileUploadLabel.style.background = 'linear-gradient(135deg, rgba(1, 137, 175, 0.1), rgba(156, 13, 130, 0.1))';
      fileUploadLabel.style.borderColor = 'rgba(1, 137, 175, 0.5)';
    }
  }

  // Drag and drop functionality
  const fileUploadWrapper = document.querySelector('.file-upload-wrapper');

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    fileUploadWrapper.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ['dragenter', 'dragover'].forEach(eventName => {
    fileUploadWrapper.addEventListener(eventName, highlight, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    fileUploadWrapper.addEventListener(eventName, unhighlight, false);
  });

  function highlight(e) {
    fileUploadLabel.classList.add('dragover');
  }

  function unhighlight(e) {
    fileUploadLabel.classList.remove('dragover');
  }

  fileUploadWrapper.addEventListener('drop', handleDrop, false);

  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.zip')) {
        fileInput.files = files;
        updateFileLabel(file);
      } else {
        updateStatus("❌ Please select a valid ZIP file.", "error");
      }
    }
  }

  // File input change handler
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    updateFileLabel(file);
  });

  // Enhanced form validation with animations
  function validateForm() {
    let isValid = true;
    const inputs = form.querySelectorAll('input[required], select[required]');
    
    inputs.forEach(input => {
      if (!input.checkValidity()) {
        input.style.borderColor = '#e74c3c';
        input.style.animation = 'shake 0.5s ease-in-out';
        isValid = false;
        
        // Remove animation after it completes
        setTimeout(() => {
          input.style.animation = '';
        }, 500);
      } else {
        input.style.borderColor = 'rgba(225, 229, 233, 0.8)';
      }
    });
    
    return isValid;
  }

  // Handle form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Enhanced validation
    if (!validateForm()) {
      updateStatus("❌ Please fill in all required fields correctly.", "error");
      return;
    }
    
    // Validate storage account name
    const storageAccountName = form.storage_account_name.value;
    if (!/^[a-z0-9]{3,24}$/.test(storageAccountName)) {
      updateStatus("❌ Storage account name must be 3-24 characters, lowercase letters and numbers only.", "error");
      form.storage_account_name.style.borderColor = '#e74c3c';
      form.storage_account_name.style.animation = 'shake 0.5s ease-in-out';
      return;
    }

    // Validate file
    const zipFile = form.zip_file.files[0];
    if (!zipFile || !zipFile.name.endsWith('.zip')) {
      updateStatus("❌ Please select a valid ZIP file.", "error");
      return;
    }

    setLoading(true);
    updateStatus("🚀 Starting deployment... This may take several minutes.", "info");

    const formData = new FormData(form);

    try {
      // Check backend status first
      const statusResponse = await fetch("/status");
      if (!statusResponse.ok) {
        throw new Error("Backend is not responding. Please ensure the backend is running.");
      }

      const statusResult = await statusResponse.json();
      if (statusResult.status !== "healthy") {
        throw new Error(`Backend issue: ${statusResult.error || "Unknown error"}`);
      }

      // Proceed with deployment
      updateStatus("📦 Starting deployment process...", "info");
      
      const response = await fetch("/deploy", {
        method: "POST",
        body: formData
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        updateStatus(`
          ✅ <strong>Deployment Successful!</strong><br>
          🌐 <strong>Your site is live at:</strong> <a href="${result.url}" target="_blank">${result.url}</a><br>
          📁 <strong>Resource Group:</strong> ${result.resource_group_name}<br>
          💾 <strong>Storage Account:</strong> ${result.storage_account_name}
        `, "success");
        
        // Add success animation
        submitButton.style.background = 'linear-gradient(135deg, #4caf50, #45a049)';
        setTimeout(() => {
          submitButton.style.background = 'linear-gradient(135deg, #0189af, #9c0d82)';
        }, 2000);
      } else {
        updateStatus(`❌ <strong>Deployment Failed:</strong><br>${result.error}`, "error");
      }
    } catch (err) {
      console.error(err);
      if (err.message.includes("Failed to fetch")) {
        updateStatus("❌ <strong>Connection Error:</strong><br>Cannot connect to the backend. Please ensure the backend server is running.", "error");
      } else {
        updateStatus(`❌ <strong>Error:</strong><br>${err.message}`, "error");
      }
    } finally {
      setLoading(false);
    }
  });

  // Enhanced real-time validation for storage account name
  const storageAccountInput = form.storage_account_name;
  storageAccountInput.addEventListener("input", (e) => {
    const value = e.target.value;
    const isValid = /^[a-z0-9]{0,24}$/.test(value);
    
    if (value.length > 0 && !isValid) {
      e.target.setCustomValidity("Storage account name must contain only lowercase letters and numbers");
      e.target.style.borderColor = '#e74c3c';
    } else if (value.length < 3 && value.length > 0) {
      e.target.setCustomValidity("Storage account name must be at least 3 characters");
      e.target.style.borderColor = '#f39c12';
    } else {
      e.target.setCustomValidity("");
      e.target.style.borderColor = 'rgba(225, 229, 233, 0.8)';
    }
  });

  // Add hover effects to form elements
  const formElements = form.querySelectorAll('input, select');
  formElements.forEach(element => {
    element.addEventListener('mouseenter', () => {
      element.style.transform = 'translateY(-2px)';
    });
    
    element.addEventListener('mouseleave', () => {
      element.style.transform = 'translateY(0)';
    });
  });

  // Add typing animation to inputs
  formElements.forEach(element => {
    element.addEventListener('focus', () => {
      element.style.transform = 'translateY(-3px)';
    });
    
    element.addEventListener('blur', () => {
      element.style.transform = 'translateY(0)';
    });
  });
});
