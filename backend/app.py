from flask import Flask, request, jsonify, render_template, redirect
from flask_jwt_extended import (
    JWTManager, create_access_token,
    jwt_required, get_jwt_identity
)
from datetime import timedelta
import sqlite3

from database import create_users_table
from s3_utils import (
    upload_file_to_s3,
    generate_presigned_url,
    list_user_files,
    delete_file
)

app = Flask(__name__, template_folder="../templates", static_folder="../static")

# ================= CONFIG =================
app.config["JWT_SECRET_KEY"] = "cloudvault-secret-key-1234567890"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=30)
jwt = JWTManager(app)

DB_PATH = "backend/cloudvault.db"
create_users_table()

def get_db():
    return sqlite3.connect(DB_PATH)

# ================= PAGES =================
@app.route("/")
def home():
    return render_template("home.html")

@app.route("/login-page")
def login_page():
    return render_template("login.html")

@app.route("/register-page")
def register_page():
    return render_template("register.html")

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

# ================= AUTH =================
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    email = data["email"]
    password = data["password"]

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO users (email, password) VALUES (?, ?)",
            (email, password)
        )
        conn.commit()
    except:
        return jsonify({"error": "User already exists"}), 409
    finally:
        conn.close()

    return jsonify({"message": "Registered successfully"})

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data["email"]
    password = data["password"]

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT password FROM users WHERE email=?", (email,))
    user = cur.fetchone()
    conn.close()

    if not user or user[0] != password:
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=email)
    return jsonify({"access_token": token})


# ================= FILE OPS =================
@app.route("/upload", methods=["POST"])
@jwt_required()
def upload():
    user = get_jwt_identity()
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file"}), 400

    upload_file_to_s3(file, file.filename, user)
    return jsonify({"message": "File uploaded successfully"})

@app.route("/my-files")
@jwt_required()
def my_files():
    user = get_jwt_identity()
    return jsonify(list_user_files(user))

@app.route("/view/<filename>")
@jwt_required()
def view(filename):
    user = get_jwt_identity()
    url = generate_presigned_url(f"{user}/{filename}")
    return jsonify({"url": url})

@app.route("/download/<filename>")
@jwt_required()
def download(filename):
    user = get_jwt_identity()
    url = generate_presigned_url(
        f"{user}/{filename}",
        download=True
    )
    return jsonify({"url": url})

@app.route("/delete/<filename>", methods=["DELETE"])
@jwt_required()
def delete(filename):
    user = get_jwt_identity()
    delete_file(user, filename)
    return jsonify({"message": "File deleted"})


if __name__ == "__main__":
    app.run(debug=True)
