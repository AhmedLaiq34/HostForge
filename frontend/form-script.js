// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initNavigation();
    initFormHandling();
    initFileUpload();
    initMobileMenu();
    initFormValidation();
});

// Navigation functionality
function initNavigation() {
    const navbar = document.querySelector('.navbar');
    
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        }
    });
}

// Mobile menu functionality
function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close mobile menu when clicking on a link
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
}

// Form handling
function initFormHandling() {
    const form = document.getElementById('deploy-form');
    const submitBtn = form.querySelector('.submit-btn');
    const statusDiv = document.getElementById('status');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deploying...';
        
        // Clear previous status
        statusDiv.innerHTML = '';
        statusDiv.className = 'status-message loading';
        statusDiv.textContent = 'Initializing deployment...';

        try {
            // Get form data
            const formData = new FormData(form);
            
            // Validate form data
            const validation = validateFormData(formData);
            if (!validation.isValid) {
                throw new Error(validation.message);
            }

            // Show progress updates
            updateStatus('Creating Azure resources...', 'loading');
            
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            updateStatus('Uploading website files...', 'loading');
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            updateStatus('Configuring static website...', 'loading');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            updateStatus('Enabling HTTPS...', 'loading');
            await new Promise(resolve => setTimeout(resolve, 500));

            // Make actual API call
            const response = await fetch('/deploy', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            // Show success
            updateStatus(`✅ Deployment successful! Your website is live at: ${result.website_url}`, 'success');
            
            // Reset button
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            submitBtn.innerHTML = '<i class="fas fa-rocket"></i> Deploy Website';
            
            // Show success notification
            showNotification('Website deployed successfully!', 'success');
            
        } catch (error) {
            console.error('Deployment error:', error);
            
            // Show error
            updateStatus(`❌ Deployment failed: ${error.message}`, 'error');
            
            // Reset button
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            submitBtn.innerHTML = '<i class="fas fa-rocket"></i> Deploy Website';
            
            // Show error notification
            showNotification('Deployment failed. Please try again.', 'error');
        }
    });
}

// File upload functionality
function initFileUpload() {
    const fileInput = document.getElementById('zip_file');
    const fileLabel = document.querySelector('.file-upload-label');
    
    if (fileInput && fileLabel) {
        // Handle file selection
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // Update label with file name
                const fileName = file.name;
                const fileSize = (file.size / (1024 * 1024)).toFixed(2);
                
                fileLabel.innerHTML = `
                    <i class="fas fa-check-circle" style="color: #10b981;"></i>
                    <span>${fileName}</span>
                    <small>${fileSize} MB</small>
                `;
                
                // Add success styling
                fileLabel.style.borderColor = '#10b981';
                fileLabel.style.background = '#f0fdf4';
            }
        });

        // Drag and drop functionality
        const uploadWrapper = document.querySelector('.file-upload-wrapper');
        
        uploadWrapper.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileLabel.style.borderColor = '#6366f1';
            fileLabel.style.background = '#f1f5f9';
        });

        uploadWrapper.addEventListener('dragleave', (e) => {
            e.preventDefault();
            fileLabel.style.borderColor = '#cbd5e1';
            fileLabel.style.background = '#f8fafc';
        });

        uploadWrapper.addEventListener('drop', (e) => {
            e.preventDefault();
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                fileInput.dispatchEvent(new Event('change'));
            }
        });
    }
}

// Form validation
function initFormValidation() {
    const form = document.getElementById('deploy-form');
    const inputs = form.querySelectorAll('input, select');
    
    inputs.forEach(input => {
        input.addEventListener('blur', () => {
            validateField(input);
        });
        
        input.addEventListener('input', () => {
            // Remove error styling on input
            if (input.classList.contains('error')) {
                input.classList.remove('error');
                const errorMessage = input.parentNode.querySelector('.error-message');
                if (errorMessage) {
                    errorMessage.remove();
                }
            }
        });
    });
}

function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    // Remove existing error styling
    field.classList.remove('error');
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    // Validation rules
    switch (field.name) {
        case 'location':
            if (!value) {
                isValid = false;
                errorMessage = 'Please select a location';
            }
            break;
            
        case 'environment':
            if (!value) {
                isValid = false;
                errorMessage = 'Environment is required';
            } else if (value.length < 2) {
                isValid = false;
                errorMessage = 'Environment must be at least 2 characters';
            }
            break;
            
        case 'owner':
            if (!value) {
                isValid = false;
                errorMessage = 'Owner is required';
            } else if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
                isValid = false;
                errorMessage = 'Owner can only contain letters, numbers, hyphens, and underscores';
            }
            break;
            
        case 'storage_account_name':
            if (!value) {
                isValid = false;
                errorMessage = 'Storage account name is required';
            } else if (!/^[a-z0-9]{3,24}$/.test(value)) {
                isValid = false;
                errorMessage = 'Storage account name must be 3-24 characters, lowercase letters and numbers only';
            }
            break;
            
        case 'zip_file':
            if (!value) {
                isValid = false;
                errorMessage = 'Please select a ZIP file';
            }
            break;
    }

    if (!isValid) {
        field.classList.add('error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = errorMessage;
        errorDiv.style.cssText = `
            color: #dc2626;
            font-size: 0.875rem;
            margin-top: 0.25rem;
        `;
        field.parentNode.appendChild(errorDiv);
    }

    return isValid;
}

function validateFormData(formData) {
    const location = formData.get('location');
    const environment = formData.get('environment');
    const owner = formData.get('owner');
    const storageAccountName = formData.get('storage_account_name');
    const zipFile = formData.get('zip_file');

    if (!location) {
        return { isValid: false, message: 'Please select a location' };
    }
    
    if (!environment || environment.trim().length < 2) {
        return { isValid: false, message: 'Environment must be at least 2 characters' };
    }
    
    if (!owner || !/^[a-zA-Z0-9_-]+$/.test(owner)) {
        return { isValid: false, message: 'Owner can only contain letters, numbers, hyphens, and underscores' };
    }
    
    if (!storageAccountName || !/^[a-z0-9]{3,24}$/.test(storageAccountName)) {
        return { isValid: false, message: 'Storage account name must be 3-24 characters, lowercase letters and numbers only' };
    }
    
    if (!zipFile || zipFile.size === 0) {
        return { isValid: false, message: 'Please select a ZIP file' };
    }
    
    if (zipFile.size > 100 * 1024 * 1024) { // 100MB limit
        return { isValid: false, message: 'File size must be less than 100MB' };
    }

    return { isValid: true };
}

// Update status message
function updateStatus(message, type) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = `status-message ${type}`;
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 400px;
    `;

    notification.querySelector('.notification-content').style.cssText = `
        display: flex;
        align-items: center;
        gap: 0.5rem;
    `;

    notification.querySelector('.notification-close').style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        margin-left: auto;
    `;

    // Add to page
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Close functionality
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    });

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Add error styling for form fields
const errorStyles = `
    .form-group input.error,
    .form-group select.error {
        border-color: #dc2626;
        box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }
`;

const errorStyleSheet = document.createElement('style');
errorStyleSheet.textContent = errorStyles;
document.head.appendChild(errorStyleSheet);

// Add loading animation for submit button
const loadingStyles = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .submit-btn.loading i {
        animation: spin 1s linear infinite;
    }
`;

const loadingStyleSheet = document.createElement('style');
loadingStyleSheet.textContent = loadingStyles;
document.head.appendChild(loadingStyleSheet); 