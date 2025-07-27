document.addEventListener("DOMContentLoaded", () => {
  const locationSelect = document.getElementById("location");
  const form = document.getElementById("deploy-form");
  const statusDiv = document.getElementById("status");
  const submitButton = form.querySelector('button[type="submit"]');

  // Valid Azure locations supporting static website hosting
  const azureLocations = [
    "eastus", "eastus2", "centralus", "northcentralus", "southcentralus",
    "westus", "westus2", "westus3", "westeurope", "northeurope", "uksouth",
    "canadacentral", "australiaeast", "southeastasia", "japaneast", "koreacentral",
    "centralindia", "brazilsouth", "francecentral"
  ];

  // Populate dropdown
  azureLocations.forEach(loc => {
    const option = document.createElement("option");
    option.value = loc;
    option.textContent = loc;
    locationSelect.appendChild(option);
  });

  // Set default location
  locationSelect.value = "eastus";

  function updateStatus(message, type = "info") {
    const statusClass = type === "error" ? "error" : type === "success" ? "success" : "info";
    statusDiv.innerHTML = `<div class="status ${statusClass}">${message}</div>`;
  }

  function setLoading(loading) {
    submitButton.disabled = loading;
    submitButton.textContent = loading ? "Deploying..." : "Deploy";
  }

  // Handle form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Validate storage account name
    const storageAccountName = form.storage_account_name.value;
    if (!/^[a-z0-9]{3,24}$/.test(storageAccountName)) {
      updateStatus("❌ Storage account name must be 3-24 characters, lowercase letters and numbers only.", "error");
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
      
      // Add progress updates
      
      
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

  // Add real-time validation for storage account name
  const storageAccountInput = form.storage_account_name;
  storageAccountInput.addEventListener("input", (e) => {
    const value = e.target.value;
    const isValid = /^[a-z0-9]{0,24}$/.test(value);
    
    if (value.length > 0 && !isValid) {
      e.target.setCustomValidity("Storage account name must contain only lowercase letters and numbers");
    } else if (value.length < 3 && value.length > 0) {
      e.target.setCustomValidity("Storage account name must be at least 3 characters");
    } else {
      e.target.setCustomValidity("");
    }
  });
});
