// ================= NOTIFICATION SYSTEM =================
function showNotification(title, message, type = 'success') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    // Remove existing notification if any
    const existing = container.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    // Add active class to container
    container.classList.add('active');

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const iconSvg = type === 'success' 
        ? '<svg class="notification-icon success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"></path></svg>'
        : '<svg class="notification-icon error" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    
    notification.innerHTML = `
        ${iconSvg}
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <svg class="notification-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    `;
    
    container.appendChild(notification);
    
    // Close button handler
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.add('hide');
        setTimeout(() => {
            notification.remove();
            container.classList.remove('active');
        }, 400);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.classList.add('hide');
            setTimeout(() => {
                notification.remove();
                container.classList.remove('active');
            }, 400);
        }
    }, 5000);
}

// ================= FILE SIZE CONVERTER =================
function formatFileSize(sizeKB) {
    const size = parseFloat(sizeKB);
    
    if (size < 1) {
        return (size * 1024).toFixed(2) + ' B';
    } else if (size < 1024) {
        return size.toFixed(2) + ' KB';
    } else if (size < 1024 * 1024) {
        return (size / 1024).toFixed(2) + ' MB';
    } else {
        return (size / (1024 * 1024)).toFixed(2) + ' GB';
    }
}

// ================= LOGIN =================
function login() {
    fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: document.getElementById("email").value,
            password: document.getElementById("password").value
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.access_token) {
            localStorage.setItem("token", data.access_token);
            window.location.href = "/dashboard"; // ✅ FIXED
        } else {
            alert("Login failed");
        }
    });
}

// ================= REGISTER =================
function register() {
    fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: document.getElementById("email").value,
            password: document.getElementById("password").value
        })
    })
    .then(res => res.json())
    .then(() => {
        alert("Registered successfully");
        window.location.href = "/login-page";
    });
}


// ================= UPLOAD =================
function uploadFile() {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];
    if (!file) {
        showNotification('No File Selected', 'Please select a file to upload', 'error');
        return;
    }

    const form = new FormData();
    form.append("file", file);

    fetch("/upload", {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
        },
        body: form
    })
    .then(res => res.json())
    .then(data => {
        showNotification('Upload Successful', data.message || 'Your file has been uploaded successfully', 'success');
        fileInput.value = "";
        loadFiles();
    })
    .catch(error => {
        showNotification('Upload Failed', 'There was an error uploading your file', 'error');
    });
}


// ================= LOAD FILES =================
function loadFiles() {
    fetch("/my-files", {
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
        }
    })
    .then(res => res.json())
    .then(files => {
        const list = document.getElementById("filesList");
        if (!list) return;
        
        list.innerHTML = "";

        // Update stats
        const totalFilesEl = document.getElementById("totalFiles");
        const storageUsedEl = document.getElementById("storageUsed");
        
        if (totalFilesEl) {
            totalFilesEl.textContent = files.length;
        }
        
        if (storageUsedEl) {
            const totalKB = files.reduce((sum, f) => sum + parseFloat(f.size_kb), 0);
            storageUsedEl.textContent = (totalKB / 1024).toFixed(2) + " MB";
        }

        if (files.length === 0) {
            list.innerHTML = `
                <tr>
                    <td colspan="3">
                        <div class="empty-state">
                            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                <polyline points="13 2 13 9 20 9"></polyline>
                            </svg>
                            <div class="empty-text">No files uploaded yet</div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        files.forEach(f => {
            list.innerHTML += `
                <tr>
                    <td class="file-name">${f.filename}</td>
                    <td class="file-size">${formatFileSize(f.size_kb)}</td>
                    <td>
                        <div class="file-actions">
                            <button class="btn-action" onclick="viewFile('${f.filename}')">View</button>
                            <button class="btn-action" onclick="downloadFile('${f.filename}')">Download</button>
                            <button class="btn-action delete" onclick="deleteFile('${f.filename}')">Delete</button>
                        </div>
                    </td>
                </tr>
            `;
        });
    });
}


// ================= VIEW =================
function viewFile(name) {
    fetch(`/view/${encodeURIComponent(name)}`, {
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
        }
    })
    .then(res => res.json())
    .then(data => window.open(data.url, "_blank"));
}


// ================= DOWNLOAD =================
function downloadFile(name) {
    fetch(`/download/${encodeURIComponent(name)}`, {
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
        }
    })
    .then(res => res.json())
    .then(data => window.open(data.url, "_self"));
}


// ================= DELETE =================
function deleteFile(name) {
    if (!confirm("Are you sure you want to delete this file?")) return;

    fetch(`/delete/${encodeURIComponent(name)}`, {
        method: "DELETE",
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
        }
    })
    .then(res => res.json())
    .then(data => {
        showNotification('File Deleted', data.message || 'Your file has been deleted successfully', 'success');
        loadFiles();
    })
    .catch(error => {
        showNotification('Delete Failed', 'There was an error deleting your file', 'error');
    });
}


// ================= LOGOUT =================
function logout() {
    localStorage.removeItem("token");
    window.location.href = "/";
}


// ================= AUTO LOAD =================
window.onload = function () {
    if (document.getElementById("filesList")) {
        loadFiles();
    }
};
