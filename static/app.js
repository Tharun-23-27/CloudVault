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
    if (!file) return alert("Select a file");

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
        alert(data.message || "File uploaded successfully");
        fileInput.value = "";
        loadFiles();
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
                    <td class="file-size">${f.size_kb} KB</td>
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
    if (!confirm("Delete file?")) return;

    fetch(`/delete/${encodeURIComponent(name)}`, {
        method: "DELETE",
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
        }
    })
    .then(() => loadFiles());
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
