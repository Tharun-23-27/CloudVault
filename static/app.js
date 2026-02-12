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
    const file = document.getElementById("file").files[0];
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
        document.getElementById("uploadMsg").innerText = data.message || "Uploaded";
        document.getElementById("file").value = "";
        
        // Clear selected file display
        const selectedFileEl = document.getElementById("selectedFile");
        if (selectedFileEl) {
            selectedFileEl.textContent = "";
        }
        
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
        const list = document.getElementById("fileList");
        list.innerHTML = "";

        // Update stats
        const fileCountEl = document.getElementById("fileCount");
        const totalSizeEl = document.getElementById("totalSize");
        
        if (fileCountEl && totalSizeEl) {
            fileCountEl.textContent = files.length;
            const totalKB = files.reduce((sum, f) => sum + parseFloat(f.size_kb), 0);
            totalSizeEl.textContent = totalKB.toFixed(2) + " KB";
        }

        if (files.length === 0) {
            list.innerHTML = '<li class="empty-state"><p>No files uploaded yet</p></li>';
            return;
        }

        files.forEach(f => {
            list.innerHTML += `
                <li>
                    <span class="file-info">
                        <strong>${f.filename}</strong>
                        <span style="color: #6b7280;">(${f.size_kb} KB)</span>
                    </span>
                    <span class="file-actions">
                        <button onclick="viewFile('${f.filename}')">View</button>
                        <button onclick="downloadFile('${f.filename}')">Download</button>
                        <button class="delete" onclick="deleteFile('${f.filename}')">Delete</button>
                    </span>
                </li>
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
    if (document.getElementById("fileList")) {
        loadFiles();
    }
};
