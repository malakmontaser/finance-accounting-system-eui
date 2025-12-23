from flask import Blueprint, request, jsonify
from models import db, Course, User
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps


courses_bp = Blueprint("courses", __name__)


# ============================================================================
# HELPER FUNCTION: Check if user is admin (RBAC)
# ============================================================================
def require_admin(fn):
    """Decorator to enforce admin-only access."""
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        try:
            from models import User

            identity = get_jwt_identity()
            if not identity:
                return jsonify({"error": "Authentication required"}), 401

            # Get user from database to check admin status
            user = User.query.get(identity)
            if not user or not user.is_admin:
                return jsonify({"error": "Admin access required"}), 403

            # Add user to kwargs for the route to use if needed
            kwargs['current_user'] = user
            return fn(*args, **kwargs)

        except Exception as e:
            return jsonify({"error": f"Authorization failed: {str(e)}"}), 401
    return wrapper


# ============================================================================
# ENDPOINT: GET /api/courses
# Description: List all available courses
# ============================================================================
@courses_bp.route("", methods=["GET"])
@jwt_required(optional=True)
def list_courses():
    """
    List all available courses, optionally filtered by faculty.
    If the user is authenticated and is a student, only show courses from their faculty.

    Query Parameters:
        faculty_id (int, optional): Filter courses by faculty ID

    Returns:
    {
        "total_courses": 3,
        "courses": [
            {
                "id": 1,
                "course_id": "CS101",
                "name": "Computer Science",
                "credits": 3,
                "total_fee": 5000.0,
                "description": "Introduction to Computer Science",
                "faculty": {
                    "id": 1,
                    "name": "Computer and Information Sciences",
                    "code": "CIS"
                }
            }
        ]
    }
    """
    try:
        faculty_id = request.args.get('faculty_id', type=int)
        query = Course.query

        # If faculty_id is provided in query params, filter by it
        if faculty_id:
            query = query.filter_by(faculty_id=faculty_id)
        # If user is authenticated and is a student, filter by their faculty
        else:
            try:
                identity = get_jwt_identity()
                if identity:
                    user = User.query.get(identity)
                    if user and not user.is_admin and getattr(user, 'faculty_id', None):
                        query = query.filter_by(faculty_id=user.faculty_id)
            except Exception:
                # Silently continue if JWT check fails
                pass

        courses = query.all()

        # Serialize courses using the model's to_dict method
        serialized_courses = []
        for course in courses:
            try:
                course_dict = course.to_dict(include_faculty=True)
                serialized_courses.append(course_dict)
            except Exception as e:
                # Include minimal course info if serialization fails
                serialized_courses.append({
                    'id': getattr(course, 'id', 0),
                    'course_id': getattr(course, 'course_id', f'ERROR-{getattr(course, "id", "X")}'),
                    'name': getattr(course, 'name', 'Unknown Course'),
                    'credits': getattr(course, 'credits', 3),
                    'total_fee': float(getattr(course, 'total_fee', 0.0)),
                    'error': f'Failed to serialize course: {str(e)}'
                })

        return jsonify({
            "success": True,
            "total_courses": len(serialized_courses),
            "courses": serialized_courses
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Failed to retrieve courses",
            "details": str(e)
        }), 500


# ============================================================================
# ENDPOINT: GET /api/courses/<course_id>
# Description: Get details of a specific course
# ============================================================================
@courses_bp.route("/<int:course_id>", methods=["GET"])
def get_course(course_id):
    """
    Get details of a specific course.

    Returns:
    {
        "id": 1,
        "course_id": "CS101",
        "name": "Computer Science",
        "credits": 3,
        "total_fee": 5000.0,
        "description": "Introduction to Computer Science",
        "created_at": "2025-12-05T10:00:00"
    }
    """
    try:
        course = Course.query.get(course_id)
        if not course:
            return jsonify({"error": "Course not found"}), 404

        return jsonify({
            "id": course.id,
            "course_id": course.course_id,
            "name": course.name,
            "credits": course.credits,
            "total_fee": course.total_fee,
            "description": course.description,
            "created_at": course.created_at.isoformat()
        }), 200

    except Exception as e:
        return jsonify({"error": f"Failed to retrieve course: {str(e)}"}), 500


# ============================================================================
# ENDPOINT: POST /api/courses
# Description: Create a new course (Admin only)
# ============================================================================
@courses_bp.route("", methods=["POST"])
@jwt_required()
@require_admin
def create_course(current_user=None):
    """
    Create a new course. Admin only.

    Request Body:
    {
        "course_id": "CS101",
        "name": "Computer Science",
        "credits": 3,
        "total_fee": 5000.0,
        "description": "Introduction to Computer Science"
    }

    Returns:
    {
        "msg": "Course created successfully",
        "course_id": 1,
        "name": "Computer Science"
    }
    """
    data = request.get_json()

    # Validate required fields
    required_fields = ["course_id", "name", "credits", "total_fee"]
    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    course_id = data.get("course_id").strip()

    # Check if course_id already exists
    if Course.query.filter_by(course_id=course_id).first():
        return jsonify({"error": "Course ID already exists"}), 409

    try:
        course = Course(
            course_id=course_id,
            name=data.get("name"),
            credits=int(data.get("credits")),
            total_fee=float(data.get("total_fee")),
            description=data.get("description", "")
        )

        db.session.add(course)
        db.session.commit()

        return jsonify({
            "msg": "Course created successfully",
            "course_id": course.id,
            "name": course.name
        }), 201

    except ValueError as e:
        return jsonify({"error": f"Invalid input: {str(e)}"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to create course: {str(e)}"}), 500


# ============================================================================
# ENDPOINT: PUT /api/courses/<course_id>
# Description: Update course details (Admin only)
# ============================================================================
@courses_bp.route("/<int:course_id>", methods=["PUT"])
@jwt_required()
@require_admin
def update_course(course_id, current_user=None):
    """
    Update course details. Admin only.

    Request Body:
    {
        "name": "Advanced Computer Science",
        "credits": 4,
        "total_fee": 6000.0,
        "description": "Advanced topics in CS"
    }

    Returns:
    {
        "msg": "Course updated successfully",
        "course_id": 1,
        "name": "Advanced Computer Science"
    }
    """
    try:
        course = Course.query.get(course_id)
        if not course:
            return jsonify({"error": "Course not found"}), 404

        data = request.get_json()

        # Update fields if provided
        if data.get("name"):
            course.name = data.get("name")
        if data.get("credits"):
            course.credits = int(data.get("credits"))
        if data.get("total_fee"):
            course.total_fee = float(data.get("total_fee"))
        if "description" in data:
            course.description = data.get("description", "")

        db.session.commit()

        return jsonify({
            "msg": "Course updated successfully",
            "course_id": course.id,
            "name": course.name
        }), 200

    except ValueError as e:
        return jsonify({"error": f"Invalid input: {str(e)}"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to update course: {str(e)}"}), 500


# ============================================================================
# ENDPOINT: DELETE /api/courses/<course_id>
# Description: Delete a course (Admin only)
# ============================================================================
@courses_bp.route("/<int:course_id>", methods=["DELETE"])
@jwt_required()
@require_admin
def delete_course(course_id, current_user=None):
    """
    Delete a course. Admin only.

    Returns:
    {
        "msg": "Course deleted successfully",
        "course_id": 1
    }
    """
    try:
        course = Course.query.get_or_404(course_id)

        # Delete the course
        db.session.delete(course)
        db.session.commit()

        return jsonify({
            "msg": "Course deleted successfully",
            "course_id": course_id
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to delete course: {str(e)}"}), 500
