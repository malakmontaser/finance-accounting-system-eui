from flask import Blueprint, request, jsonify
from models import db, User, Faculty
from flask_jwt_extended import create_access_token


auth_bp = Blueprint("auth", __name__)


# ============================================================================
# ENDPOINT: POST /api/auth/register
# Description: User registration for students
# ============================================================================
@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new student user.

    Request Body:
    {
        "username": "student_username",
        "email": "student@example.com",
        "password": "secure_password",
        "first_name": "John",
        "last_name": "Doe",
        "faculty_code": "CIS"  // Code of the faculty to assign
    }

    Returns:
    {
        "msg": "User registered successfully",
        "user_id": 1,
        "username": "student_username",
        "faculty": {
            "id": 1,
            "name": "Computer and Information Science",
            "code": "CIS"
        }
    }
    """
    data = request.get_json()

    # Validate required fields
    required_fields = ["username", "email", "password", "first_name", "last_name"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    username = data.get("username").strip()
    email = data.get("email").strip()
    password = data.get("password")
    first_name = data.get("first_name").strip()
    last_name = data.get("last_name").strip()
    faculty_code = data.get("faculty_code")

    # Check if username or email already exists
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 409
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already in use"}), 409

    # Validate faculty if provided
    faculty = None
    if faculty_code:
        faculty = Faculty.query.filter_by(code=faculty_code.upper()).first()
        if not faculty:
            return jsonify({"error": "Invalid faculty code"}), 400

    try:
        # Create new user
        user = User(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            is_admin=False,
            faculty_id=faculty.id if faculty else None
        )
        user.set_password(password)

        db.session.add(user)
        db.session.commit()

        # Generate access token
        access_token = create_access_token(identity=user.id)

        # Prepare response
        response_data = {
            "msg": "User registered successfully",
            "user_id": user.id,
            "username": user.username,
            "access_token": access_token
        }

        # Include faculty info in response if available
        if faculty:
            response_data["faculty"] = {
                "id": faculty.id,
                "name": faculty.name,
                "code": faculty.code
            }

        return jsonify(response_data), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Registration failed: {str(e)}"}), 500


# ============================================================================
# ENDPOINT: POST /api/auth/login
# Description: Authenticate user and issue JWT token
# ============================================================================
@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Authenticate user and issue JWT access token.

    Request Body:
    {
        "username": "student_username",
        "password": "secure_password"
    }

    Returns:
    {
        "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
        "user_id": 1,
        "username": "student_username",
        "is_admin": false,
        "dues_balance": 0.0
    }
    """
    data = request.get_json()

    if not data or not data.get("username") or not data.get("password"):
        return jsonify({"error": "Username and password are required"}), 400

    username = data.get("username")
    password = data.get("password")

    # Find user by username
    user = User.query.filter_by(username=username).first()

    # Verify credentials
    if not user or not user.verify_password(password):
        return jsonify({"error": "Invalid username or password"}), 401

    try:
        # Create JWT token with user ID as string identity
        access_token = create_access_token(
            identity=str(user.id),  # Must be a string
            additional_claims={
                "username": user.username,
                "is_admin": user.is_admin,
                "user_id": user.id,
                "email": user.email
            }
        )

        return jsonify({
            "access_token": access_token,
            "user_id": user.id,
            "username": user.username,
            "email": user.email,
            "is_admin": user.is_admin,
            "dues_balance": user.dues_balance
        }), 200

    except Exception as e:
        return jsonify({"error": f"Login failed: {str(e)}"}), 500


# ============================================================================
# ENDPOINT: POST /api/auth/register-admin
# Description: Register a new admin user (Finance Department)
# Note: This should be protected in production
# ============================================================================
@auth_bp.route("/register-admin", methods=["POST"])
def register_admin():
    """
    Register a new admin user (Finance Department personnel).

    Request Body:
    {
        "username": "admin_username",
        "email": "admin@example.com",
        "password": "secure_password"
    }

    Returns:
    {
        "msg": "Admin user registered successfully",
        "user_id": 2,
        "username": "admin_username",
        "is_admin": true
    }
    """
    data = request.get_json()

    # Validate required fields
    if not data or not data.get("username") or not data.get("password"):
        return jsonify({"error": "Username and password are required"}), 400

    username = data.get("username").strip()
    email = data.get("email", "").strip() if data.get("email") else None
    password = data.get("password")

    # Check if user already exists
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 409

    if email and User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    try:
        # Create new admin user
        new_admin = User(
            username=username,
            email=email,
            password_hash=User.generate_hash(password),
            is_admin=True,  # Mark as admin
            dues_balance=0.0
        )

        db.session.add(new_admin)
        db.session.commit()

        return jsonify({
            "msg": "Admin user registered successfully",
            "user_id": new_admin.id,
            "username": new_admin.username,
            "is_admin": True
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Admin registration failed: {str(e)}"}), 500
