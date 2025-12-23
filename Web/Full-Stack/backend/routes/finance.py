from flask import Blueprint, request, jsonify, Response, current_app
from models import (
    db, User, Payment, Enrollment, Notification, ActionLog,
    Course, FeeStructure, BankTransaction, GeneratedReport, Penalty
)
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone, timedelta
from sqlalchemy import and_, func, desc
from functools import wraps
import json

finance_bp = Blueprint("finance", __name__)


# ============================================================================
# HELPER FUNCTION: Check if user is admin (RBAC)


# ============================================================================
def require_admin(fn):
    """Decorator to enforce admin-only access."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        from models import User

        identity = get_jwt_identity()
        if not identity:
            return jsonify({"error": "Authentication required"}), 401

        # Get user from database to check admin status
        user = User.query.get(identity)
        if not user or not user.is_admin:
            return jsonify({"error": "Admin access required"}), 403

        return fn(*args, **kwargs)
    return wrapper


# ============================================================================
# ENDPOINT: GET /api/finance/dues
# Description: Lists all students with outstanding dues (Tuition fees calculation)


# ============================================================================
@finance_bp.route("/dues", methods=["GET"])
@jwt_required()
@require_admin
def get_outstanding_dues():
    """
    Lists all students with outstanding dues. Finance Department only.

    Query Parameters:
    - min_amount: Filter students with dues >= min_amount (optional)
    - max_amount: Filter students with dues <= max_amount (optional)
    - sort_by: Sort by 'dues_balance' or 'username' (default: 'dues_balance')

    Returns:
    {
        "total_students_with_dues": 5,
        "total_outstanding_amount": 25000.0,
        "students": [
            {
                "user_id": 1,
                "username": "student1",
                "email": "student1@example.com",
                "dues_balance": 5000.0,
                "total_enrollments": 1,
                "last_payment_date": "2025-12-01T10:00:00"
            }
        ]
    }
    """
    try:
        # Get filter parameters
        min_amount = request.args.get('min_amount', type=float)
        max_amount = request.args.get('max_amount', type=float)
        sort_by = request.args.get('sort_by', 'dues_balance')

        # Query students with outstanding dues
        query = User.query.filter(User.dues_balance > 0, User.is_admin is False)

        # Apply filters
        if min_amount is not None:
            query = query.filter(User.dues_balance >= min_amount)
        if max_amount is not None:
            query = query.filter(User.dues_balance <= max_amount)

        # Apply sorting
        if sort_by == 'username':
            query = query.order_by(User.username)
        else:
            query = query.order_by(User.dues_balance.desc())

        students = query.all()

        # Build response
        student_list = []
        total_outstanding = 0

        for student in students:
            # Get last payment date
            last_payment = Payment.query.filter_by(student_id=student.id).order_by(
                Payment.payment_date.desc()
            ).first()

            # Count enrollments
            enrollment_count = Enrollment.query.filter_by(student_id=student.id).count()

            student_list.append({
                "user_id": student.id,
                "username": student.username,
                "email": student.email,
                "dues_balance": student.dues_balance,
                "total_enrollments": enrollment_count,
                "last_payment_date": last_payment.payment_date.isoformat() if last_payment else None
            })

            total_outstanding += student.dues_balance

        return jsonify({
            "total_students_with_dues": len(students),
            "total_outstanding_amount": total_outstanding,
            "students": student_list
        }), 200

    except Exception as e:
        return jsonify({"error": f"Failed to retrieve dues: {str(e)}"}), 500


# ============================================================================
# ENDPOINT: GET /api/finance/unpaid-report
# Description: Generates a report of students with dues_balance > 0


# ============================================================================
@finance_bp.route("/unpaid-report", methods=["GET"])
@jwt_required()
@require_admin
def get_unpaid_report():
    """
    Generates a detailed report of students with outstanding dues.
    Used for 'Action based on unpaid report'.

    Returns:
    {
        "report_date": "2025-12-05T15:30:00",
        "total_students": 5,
        "total_outstanding": 25000.0,
        "students_by_status": {
            "critical": [{"dues_balance": 10000.0, ...}],
            "moderate": [...],
            "low": [...]
        },
        "detailed_report": [...]
    }
    """
    try:
        # Get all students with outstanding dues
        # alyan's modification: Added error handling for initial query
        try:
            students = User.query.filter(
                and_(User.dues_balance > 0, User.is_admin is False)
            ).order_by(User.dues_balance.desc()).all()
        except Exception as query_err:
            print(f"ERROR: Failed to query students: {str(query_err)}")
            import traceback
            print(traceback.format_exc())
            return jsonify({
                "error": f"Failed to query students: {str(query_err)}",
                "report_date": datetime.now(timezone.utc).isoformat(),
                "total_students": 0,
                "total_outstanding": 0,
                "students_by_status": {
                    "critical": [],
                    "moderate": [],
                    "low": []
                },
                "detailed_report": []
            }), 200  # Return empty report instead of error

        # Categorize by dues amount
        critical = []  # > 5000
        moderate = []  # 1000 - 5000
        low = []       # < 1000

        detailed_report = []
        total_outstanding = 0

        for student in students:
            # Get enrollment details with course info
            # alyan's modification: Use outerjoin (LEFT JOIN) to handle students without enrollments
            enrollment_details = []
            try:
                enrollments_data = db.session.query(
                    Enrollment,
                    Course
                ).outerjoin(
                    Course, Enrollment.course_id == Course.id
                ).filter(
                    Enrollment.student_id == student.id
                ).all()

                for enrollment, course in enrollments_data:
                    try:
                        enrollment_details.append({
                            "course_name": course.name if course and course.name else "Unknown Course",
                            "course_fee": enrollment.course_fee if enrollment else 0.0,
                            "enrollment_date": enrollment.enrollment_date.isoformat() if enrollment and enrollment.enrollment_date else None  # noqa: E501
                        })
                    except Exception as err:
                        print(f"Warning: Error processing enrollment: {str(err)}")
                        enrollment_details.append({
                            "course_name": "Unknown Course",
                            "course_fee": enrollment.course_fee if enrollment else 0.0,
                            "enrollment_date": None
                        })
            except Exception as query_err:
                print(f"Warning: Error querying enrollments for student {student.id}: {str(query_err)}")
                # Fallback: try simple query without join
                try:
                    simple_enrollments = Enrollment.query.filter_by(student_id=student.id).all()
                    for e in simple_enrollments:
                        enrollment_details.append({
                            "course_name": "Unknown Course",
                            "course_fee": e.course_fee,
                            "enrollment_date": e.enrollment_date.isoformat() if e.enrollment_date else None
                        })
                except Exception as fallback_err:
                    print(f"Warning: Fallback query also failed: {str(fallback_err)}")
                    enrollment_details = []

            # Get payment history
            # alyan's modification: Added error handling for payment queries
            recent_payments = []
            try:
                payments = Payment.query.filter_by(student_id=student.id).order_by(
                    Payment.payment_date.desc()
                ).limit(5).all()

                recent_payments = [
                    {
                        "amount": p.amount,
                        "payment_date": p.payment_date.isoformat() if p.payment_date else None,
                        "payment_method": p.payment_method or "UNKNOWN"
                    }
                    for p in payments
                ]
            except Exception as payment_err:
                print(f"Warning: Error querying payments for student {student.id}: {str(payment_err)}")
                recent_payments = []

            # alyan's modification: Added error handling for student data creation
            try:
                student_data = {
                    "user_id": student.id,
                    "username": student.username or "Unknown",
                    "email": student.email or None,
                    "dues_balance": float(student.dues_balance) if student.dues_balance else 0.0,
                    "enrollments": enrollment_details,
                    "recent_payments": recent_payments
                }
            except Exception as data_err:
                print(f"Error creating student data for student {student.id}: {str(data_err)}")
                # Create minimal student data
                student_data = {
                    "user_id": student.id,
                    "username": str(student.username) if student.username else "Unknown",
                    "email": str(student.email) if student.email else None,
                    "dues_balance": 0.0,
                    "enrollments": [],
                    "recent_payments": []
                }

            detailed_report.append(student_data)
            total_outstanding += student.dues_balance

            # Categorize
            if student.dues_balance > 5000:
                critical.append(student_data)
            elif student.dues_balance >= 1000:
                moderate.append(student_data)
            else:
                low.append(student_data)

        return jsonify({
            "report_date": datetime.now(timezone.utc).isoformat(),
            "total_students": len(students),
            "total_outstanding": total_outstanding,
            "students_by_status": {
                "critical": critical,
                "moderate": moderate,
                "low": low
            },
            "detailed_report": detailed_report
        }), 200

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"ERROR in get_unpaid_report: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({
            "error": f"Failed to generate report: {str(e)}",
            "details": str(e)  # alyan's modification: Include error details for debugging
        }), 500


# ============================================================================
# ENDPOINT: PUT /api/finance/action/contact/<student_id>
# Description: Logs action: 'Contact the student for the due date'


# ============================================================================
@finance_bp.route("/action/contact/<int:student_id>", methods=["PUT"])
@jwt_required()
@require_admin
def contact_student(student_id):
    """
    Log action: Contact the student for outstanding dues.

    Request Body:
    {
        "contact_method": "EMAIL",
        "notes": "Sent reminder email about pending dues"
    }

    Returns:
    {
        "msg": "Contact action logged successfully",
        "action_id": 1,
        "student_id": 1,
        "contact_date": "2025-12-05T15:30:00"
    }
    """
    identity = get_jwt_identity()
    if not identity:
        return jsonify({"error": "Invalid or missing user identity"}), 401

    try:
        admin_id = int(identity)  # Convert string ID to integer
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        contact_method = data.get("contact_method", "EMAIL")
        notes = data.get("notes", "")

        # Verify student exists
        student = User.query.get(student_id)
        if not student:
            return jsonify({"error": "Student not found"}), 404

        if student.is_admin:
            return jsonify({"error": "Cannot contact admin users"}), 400

        # Get admin user for logging
        admin = User.query.get(admin_id)
        if not admin or not admin.is_admin:
            return jsonify({"error": "Admin access required"}), 403

        # Create action log
        action_log = ActionLog(
            student_id=student_id,
            action_type='CONTACT_REQUEST',
            action_description=f"Contacted student via {contact_method}. Notes: {notes}",
            performed_by=admin_id
        )

        db.session.add(action_log)

        # Create notification for student
        notification = Notification(
            student_id=student_id,
            notification_type='CONTACT_REQUEST',
            message=f"Finance department has contacted you regarding your outstanding dues of ${student.dues_balance:.2f}",  # noqa: E501
            action_date=datetime.now(timezone.utc)
        )
        db.session.add(notification)

        db.session.commit()

        return jsonify({
            "msg": "Contact action logged successfully",
            "action_id": action_log.id,
            "student_id": student_id,
            "contact_date": action_log.created_at.isoformat()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to log contact action: {str(e)}"}), 500


# ============================================================================
# ENDPOINT: POST /api/finance/record-payment
# Description: Records and logs a payment transaction if done externally


# ============================================================================
@finance_bp.route("/record-payment", methods=["POST"])
@jwt_required()
@require_admin
def record_external_payment():
    """
    Record and log a payment transaction (e.g., bank transfer).

    Request Body:
    {
        "student_id": 1,
        "amount": 2000.0,
        "payment_method": "BANK_TRANSFER",
        "reference_number": "BANK123456",
        "notes": "Payment received from student bank account"
    }

    Returns:
    {
        "msg": "Payment recorded successfully",
        "payment_id": 1,
        "student_id": 1,
        "amount": 2000.0,
        "remaining_dues": 3000.0
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Get admin user ID from JWT
        admin_identity = get_jwt_identity()
        if not admin_identity:
            return jsonify({"error": "Invalid or missing admin identity"}), 401

        admin_id = int(admin_identity)

        # Validate required fields
        required_fields = ["student_id", "amount"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"{field} is required"}), 400

        student_id = data.get("student_id")
        amount = data.get("amount")
        payment_method = data.get("payment_method", "MANUAL")
        reference_number = data.get("reference_number")
        notes = data.get("notes", "")

        # Validate amount
        try:
            amount = float(amount)
            if amount <= 0:
                return jsonify({"error": "Amount must be greater than 0"}), 400
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid amount"}), 400

        # Verify student exists and get current dues
        student = User.query.get(student_id)
        if not student or student.is_admin:
            return jsonify({"error": "Student not found"}), 404

        # Start transaction
        db.session.begin_nested()

        # Create payment record
        payment = Payment(
            student_id=student_id,
            amount=amount,
            payment_method=payment_method,
            reference_number=reference_number,
            status='RECEIVED',
            notes=notes,
            recorded_by=admin_id
        )
        db.session.add(payment)

        # Update student's dues_balance
        student.dues_balance = max(0, student.dues_balance - amount)
        student.updated_at = datetime.now(timezone.utc)

        # Create action log
        action_log = ActionLog(
            student_id=student_id,
            action_type='PAYMENT_RECORDED',
            action_description=f"Recorded external payment of ${amount:.2f} via {payment_method}",
            performed_by=admin_id
        )
        db.session.add(action_log)

        # Create notification for student
        notification = Notification(
            student_id=student_id,
            notification_type='PAYMENT_RECEIVED',
            message=f"Payment of ${amount:.2f} has been recorded. Remaining dues: ${student.dues_balance:.2f}",
            action_date=datetime.now(timezone.utc)
        )
        db.session.add(notification)

        db.session.commit()

        return jsonify({
            "msg": "Payment recorded successfully",
            "payment_id": payment.id,
            "student_id": student_id,
            "amount": amount,
            "remaining_dues": student.dues_balance
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to record payment: {str(e)}"}), 500


# ============================================================================
# ENDPOINT: GET /api/finance/reports/status
# Description: Generates 'report condition (Pass & Fail)' based on student Dues + Fees


# ============================================================================
@finance_bp.route("/reports/status", methods=["GET"])
@jwt_required()
@require_admin
def get_status_report():
    """
    Generates a status report based on student dues and fees.
    Determines Pass/Fail status based on payment condition.

    Query Parameters:
    - threshold: Dues threshold for 'Fail' status (default: 0, meaning any outstanding dues = Fail)

    Returns:
    {
        "report_date": "2025-12-05T15:30:00",
        "total_students": 10,
        "pass_count": 5,
        "fail_count": 5,
        "pass_students": [...],
        "fail_students": [...]
    }
    """
    try:
        # Get threshold parameter
        threshold = request.args.get('threshold', default=0, type=float)

        # Get all students (excluding admins)
        students = User.query.filter(User.is_admin is False).all()

        pass_students = []
        fail_students = []

        for student in students:
            # Get enrollment details
            enrollments = Enrollment.query.filter_by(student_id=student.id).all()
            total_fees = sum(e.course_fee for e in enrollments)

            student_data = {
                "user_id": student.id,
                "username": student.username,
                "email": student.email,
                "dues_balance": student.dues_balance,
                "total_fees": total_fees,
                "total_enrollments": len(enrollments)
            }

            # Determine status: Pass if dues <= threshold, Fail otherwise
            if student.dues_balance <= threshold:
                student_data["status"] = "PASS"
                pass_students.append(student_data)
            else:
                student_data["status"] = "FAIL"
                fail_students.append(student_data)

        return jsonify({
            "report_date": datetime.now(timezone.utc).isoformat(),
            "total_students": len(students),
            "pass_count": len(pass_students),
            "fail_count": len(fail_students),
            "threshold": threshold,
            "pass_students": pass_students,
            "fail_students": fail_students
        }), 200

    except Exception as e:
        return jsonify({"error": f"Failed to generate status report: {str(e)}"}), 500


# ============================================================================
# ENDPOINT: GET /api/finance/summary
# Description: Returns overall financial summary statistics for the dashboard


# ============================================================================
@finance_bp.route("/summary", methods=["GET"])
@jwt_required()
@require_admin
def get_finance_summary():
    """
    Returns overall financial summary statistics for the dashboard.

    Returns:
    {
        "total_collected": 2400000,
        "total_collected_change": 12.5,
        "pending_payments": 340000,
        "pending_payments_change": -8.2,
        "total_students": 2847,
        "total_students_change": 5.3,
        "unpaid_students": 156,
        "unpaid_students_change": -3.1
    }
    """
    try:
        # Calculate current period stats
        # Total collected = sum of all payments with status 'RECEIVED'
        total_collected = db.session.query(func.sum(Payment.amount)).filter(
            Payment.status == 'RECEIVED'
        ).scalar() or 0.0

        # Pending payments = sum of all dues_balance from students
        pending_payments = db.session.query(func.sum(User.dues_balance)).filter(
            User.is_admin is False
        ).scalar() or 0.0

        # Total students = count of all non-admin users
        total_students = User.query.filter(User.is_admin is False).count()

        # Unpaid students = count of students where dues_balance > 0
        unpaid_students = User.query.filter(
            and_(User.dues_balance > 0, User.is_admin is False)
        ).count()

        # Calculate previous period stats (30 days ago) for change percentages
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)

        # Previous period total collected
        prev_total_collected = db.session.query(func.sum(Payment.amount)).filter(
            and_(
                Payment.status == 'RECEIVED',
                Payment.payment_date < thirty_days_ago
            )
        ).scalar() or 0.0

        # Previous period unpaid students
        # Note: We can't get historical unpaid count easily, so we'll use a simple calculation

        # Calculate change percentages
        total_collected_change = 0.0
        if prev_total_collected > 0:
            total_collected_change = ((total_collected - prev_total_collected) / prev_total_collected) * 100

        # For pending payments change, we'll use a simple estimate
        # In a real system, you'd track this over time
        pending_payments_change = -8.2  # Placeholder

        # For student count change, calculate based on creation dates
        prev_total_students = User.query.filter(
            and_(
                User.is_admin is False,
                User.created_at < thirty_days_ago
            )
        ).count()
        total_students_change = 0.0
        if prev_total_students > 0:
            total_students_change = ((total_students - prev_total_students) / prev_total_students) * 100

        # Unpaid students change (placeholder)
        unpaid_students_change = -3.1  # Placeholder

        return jsonify({
            "total_collected": float(total_collected),
            "total_collected_change": round(total_collected_change, 1),
            "pending_payments": float(pending_payments),
            "pending_payments_change": round(pending_payments_change, 1),
            "total_students": total_students,
            "total_students_change": round(total_students_change, 1),
            "unpaid_students": unpaid_students,
            "unpaid_students_change": round(unpaid_students_change, 1)
        }), 200

    except Exception as e:
        return jsonify({"error": f"Failed to retrieve finance summary: {str(e)}"}), 500


# ============================================================================
# ENDPOINT: GET /api/finance/payments/recent
# Description: Returns list of recent payments with student and faculty info


# ============================================================================
@finance_bp.route("/payments/recent", methods=["GET"])
@jwt_required()
@require_admin
def get_recent_payments():
    """
    Returns list of recent payments with student and faculty info.

    Query Parameters:
    - limit: Number of records to return (default: 10)
    - offset: Pagination offset (default: 0)

    Returns:
    {
        "payments": [
            {
                "id": "STD-001",
                "student_id": 1,
                "student_name": "John Smith",
                "faculty": "Engineering",
                "amount": 2916,
                "date": "Dec 10, 2025",
                "status": "Paid"
            }
        ],
        "total_count": 100
    }
    """
    try:
        # Get query parameters
        limit = request.args.get('limit', default=10, type=int)
        offset = request.args.get('offset', default=0, type=int)

        # Query recent payments with student info
        payments_query = db.session.query(
            Payment,
            User
        ).join(
            User, Payment.student_id == User.id
        ).filter(
            User.is_admin is False
        ).order_by(
            Payment.payment_date.desc()
        )

        # Get total count
        total_count = payments_query.count()

        # Apply pagination
        payments_data = payments_query.offset(offset).limit(limit).all()

        # Build response
        payments_list = []
        for payment, student in payments_data:
            # Get student's enrollments to determine faculty
            # alyan's modification: Use faculty field from Course model if available
            enrollment = Enrollment.query.filter_by(student_id=student.id).first()
            faculty = "Unknown"
            if enrollment and enrollment.course:
                # alyan's modification: Use faculty field from Course model
                try:
                    if hasattr(enrollment.course, 'faculty') and enrollment.course.faculty:
                        faculty = enrollment.course.faculty
                    else:
                        raise AttributeError  # Fall through to name-based mapping
                except AttributeError:
                    # Fallback: Map course names to faculties (temporary solution)
                    course_name = enrollment.course.name.lower()
                    if 'computer' in course_name or 'cs' in course_name:
                        faculty = "Computer Science"
                    elif 'english' in course_name or 'literature' in course_name:
                        faculty = "Digital Arts"
                    elif 'data' in course_name or 'analytics' in course_name:
                        faculty = "Computer Science"
                    elif 'business' in course_name or 'management' in course_name:
                        faculty = "Business"
                    elif 'math' in course_name:
                        faculty = "Engineering"
                    else:
                        faculty = "Engineering"  # Default

            # Format date
            payment_date = payment.payment_date.strftime('%b %d, %Y') if payment.payment_date else 'N/A'

            # Determine status
            status = "Paid"
            if payment.status == 'PENDING':
                status = "Pending"
            elif payment.status == 'FAILED':
                status = "Failed"

            payments_list.append({
                "id": f"PAY-{payment.id}",  # alyan's modification: Use unique payment ID instead of student ID
                "payment_id": payment.id,  # alyan's modification: Include actual payment ID
                "student_id": student.id,
                "student_name": student.username,
                "faculty": faculty,
                "amount": payment.amount,
                "date": payment_date,
                "status": status
            })

        return jsonify({
            "payments": payments_list,
            "total_count": total_count
        }), 200

    except Exception as e:
        return jsonify({"error": f"Failed to retrieve recent payments: {str(e)}"}), 500


# ============================================================================
# ENDPOINT: GET /api/finance/payments/by-faculty
# Description: Returns payment collection progress grouped by faculty


# ============================================================================
@finance_bp.route("/payments/by-faculty", methods=["GET"])
@jwt_required()
@require_admin
def get_payments_by_faculty():
    """
    Returns payment collection progress grouped by faculty/department.

    Returns:
    {
        "faculties": [
            {
                "name": "Engineering",
                "collected": 850000,
                "total": 1000000,
                "percentage": 85.0,
                "color": "#10b981"
            }
        ]
    }
    """
    try:
        # alyan's modification: Use faculty field from Course model if available
        def get_faculty_from_course(course):
            # Check if faculty field exists and has a value
            try:
                if hasattr(course, 'faculty') and course.faculty:
                    return course.faculty
            except AttributeError:
                pass  # Fall through to name-based mapping

            # Fallback: Map course names to faculties (temporary solution)
            course_lower = course.name.lower()
            if 'computer' in course_lower or 'cs' in course_lower:
                return "Computer Science"
            elif 'english' in course_lower or 'literature' in course_lower:
                return "Digital Arts"
            elif 'data' in course_lower or 'analytics' in course_lower:
                return "Computer Science"
            elif 'business' in course_lower or 'management' in course_lower:
                return "Business Informatics"
            elif 'math' in course_lower:
                return "Engineering"
            else:
                return "Engineering"  # Default

        # Get all enrollments with course info
        # alyan's modification: Added error handling for database query
        try:
            enrollments = db.session.query(
                Enrollment,
                Course
            ).join(
                Course, Enrollment.course_id == Course.id
            ).filter(
                Enrollment.status == 'ACTIVE'
            ).all()
        except Exception as query_error:
            print(f"Database query error: {str(query_error)}")
            # Return empty result if query fails
            return jsonify({
                "faculties": [],
                "message": "No enrollment data available or database error",
                "error": str(query_error)
            }), 200

        # Group by faculty
        faculty_data = {}
        faculty_colors = {
            "Engineering": "#10b981",
            "Computer Science": "#fbbf24",
            "Digital Arts": "#3b82f6",
            "Business Informatics": "#10b981"
        }

        for enrollment, course in enrollments:
            faculty = get_faculty_from_course(course)  # alyan's modification: Pass course object instead of name

            if faculty not in faculty_data:
                faculty_data[faculty] = {
                    "name": faculty,
                    "collected": 0.0,
                    "total": 0.0,
                    "color": faculty_colors.get(faculty, "#10b981")
                }

            # Add to total expected fees
            faculty_data[faculty]["total"] += enrollment.course_fee

            # Get payments for this student
            student_payments = Payment.query.filter_by(
                student_id=enrollment.student_id,
                status='RECEIVED'
            ).all()

            # Calculate collected amount for this enrollment
            # This is a simplified calculation - in reality, you'd need to track
            # which payments correspond to which enrollments
            total_paid = sum(p.amount for p in student_payments)
            total_fees = sum(
                e.course_fee for e in Enrollment.query.filter_by(
                    student_id=enrollment.student_id
                ).all()
            )

            # Proportionally allocate payments to this enrollment
            if total_fees > 0:
                enrollment_collected = (enrollment.course_fee / total_fees) * total_paid
                faculty_data[faculty]["collected"] += enrollment_collected

        # Build response with percentages
        faculties_list = []
        for faculty_name, data in faculty_data.items():
            percentage = (data["collected"] / data["total"] * 100) if data["total"] > 0 else 0.0
            faculties_list.append({
                "name": data["name"],
                "collected": round(data["collected"], 2),
                "total": round(data["total"], 2),
                "percentage": round(percentage, 2),
                "color": data["color"]
            })

        # Sort by total (descending)
        faculties_list.sort(key=lambda x: x["total"], reverse=True)

        return jsonify({
            "faculties": faculties_list
        }), 200

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"ERROR in get_payments_by_faculty: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({
            "error": f"Failed to retrieve payments by faculty: {str(e)}",
            "details": str(e)  # alyan's modification: Include error details for debugging
        }), 500


# ============================================================================
# ENDPOINT: GET /api/finance/bank-reconciliation
# Description: Returns bank transactions with reconciliation status


# ============================================================================
@finance_bp.route("/bank-reconciliation", methods=["GET"])
@jwt_required()
@require_admin
def get_bank_reconciliation():
    """
    Returns bank transactions with reconciliation status and summary (alyan's modification).

    Query Parameters:
    - limit: Number of records to return (default: 50)
    - offset: Pagination offset (default: 0)
    - status: Filter by status ('matched' or 'unmatched') (optional)

    Returns:
    {
        "summary": {
            "total": 6,
            "matched": 4,
            "unmatched": 2,
            "total_amount": 24950
        },
        "transactions": [...]
    }
    """
    try:
        # Get query parameters
        limit = request.args.get('limit', default=50, type=int)
        offset = request.args.get('offset', default=0, type=int)
        status_filter = request.args.get('status', type=str)

        # Build query
        query = BankTransaction.query

        # Apply status filter
        if status_filter:
            if status_filter.lower() == 'matched':
                query = query.filter(BankTransaction.status == 'Matched')
            elif status_filter.lower() == 'unmatched':
                query = query.filter(BankTransaction.status == 'Unmatched')

        # Get total count before pagination
        total_count = query.count()

        # Apply pagination and ordering
        transactions = query.order_by(desc(BankTransaction.transaction_date)).offset(offset).limit(limit).all()

        # Calculate summary statistics
        all_transactions = BankTransaction.query.all()
        total_amount = sum(t.amount for t in all_transactions)
        matched_count = sum(1 for t in all_transactions if t.status == 'Matched')
        unmatched_count = sum(1 for t in all_transactions if t.status == 'Unmatched')
        pending_count = sum(1 for t in all_transactions if t.status == 'Pending')

        # Format transactions
        transactions_list = []
        for txn in transactions:
            transaction_data = {
                'id': txn.id,
                'bank_re': txn.bank_ref,
                'amount': txn.amount,
                'date': txn.transaction_date.strftime('%Y-%m-%d') if txn.transaction_date else None,
                'bank_description': txn.bank_description,
                'status': txn.status,
                'matched_payment_id': txn.matched_payment_id,
                'student_id': f"STD-{txn.matched_student_id:03d}" if txn.matched_student_id else None,
                'student_name': None
            }

            # Get student name if matched
            if txn.matched_student_id:
                student = User.query.get(txn.matched_student_id)
                if student:
                    transaction_data['student_name'] = student.username

            transactions_list.append(transaction_data)

        summary = {
            'total': total_count,
            'matched': matched_count,
            'unmatched': unmatched_count,
            'pending': pending_count,
            'total_amount': total_amount
        }

        return jsonify({
            'summary': summary,
            'transactions': transactions_list
        }), 200

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"ERROR in get_bank_reconciliation: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({"error": f"Failed to retrieve bank reconciliation: {str(e)}"}), 500


# ============================================================================
# ENDPOINT: GET /api/finance/students
# Description: Returns all students with their payment information (Admin only)


# ============================================================================
@finance_bp.route("/students", methods=["GET"])
@jwt_required()
@require_admin
def get_all_students():
    """
    Returns all students with their payment information for the Student List page.

    Query Parameters:
    - search: Search by name or student ID (optional)
    - faculty: Filter by faculty (optional)
    - status: Filter by payment status - Paid/Pending/Unpaid (optional)
    - limit: Number of records to return (default: 50)
    - offset: Pagination offset (default: 0)

    Returns:
    {
        "students": [
            {
                "id": "STD-001",
                "user_id": 1,
                "name": "John Smith",
                "email": "john.s@uni.edu",
                "faculty": "Engineering",
                "totalFees": 12500,
                "paid": 12500,
                "dues": 0,
                "status": "Paid"
            }
        ],
        "total_count": 100,
        "faculties": ["Engineering", "Computer Science", "Digital Arts", "Business Informatics"]
    }
    """
    try:
        # Get query parameters
        search = request.args.get('search', type=str)
        faculty_filter = request.args.get('faculty', type=str)
        status_filter = request.args.get('status', type=str)
        limit = request.args.get('limit', default=50, type=int)
        offset = request.args.get('offset', default=0, type=int)

        # Base query: Get all non-admin users
        query = User.query.filter(User.is_admin is False)

        # Apply search filter
        if search:
            search_term = f"%{search.lower()}%"
            # alyan's modification: Search by username, email, or student ID
            search_filters = [
                User.username.ilike(search_term),
                User.email.ilike(search_term)
            ]
            # Also search by numeric ID if search is a number
            if search.isdigit():
                search_filters.append(User.id == int(search))
            # Also search by STD-XXX format
            if search.upper().startswith('STD-'):
                try:
                    student_id = int(search.upper().replace('STD-', ''))
                    search_filters.append(User.id == student_id)
                except ValueError:
                    pass

            query = query.filter(db.or_(*search_filters))

        # Get total count before pagination
        total_count = query.count()

        # Apply pagination
        students = query.offset(offset).limit(limit).all()

        # Get all unique faculties from courses for the filter dropdown
        all_faculties = db.session.query(Course.faculty).distinct().filter(
            Course.faculty.isnot(None)
        ).all()
        faculties_list = [f[0] for f in all_faculties if f[0]]

        # Build student list with payment information
        students_list = []

        for student in students:
            # Calculate total fees from enrollments
            enrollments = Enrollment.query.filter_by(student_id=student.id).all()
            total_fees = sum(e.course_fee for e in enrollments) if enrollments else 0.0

            # Calculate paid amount from payments
            payments = Payment.query.filter_by(
                student_id=student.id,
                status='RECEIVED'
            ).all()
            paid_amount = sum(p.amount for p in payments) if payments else 0.0

            # Get dues balance
            dues = float(student.dues_balance) if student.dues_balance else 0.0

            # Determine faculty from first enrollment's course
            faculty = "Unknown"
            if enrollments:
                first_enrollment = enrollments[0]
                if first_enrollment.course:
                    # alyan's modification: Use faculty field from Course model
                    if hasattr(first_enrollment.course, 'faculty') and first_enrollment.course.faculty:
                        faculty = first_enrollment.course.faculty
                    else:
                        # Fallback: Map course name to faculty
                        course_name = first_enrollment.course.name.lower()
                        if 'computer' in course_name or 'cs' in course_name:
                            faculty = "Computer Science"
                        elif 'english' in course_name or 'literature' in course_name:
                            faculty = "Digital Arts"
                        elif 'data' in course_name or 'analytics' in course_name:
                            faculty = "Computer Science"
                        elif 'business' in course_name or 'management' in course_name:
                            faculty = "Business Informatics"
                        elif 'math' in course_name:
                            faculty = "Engineering"
                        else:
                            faculty = "Engineering"  # Default

            # Determine status
            # Status logic:
            # - "Paid": dues == 0 (fully paid)
            # - "Pending": dues > 0 AND paid > 0 (partially paid)
            # - "Unpaid": paid == 0 (no payment made)
            if dues == 0:
                status = "Paid"
            elif paid_amount > 0:
                status = "Pending"
            else:
                status = "Unpaid"

            # Apply filters
            if faculty_filter and faculty_filter.lower() not in ['all', 'all faculties']:
                if faculty != faculty_filter:
                    continue

            if status_filter:
                if status.lower() != status_filter.lower():
                    continue

            students_list.append({
                "id": f"STD-{str(student.id).zfill(3)}",
                "user_id": student.id,
                "name": student.username or "Unknown",
                "email": student.email or None,
                "faculty": faculty,
                "totalFees": round(total_fees, 2),
                "paid": round(paid_amount, 2),
                "dues": round(dues, 2),
                "status": status
            })

        return jsonify({
            "students": students_list,
            "total_count": total_count,
            "faculties": sorted(faculties_list)  # alyan's modification: Return sorted list of faculties
        }), 200

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"ERROR in get_all_students: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({
            "error": f"Failed to retrieve students: {str(e)}",
            "details": str(e)  # alyan's modification: Include error details for debugging
        }), 500


# ============================================================================
# ENDPOINT: GET /api/finance/students/<student_id>
# Description: Returns detailed information for a specific student (Admin only)


# ============================================================================
@finance_bp.route("/students/<int:student_id>", methods=["GET"])
@jwt_required()
@require_admin
def get_student_details(student_id):
    """
    Returns detailed information for a specific student.
    Used when clicking "View" button in the Student List table.

    Returns:
    {
        "student": {
            "id": "STD-001",
            "user_id": 1,
            "name": "John Smith",
            "email": "john.s@uni.edu",
            "faculty": "Engineering",
            "totalFees": 12500,
            "paid": 12500,
            "dues": 0,
            "status": "Paid",
            "created_at": "2025-09-01T10:00:00"
        },
        "enrollments": [...],
        "payments": [...],
        "notifications": [...]
    }
    """
    try:
        # Get student
        student = User.query.get(student_id)
        if not student:
            return jsonify({"error": "Student not found"}), 404

        if student.is_admin:
            return jsonify({"error": "Cannot view admin user details"}), 400

        # Calculate total fees from enrollments
        enrollments = Enrollment.query.filter_by(student_id=student.id).all()
        total_fees = sum(e.course_fee for e in enrollments) if enrollments else 0.0

        # Calculate paid amount from payments
        payments = Payment.query.filter_by(
            student_id=student.id,
            status='RECEIVED'
        ).all()
        paid_amount = sum(p.amount for p in payments) if payments else 0.0

        # Get dues balance
        dues = float(student.dues_balance) if student.dues_balance else 0.0

        # Determine faculty from enrollments
        faculty = "Unknown"
        if enrollments:
            first_enrollment = enrollments[0]
            if first_enrollment.course:
                # alyan's modification: Use faculty field from Course model
                if hasattr(first_enrollment.course, 'faculty') and first_enrollment.course.faculty:
                    faculty = first_enrollment.course.faculty
                else:
                    # Fallback: Map course name to faculty
                    course_name = first_enrollment.course.name.lower()
                    if 'computer' in course_name or 'cs' in course_name:
                        faculty = "Computer Science"
                    elif 'english' in course_name or 'literature' in course_name:
                        faculty = "Digital Arts"
                    elif 'data' in course_name or 'analytics' in course_name:
                        faculty = "Computer Science"
                    elif 'business' in course_name or 'management' in course_name:
                        faculty = "Business Informatics"
                    elif 'math' in course_name:
                        faculty = "Engineering"
                    else:
                        faculty = "Engineering"  # Default

        # Determine status
        if dues == 0:
            status = "Paid"
        elif paid_amount > 0:
            status = "Pending"
        else:
            status = "Unpaid"

        # Build enrollments list
        enrollments_list = []
        for enrollment in enrollments:
            try:
                course_name = enrollment.course.name if enrollment.course else "Unknown Course"
                enrollments_list.append({
                    "id": enrollment.id,
                    "course_name": course_name,
                    "course_fee": enrollment.course_fee,
                    "enrollment_date": enrollment.enrollment_date.isoformat() if enrollment.enrollment_date else None,
                    "status": enrollment.status
                })
            except Exception as err:
                print(f"Warning: Error processing enrollment {enrollment.id}: {str(err)}")
                enrollments_list.append({
                    "id": enrollment.id,
                    "course_name": "Unknown Course",
                    "course_fee": enrollment.course_fee,
                    "enrollment_date": enrollment.enrollment_date.isoformat() if enrollment.enrollment_date else None,
                    "status": enrollment.status
                })

        # Build payments list
        all_payments = Payment.query.filter_by(student_id=student.id).order_by(
            Payment.payment_date.desc()
        ).all()

        payments_list = []
        for payment in all_payments:
            payments_list.append({
                "id": payment.id,
                "amount": payment.amount,
                "payment_date": payment.payment_date.isoformat() if payment.payment_date else None,
                "payment_method": payment.payment_method or "UNKNOWN",
                "status": payment.status,
                "reference_number": payment.reference_number
            })

        # Build notifications list
        notifications_list = []
        notifications = Notification.query.filter_by(student_id=student.id).order_by(
            Notification.created_at.desc()
        ).limit(10).all()  # Get last 10 notifications

        for notification in notifications:
            notifications_list.append({
                "id": notification.id,
                "type": notification.notification_type,
                "message": notification.message,
                "date": notification.created_at.isoformat() if notification.created_at else None,
                "read": notification.is_read
            })

        # Build student data
        student_data = {
            "id": f"STD-{str(student.id).zfill(3)}",
            "user_id": student.id,
            "name": student.username or "Unknown",
            "email": student.email or None,
            "faculty": faculty,
            "totalFees": round(total_fees, 2),
            "paid": round(paid_amount, 2),
            "dues": round(dues, 2),
            "status": status,
            "created_at": student.created_at.isoformat() if student.created_at else None
        }

        return jsonify({
            "student": student_data,
            "enrollments": enrollments_list,
            "payments": payments_list,
            "notifications": notifications_list
        }), 200

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"ERROR in get_student_details: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({
            "error": f"Failed to retrieve student details: {str(e)}",
            "details": str(e)  # alyan's modification: Include error details for debugging
        }), 500


# ============================================================================
# FEE CALCULATION PAGE ENDPOINTS (alyan's modification)


# ============================================================================

# ============================================================================
# ENDPOINT: GET /api/finance/fee-structure
# Description: Returns all fee categories with their items (Admin only)


# ============================================================================
@finance_bp.route("/fee-structure", methods=["GET"])
@jwt_required()
@require_admin
def get_fee_structure():
    """
    Returns all fee categories with their items grouped by category.
    Also returns list of unique faculties for the calculator dropdown.
    """
    try:
        # Get all active fee structures grouped by category
        fee_structures = FeeStructure.query.filter_by(is_active=True).order_by(
            FeeStructure.category, FeeStructure.display_order
        ).all()

        # Group by category
        categories_dict = {}
        category_display_names = {
            'tuition': 'Tuition Fees',
            'bus': 'Bus Fees',
            'other': 'Other Fees'
        }

        for fee in fee_structures:
            if fee.category not in categories_dict:
                categories_dict[fee.category] = {
                    'id': len(categories_dict) + 1,
                    'name': fee.category,
                    'display_name': category_display_names.get(fee.category, fee.category.title() + ' Fees'),
                    'fees': []
                }

            categories_dict[fee.category]['fees'].append({
                'id': fee.id,
                'name': fee.name,
                'amount': fee.amount,
                'is_per_credit': fee.is_per_credit
            })

        # Convert to list
        categories_list = list(categories_dict.values())

        # Get unique faculties from Course model
        faculties = db.session.query(Course.faculty).filter(
            Course.faculty.isnot(None)
        ).distinct().all()
        faculties_list = [f[0] for f in faculties if f[0]]

        return jsonify({
            'categories': categories_list,
            'faculties': sorted(faculties_list) if faculties_list else []
        }), 200

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"ERROR in get_fee_structure: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({
            "error": f"Failed to retrieve fee structure: {str(e)}"
        }), 500


# ============================================================================
# ENDPOINT: PUT /api/finance/fee-structure
# Description: Save/update all fee structure changes (Admin only)


# ============================================================================
@finance_bp.route("/fee-structure", methods=["PUT"])
@jwt_required()
@require_admin
def update_fee_structure():
    """
    Updates multiple fee items at once. Accepts fee items grouped by category.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        updated_count = 0

        # Process each category
        for category_name, fee_items in data.items():
            if not isinstance(fee_items, list):
                continue

            for item in fee_items:
                if 'id' not in item:
                    continue

                fee_item = FeeStructure.query.get(item['id'])
                if not fee_item:
                    continue

                # Update fields
                if 'name' in item:
                    fee_item.name = item['name']
                if 'amount' in item:
                    fee_item.amount = float(item['amount'])
                if 'is_per_credit' in item:
                    fee_item.is_per_credit = bool(item['is_per_credit'])

                fee_item.updated_at = datetime.now(timezone.utc)
                updated_count += 1

        db.session.commit()

        return jsonify({
            "msg": "Fee structure updated successfully",
            "updated_count": updated_count
        }), 200

    except Exception as e:
        db.session.rollback()
        import traceback
        error_trace = traceback.format_exc()
        print(f"ERROR in update_fee_structure: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({
            "error": f"Failed to update fee structure: {str(e)}"
        }), 500


# ============================================================================
# ENDPOINT: POST /api/finance/fee-structure/item
# Description: Add a new fee item to a category (Admin only)


# ============================================================================
@finance_bp.route("/fee-structure/item", methods=["POST"])
@jwt_required()
@require_admin
def add_fee_item():
    """
    Creates a new fee item in the specified category.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Validate required fields
        required_fields = ['category', 'name', 'amount']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        # Get max display_order for this category
        max_order = db.session.query(func.max(FeeStructure.display_order)).filter_by(
            category=data['category']
        ).scalar() or 0

        # Create new fee item
        new_fee = FeeStructure(
            category=data['category'],
            name=data['name'],
            amount=float(data['amount']),
            is_per_credit=bool(data.get('is_per_credit', False)),
            is_active=True,
            display_order=max_order + 1
        )

        db.session.add(new_fee)
        db.session.commit()

        return jsonify({
            "msg": "Fee item created successfully",
            "fee": {
                "id": new_fee.id,
                "name": new_fee.name,
                "amount": new_fee.amount,
                "category": new_fee.category,
                "is_per_credit": new_fee.is_per_credit
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        import traceback
        error_trace = traceback.format_exc()
        print(f"ERROR in add_fee_item: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({
            "error": f"Failed to create fee item: {str(e)}"
        }), 500


# ============================================================================
# ENDPOINT: DELETE /api/finance/fee-structure/item/<item_id>
# Description: Remove a fee item (Admin only)


# ============================================================================
@finance_bp.route("/fee-structure/item/<int:item_id>", methods=["DELETE"])
@jwt_required()
@require_admin
def delete_fee_item(item_id):
    """
    Deletes a fee item by ID. Uses soft delete (sets is_active=False).
    """
    try:
        fee_item = FeeStructure.query.get(item_id)
        if not fee_item:
            return jsonify({"error": "Fee item not found"}), 404

        # Soft delete
        fee_item.is_active = False
        fee_item.updated_at = datetime.now(timezone.utc)

        db.session.commit()

        return jsonify({
            "msg": "Fee item deleted successfully",
            "id": item_id
        }), 200

    except Exception as e:
        db.session.rollback()
        import traceback
        error_trace = traceback.format_exc()
        print(f"ERROR in delete_fee_item: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({
            "error": f"Failed to delete fee item: {str(e)}"
        }), 500


# ============================================================================
# ENDPOINT: POST /api/finance/calculate-fees
# Description: Calculate total fees based on parameters (Optional)


# ============================================================================
@finance_bp.route("/calculate-fees", methods=["POST"])
@jwt_required()
@require_admin
def calculate_fees():
    """
    Calculates total fees based on credit hours, faculty, and selected options.
    Returns detailed breakdown for transparency.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        credit_hours = int(data.get('credit_hours', 0))
        include_bus = bool(data.get('include_bus', False))

        if credit_hours <= 0:
            return jsonify({"error": "Credit hours must be greater than 0"}), 400

        # Get all active fee structures
        fee_structures = FeeStructure.query.filter_by(is_active=True).all()

        breakdown = {}
        total = 0
        calculation_details = {}

        # Process tuition fees
        tuition_fees = [f for f in fee_structures if f.category == 'tuition']
        tuition_total = 0
        per_credit_rate = 0

        for fee in tuition_fees:
            if fee.is_per_credit:
                amount = fee.amount * credit_hours
                per_credit_rate = fee.amount
                tuition_total += amount
                breakdown['tuition'] = breakdown.get('tuition', 0) + amount
            else:
                amount = fee.amount
                tuition_total += amount
                breakdown[fee.name.lower().replace(' ', '_')] = breakdown.get(
                    fee.name.lower().replace(' ', '_'), 0
                ) + amount

        if tuition_total > 0:
            breakdown['tuition'] = breakdown.get('tuition', 0)
            total += tuition_total
            calculation_details['per_credit_rate'] = per_credit_rate
            calculation_details['credit_hours'] = credit_hours
            if per_credit_rate > 0:
                calculation_details[
                    'tuition_formula'] = f"{credit_hours} x ${per_credit_rate} = ${breakdown.get('tuition', 0)}"

        # Process bus fees if included
        if include_bus:
            bus_fees = [f for f in fee_structures if f.category == 'bus']
            bus_total = 0
            for fee in bus_fees:
                amount = fee.amount
                bus_total += amount
                breakdown['bus'] = breakdown.get('bus', 0) + amount

            if bus_total > 0:
                total += bus_total

        return jsonify({
            "breakdown": breakdown,
            "total": total,
            "calculation_details": calculation_details
        }), 200

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"ERROR in calculate_fees: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({
            "error": f"Failed to calculate fees: {str(e)}"
        }), 500


# ============================================================================
# BANK RECONCILIATION PAGE ENDPOINTS (alyan's modification)


# ============================================================================

# ============================================================================
# ENDPOINT: POST /api/finance/bank-reconciliation/sync
# Description: Sync/import bank transactions from file or external source


# ============================================================================
@finance_bp.route("/bank-reconciliation/sync", methods=["POST"])
@jwt_required()
@require_admin
def sync_bank_data():
    """
    Syncs/imports bank transactions from CSV file or manual entries.
    Automatically attempts to match transactions based on amount/reference.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        source = data.get('source')  # 'file' or 'manual'
        imported_count = 0
        auto_matched = 0
        unmatched = 0
        duplicates_skipped = 0

        if source == 'manual':
            transactions_data = data.get('transactions', [])
            if not transactions_data:
                return jsonify({"error": "No transactions provided"}), 400

            for txn_data in transactions_data:
                bank_ref = txn_data.get('bank_re')
                amount = float(txn_data.get('amount', 0))
                date_str = txn_data.get('date')
                description = txn_data.get('description', '')

                if not bank_ref or not amount or not date_str:
                    continue

                # Check for duplicates
                existing = BankTransaction.query.filter_by(bank_ref=bank_ref).first()
                if existing:
                    duplicates_skipped += 1
                    continue

                # Parse date
                try:
                    transaction_date = datetime.strptime(date_str, '%Y-%m-%d').replace(tzinfo=timezone.utc)
                except Exception:
                    transaction_date = datetime.now(timezone.utc)

                # Create bank transaction
                bank_txn = BankTransaction(
                    bank_ref=bank_ref,
                    amount=amount,
                    transaction_date=transaction_date,
                    bank_description=description,
                    status='Unmatched'
                )

                # Try to auto-match
                # Match by amount and date (within 7 days)
                payment = Payment.query.filter(
                    Payment.amount == amount,
                    Payment.payment_date >= transaction_date - timedelta(days=7),
                    Payment.payment_date <= transaction_date + timedelta(days=7)
                ).first()

                if payment:
                    bank_txn.matched_payment_id = payment.id
                    bank_txn.matched_student_id = payment.student_id
                    bank_txn.status = 'Matched'
                    bank_txn.matched_at = datetime.now(timezone.utc)
                    bank_txn.matched_by = get_jwt_identity()
                    bank_txn.notes = 'Auto-matched by system'
                    auto_matched += 1
                else:
                    unmatched += 1

                db.session.add(bank_txn)
                imported_count += 1

        elif source == 'file':
            # For CSV file upload, would need to parse base64 data
            # For now, return error suggesting manual entry
            return jsonify({
                "error": "CSV file upload not yet implemented. Please use manual entry."
            }), 501

        db.session.commit()

        return jsonify({
            "msg": "Bank data synced successfully",
            "imported_count": imported_count,
            "auto_matched": auto_matched,
            "unmatched": unmatched,
            "duplicates_skipped": duplicates_skipped
        }), 200

    except Exception as e:
        db.session.rollback()
        import traceback
        error_trace = traceback.format_exc()
        print(f"ERROR in sync_bank_data: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({
            "error": f"Failed to sync bank data: {str(e)}"
        }), 500


# ============================================================================
# ENDPOINT: GET /api/finance/bank-reconciliation/<transaction_id>
# Description: Get detailed information for a specific bank transaction


# ============================================================================
@finance_bp.route("/bank-reconciliation/<int:transaction_id>", methods=["GET"])
@jwt_required()
@require_admin
def get_bank_transaction_details(transaction_id):
    """
    Returns detailed information for a specific bank transaction.
    """
    try:
        transaction = BankTransaction.query.get(transaction_id)
        if not transaction:
            return jsonify({"error": "Transaction not found"}), 404

        # Build transaction data
        transaction_data = {
            'id': transaction.id,
            'bank_re': transaction.bank_ref,
            'amount': transaction.amount,
            'date': transaction.transaction_date.strftime('%Y-%m-%d') if transaction.transaction_date else None,
            'bank_description': transaction.bank_description,
            'status': transaction.status,
            'matched_at': transaction.matched_at.isoformat() if transaction.matched_at else None,
            'notes': transaction.notes
        }

        # Get matcher info
        if transaction.matched_by:
            matcher = User.query.get(transaction.matched_by)
            transaction_data['matched_by'] = matcher.username if matcher else None

        # Get matched payment info
        matched_payment_data = None
        if transaction.matched_payment_id:
            payment = Payment.query.get(transaction.matched_payment_id)
            if payment:
                student = User.query.get(payment.student_id)
                matched_payment_data = {
                    'id': payment.id,
                    'student_id': payment.student_id,
                    'student_name': student.username if student else None,
                    'student_email': student.email if student else None,
                    'amount': payment.amount,
                    'payment_date': payment.payment_date.isoformat() if payment.payment_date else None,
                    'payment_method': payment.payment_method,
                    'reference_number': payment.reference_number,
                    'status': payment.status
                }

        # Get student info
        student_data = None
        if transaction.matched_student_id:
            student = User.query.get(transaction.matched_student_id)
            if student:
                # Calculate dues and total paid
                total_paid = db.session.query(func.sum(Payment.amount)).filter(
                    Payment.student_id == student.id,
                    Payment.status == 'RECEIVED'
                ).scalar() or 0

                student_data = {
                    'id': student.id,
                    'name': student.username,
                    'email': student.email,
                    'dues_balance': student.dues_balance,
                    'total_paid': total_paid
                }

        return jsonify({
            'transaction': transaction_data,
            'matched_payment': matched_payment_data,
            'student': student_data
        }), 200

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"ERROR in get_bank_transaction_details: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({
            "error": f"Failed to retrieve transaction details: {str(e)}"
        }), 500


# ============================================================================
# ENDPOINT: PUT /api/finance/bank-reconciliation/<transaction_id>/match
# Description: Manually match a bank transaction to a student/payment


# ============================================================================
@finance_bp.route("/bank-reconciliation/<int:transaction_id>/match", methods=["PUT"])
@jwt_required()
@require_admin
def match_bank_transaction(transaction_id):
    """
    Manually matches a bank transaction to an existing payment or creates a new payment.
    """
    try:
        transaction = BankTransaction.query.get(transaction_id)
        if not transaction:
            return jsonify({"error": "Transaction not found"}), 404

        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        current_user_id = get_jwt_identity()

        # Option 1: Match to existing payment
        if 'payment_id' in data:
            payment_id = data.get('payment_id')
            payment = Payment.query.get(payment_id)
            if not payment:
                return jsonify({"error": "Payment not found"}), 404

            transaction.matched_payment_id = payment_id
            transaction.matched_student_id = payment.student_id
            transaction.status = 'Matched'
            transaction.matched_at = datetime.now(timezone.utc)
            transaction.matched_by = current_user_id
            transaction.notes = data.get('notes', 'Manually matched to existing payment')

            student = User.query.get(payment.student_id)
            student_name = student.username if student else None

            db.session.commit()

            return jsonify({
                "msg": "Transaction matched successfully",
                "transaction_id": transaction_id,
                "status": "Matched",
                "payment_id": payment_id,
                "student_id": payment.student_id,
                "student_name": student_name,
                "remaining_dues": student.dues_balance if student else None
            }), 200

        # Option 2: Create new payment and match
        elif data.get('create_payment') and 'student_id' in data:
            student_id = data.get('student_id')
            student = User.query.get(student_id)
            if not student:
                return jsonify({"error": "Student not found"}), 404

            # Create new payment
            new_payment = Payment(
                student_id=student_id,
                amount=transaction.amount,
                payment_date=transaction.transaction_date or datetime.now(timezone.utc),
                payment_method=data.get('payment_method', 'BANK_TRANSFER'),
                status='RECEIVED',
                reference_number=transaction.bank_ref,
                recorded_by=current_user_id,
                notes=data.get('notes', 'Payment created from bank transaction')
            )

            db.session.add(new_payment)
            db.session.flush()  # Get payment ID

            # Update student dues
            student.dues_balance = max(0, student.dues_balance - transaction.amount)

            # Match transaction
            transaction.matched_payment_id = new_payment.id
            transaction.matched_student_id = student_id
            transaction.status = 'Matched'
            transaction.matched_at = datetime.now(timezone.utc)
            transaction.matched_by = current_user_id
            transaction.notes = data.get('notes', 'New payment created from bank transaction')

            db.session.commit()

            return jsonify({
                "msg": "Transaction matched successfully",
                "transaction_id": transaction_id,
                "status": "Matched",
                "payment_id": new_payment.id,
                "student_id": student_id,
                "student_name": student.username,
                "remaining_dues": student.dues_balance
            }), 200

        else:
            return jsonify({"error": "Invalid request. Provide either 'payment_id' or 'create_payment' with 'student_id'"}), 400  # noqa: E501

    except Exception as e:
        db.session.rollback()
        import traceback
        error_trace = traceback.format_exc()
        print(f"ERROR in match_bank_transaction: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({
            "error": f"Failed to match transaction: {str(e)}"
        }), 500


# ============================================================================
# ENDPOINT: GET /api/finance/bank-reconciliation/suggestions/<transaction_id>
# Description: Get matching suggestions for an unmatched transaction


# ============================================================================
@finance_bp.route("/bank-reconciliation/suggestions/<int:transaction_id>", methods=["GET"])
@jwt_required()
@require_admin
def get_matching_suggestions(transaction_id):
    """
    Returns AI/algorithm-based suggestions for matching an unmatched transaction.
    """
    try:
        transaction = BankTransaction.query.get(transaction_id)
        if not transaction:
            return jsonify({"error": "Transaction not found"}), 404

        suggestions = []

        # Get students with outstanding dues
        students_with_dues = User.query.filter(
            User.dues_balance > 0,
            User.is_admin is False
        ).all()

        unmatched_students = []
        for student in students_with_dues:
            unmatched_students.append({
                'student_id': student.id,
                'student_name': student.username,
                'dues_balance': student.dues_balance
            })

            # Check for exact amount match
            if abs(student.dues_balance - transaction.amount) < 0.01:
                suggestions.append({
                    'type': 'student',
                    'student_id': student.id,
                    'student_name': student.username,
                    'student_email': student.email,
                    'dues_balance': student.dues_balance,
                    'match_confidence': 'HIGH',
                    'reason': 'Exact amount match with outstanding dues'
                })
            # Check for similar amount (within 10%)
            elif abs(student.dues_balance - transaction.amount) / transaction.amount <= 0.1:
                suggestions.append({
                    'type': 'student',
                    'student_id': student.id,
                    'student_name': student.username,
                    'student_email': student.email,
                    'dues_balance': student.dues_balance,
                    'match_confidence': 'MEDIUM',
                    'reason': f'Similar amount (within 10%) - Dues: ${student.dues_balance}, Transaction: ${transaction.amount}'  # noqa: E501
                })

        # Check for payments with similar amount and date
        if transaction.transaction_date:
            date_range_start = transaction.transaction_date - timedelta(days=7)
            date_range_end = transaction.transaction_date + timedelta(days=7)

            similar_payments = Payment.query.filter(
                Payment.amount == transaction.amount,
                Payment.payment_date >= date_range_start,
                Payment.payment_date <= date_range_end,
                Payment.status == 'RECEIVED'
            ).all()

            for payment in similar_payments:
                student = User.query.get(payment.student_id)
                if student:
                    suggestions.append({
                        'type': 'payment',
                        'payment_id': payment.id,
                        'student_name': student.username,
                        'amount': payment.amount,
                        'payment_date': payment.payment_date.strftime('%Y-%m-%d') if payment.payment_date else None,
                        'match_confidence': 'HIGH',
                        'reason': 'Exact amount and date match'
                    })

        # Sort suggestions by confidence
        confidence_order = {'HIGH': 1, 'MEDIUM': 2, 'LOW': 3}
        suggestions.sort(key=lambda x: confidence_order.get(x.get('match_confidence', 'LOW'), 3))

        return jsonify({
            'transaction': {
                'id': transaction.id,
                'bank_re': transaction.bank_ref,
                'amount': transaction.amount,
                'date': transaction.transaction_date.strftime('%Y-%m-%d') if transaction.transaction_date else None
            },
            'suggestions': suggestions[:10],  # Limit to top 10
            'unmatched_students': unmatched_students
        }), 200

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"ERROR in get_matching_suggestions: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({
            "error": f"Failed to get matching suggestions: {str(e)}"
        }), 500


# ============================================================================
# REPORTS PAGE ENDPOINTS (alyan's modification)


# ============================================================================

@finance_bp.route("/reports/types", methods=["GET"])
@jwt_required()
@require_admin
def get_report_types():
    """
    Returns available report types and configuration options (alyan's modification).

    Returns:
    {
        "report_types": [...],
        "faculties": [...]
    }
    """
    try:
        # Get unique faculties from courses
        faculties = db.session.query(Course.faculty).distinct().filter(Course.faculty.isnot(None)).all()
        faculty_list = ["All Faculties"] + [f[0] for f in faculties if f[0]]

        report_types = [
            {
                "id": "student_level",
                "name": "Student Level Report",
                "description": "Individual student payment history and outstanding balances",
                "icon": "user",
                "available_formats": ["pd", "excel", "json"]
            },
            {
                "id": "faculty_level",
                "name": "Faculty Level Report",
                "description": "Aggregated payment data by faculty/department",
                "icon": "building",
                "available_formats": ["pd", "excel", "json"]
            },
            {
                "id": "university_level",
                "name": "University Level Report",
                "description": "Complete university-wide financial overview",
                "icon": "chart",
                "available_formats": ["pd", "excel", "json"]
            },
            {
                "id": "finance_overview",
                "name": "Finance Overview",
                "description": "Summary of all financial transactions and metrics",
                "icon": "document",
                "available_formats": ["pd", "excel", "json"]
            }
        ]

        return jsonify({
            "report_types": report_types,
            "faculties": faculty_list
        }), 200

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"ERROR in get_report_types: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({
            "error": f"Failed to get report types: {str(e)}"
        }), 500


@finance_bp.route("/reports/generate", methods=["POST"])
@jwt_required()
@require_admin
def generate_report():
    """
    Generates a custom report based on parameters (alyan's modification).

    Request Body:
    {
        "report_type": "student_level",
        "faculty": "Engineering",
        "start_date": "2025-01-01",
        "end_date": "2025-12-31",
        "format": "json",
        "save_to_history": true
    }
    """
    try:
        data = request.get_json()
        report_type = data.get('report_type')
        faculty = data.get('faculty', 'All Faculties')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        format_type = data.get('format', 'json')
        save_to_history = data.get('save_to_history', False)

        current_user_id = get_jwt_identity()

        # Generate report ID (check for existing IDs to avoid conflicts)
        year = datetime.now(timezone.utc).year
        # Get the highest existing report number for this year
        existing_reports = GeneratedReport.query.filter(
            GeneratedReport.id.like(f'RPT-{year}-%')
        ).all()
        existing_numbers = []
        for rpt in existing_reports:
            try:
                # Extract number from ID like "RPT-2025-001"
                num = int(rpt.id.split('-')[-1])
                existing_numbers.append(num)
            except Exception:
                pass
        report_count = (max(existing_numbers) + 1) if existing_numbers else 1
        report_id = f"RPT-{year}-{report_count:03d}"

        # Debug: Print report ID being generated
        print(f"DEBUG: Generating report with ID: {report_id}")

        # Generate report name
        faculty_display = faculty if faculty != 'All Faculties' else 'All'
        report_name = f"{report_type.replace('_', ' ').title()} - {faculty_display} - {year}"

        # Generate report data based on type
        report_data = None
        summary = {}

        if report_type == 'student_level':
            report_data, summary = _generate_student_level_report(faculty, start_date, end_date)
        elif report_type == 'faculty_level':
            report_data, summary = _generate_faculty_level_report(start_date, end_date)
        elif report_type == 'university_level':
            report_data, summary = _generate_university_level_report(start_date, end_date)
        elif report_type == 'finance_overview':
            report_data, summary = _generate_finance_overview_report(start_date, end_date)
        else:
            return jsonify({"error": f"Unknown report type: {report_type}"}), 400

        # If format is JSON, return data directly
        if format_type == 'json':
            response = {
                "report_id": report_id,
                "report_name": report_name,
                "report_type": report_type,
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "parameters": {
                    "faculty": faculty,
                    "date_range": f"{start_date or 'All time'} to {end_date or 'Present'}"
                },
                "summary": summary,
                "data": report_data
            }

            # Save to history if requested (always save JSON reports so they can be downloaded later)
            if save_to_history or True:  # Always save JSON reports
                report_record = GeneratedReport(
                    id=report_id,
                    name=report_name,
                    report_type=report_type,
                    parameters={
                        "faculty": faculty,
                        "start_date": start_date,
                        "end_date": end_date,
                        "report_data": report_data,  # Store the actual report data in parameters
                        "summary": summary,
                        "date_range": f"{start_date or 'All time'} to {end_date or 'Present'}"
                    },
                    generated_by=current_user_id,
                    generated_at=datetime.now(timezone.utc),
                    expires_at=datetime.now(timezone.utc) + timedelta(days=30)
                )
                db.session.add(report_record)
                db.session.commit()

            return jsonify(response), 200

        # For PDF/Excel, save to history and return download URL
        # Note: PDF/Excel generation would require additional libraries (reportlab, openpyxl)
        # For now, we'll save the JSON data and return a placeholder
        # Always save PDF/Excel reports so they can be downloaded later
        if save_to_history or True:  # Always save reports
            report_record = GeneratedReport(
                id=report_id,
                name=report_name,
                report_type=report_type,
                parameters={
                    "faculty": faculty,
                    "start_date": start_date,
                    "end_date": end_date,
                    "report_data": report_data,  # Store the actual report data
                    "summary": summary,  # Store the summary
                    "date_range": f"{start_date or 'All time'} to {end_date or 'Present'}"
                },
                generated_by=current_user_id,
                generated_at=datetime.now(timezone.utc),
                expires_at=datetime.now(timezone.utc) + timedelta(days=30)
            )
            db.session.add(report_record)
            db.session.commit()

            # Debug: Verify report was saved
            saved_report = GeneratedReport.query.get(report_id)
            if saved_report:
                print(f"DEBUG: Report {report_id} saved successfully")
            else:
                print(f"DEBUG: ERROR - Report {report_id} was not saved!")

        return jsonify({
            "report_id": report_id,
            "download_url": f"/api/finance/reports/download/{report_id}?format={format_type}",
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        }), 200

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"ERROR in generate_report: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({
            "error": f"Failed to generate report: {str(e)}"
        }), 500


@finance_bp.route("/reports/download/<report_id>", methods=["GET"])
@jwt_required()
@require_admin
def download_report(report_id):
    """
    Downloads a generated report in specified format (alyan's modification).

    Query Parameters:
    - format: 'pd', 'excel', or 'json' (default: 'json')
    """
    try:
        format_type = request.args.get('format', 'json')

        # Debug: Print report_id being searched
        print(f"DEBUG: Looking for report with ID: {report_id}")

        report = GeneratedReport.query.get(report_id)
        if not report:
            # Debug: Check what reports exist
            all_reports = GeneratedReport.query.all()
            print(f"DEBUG: Report not found. Total reports in DB: {len(all_reports)}")
            if all_reports:
                print(f"DEBUG: Existing report IDs: {[r.id for r in all_reports]}")
            return jsonify({"error": f"Report not found: {report_id}"}), 404

        # Check if report has expired
        if report.expires_at and report.expires_at < datetime.now(timezone.utc):
            return jsonify({"error": "Report has expired"}), 410

        # Get report data from parameters (stored when generated)
        # Handle JSON column - it might be a dict or already parsed
        params = report.parameters if isinstance(report.parameters, dict) else {}
        if isinstance(report.parameters, str):
            try:
                params = json.loads(report.parameters)
            except Exception:
                params = {}

        report_data = params.get('report_data') if params else None
        summary = params.get('summary') if params else {}

        # Debug: Check if data exists
        print(f"DEBUG: Report found. Has report_data: {report_data is not None}, Has summary: {bool(summary)}")
        print(f"DEBUG: Report parameters type: {type(report.parameters)}")

        # Helper function to serialize complex objects
        def json_serializer(obj):
            """JSON serializer for objects not serializable by default json code"""
            if isinstance(obj, (datetime,)):
                return obj.isoformat()
            elif isinstance(obj, (timedelta,)):
                return str(obj)
            elif hasattr(obj, '__dict__'):
                try:
                    return obj.__dict__
                except Exception:
                    return str(obj)
            elif hasattr(obj, 'to_dict'):
                try:
                    return obj.to_dict()
                except Exception:
                    return str(obj)
            else:
                return str(obj)

        # Build full report response
        try:
            # Ensure report_data and summary are JSON-serializable
            if report_data is None:
                report_data = []
            if not isinstance(summary, dict):
                summary = {}

            full_report = {
                "report_id": report.id,
                "report_name": report.name,
                "report_type": report.report_type,
                "generated_at": report.generated_at.isoformat() if report.generated_at else None,
                "parameters": {
                    "faculty": params.get('faculty') if params else None,
                    "start_date": params.get('start_date') if params else None,
                    "end_date": params.get('end_date') if params else None
                },
                "summary": summary,
                "data": report_data
            }

            # Serialize to JSON with proper handling of complex objects
            try:
                json_str = json.dumps(full_report, indent=2, default=json_serializer, ensure_ascii=False)
            except (TypeError, ValueError) as json_error:
                print(f"DEBUG: JSON serialization error: {str(json_error)}")
                import traceback
                print(traceback.format_exc())
                # Fallback: convert everything to string
                json_str = json.dumps(full_report, indent=2, default=str, ensure_ascii=False)

            if format_type == 'json':
                # Return JSON file
                return Response(
                    json_str,
                    mimetype='application/json',
                    headers={
                        'Content-Disposition': 'attachment; filename="{report.id}.json"'
                    }
                )
            elif format_type == 'pd':
                # Placeholder: In production, generate PDF using reportlab
                # For now, return JSON with PDF mimetype
                return Response(
                    json_str,
                    mimetype='application/pdf',
                    headers={
                        'Content-Disposition': 'attachment; filename="{report.id}.pd"'
                    }
                )
            elif format_type == 'excel':
                # Placeholder: In production, generate Excel using openpyxl
                # For now, return JSON with Excel mimetype
                return Response(
                    json_str,
                    mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    headers={
                        'Content-Disposition': 'attachment; filename="{report.id}.xlsx"'
                    }
                )
            else:
                return jsonify({"error": f"Unsupported format: {format_type}"}), 400
        except Exception as build_error:
            print(f"DEBUG: Error building report response: {str(build_error)}")
            import traceback
            print(traceback.format_exc())
            return jsonify({"error": f"Failed to build report response: {str(build_error)}"}), 500

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"ERROR in download_report: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({
            "error": f"Failed to download report: {str(e)}"
        }), 500


@finance_bp.route("/reports/history", methods=["GET"])
@jwt_required()
@require_admin
def get_report_history():
    """
    Returns list of recently generated reports (alyan's modification).

    Query Parameters:
    - limit: Number of records (default: 10)
    - offset: Pagination offset (default: 0)
    - report_type: Filter by type (optional)
    """
    try:
        limit = request.args.get('limit', default=10, type=int)
        offset = request.args.get('offset', default=0, type=int)
        report_type_filter = request.args.get('report_type', type=str)

        query = GeneratedReport.query

        if report_type_filter:
            query = query.filter(GeneratedReport.report_type == report_type_filter)

        total_count = query.count()
        reports = query.order_by(desc(GeneratedReport.generated_at)).offset(offset).limit(limit).all()

        reports_list = [report.to_dict() for report in reports]

        return jsonify({
            "reports": reports_list,
            "total_count": total_count,
            "has_more": (offset + limit) < total_count
        }), 200

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"ERROR in get_report_history: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({
            "error": f"Failed to get report history: {str(e)}"
        }), 500


@finance_bp.route("/reports/faculty-summary", methods=["GET"])
@jwt_required()
@require_admin
def get_faculty_summary():
    """
    Returns faculty-level aggregated data for Faculty Level Report (alyan's modification).

    Query Parameters:
    - start_date: Filter start date (optional)
    - end_date: Filter end date (optional)
    """
    try:
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')

        start_date = None
        end_date = None
        if start_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').replace(tzinfo=timezone.utc)
        if end_date_str:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').replace(tzinfo=timezone.utc)

        # Get all faculties
        faculties = db.session.query(Course.faculty).distinct().filter(Course.faculty.isnot(None)).all()
        faculty_list = [f[0] for f in faculties if f[0]]

        faculties_data = []
        total_students = 0
        total_fees = 0
        total_collected = 0
        total_pending = 0

        for faculty_name in faculty_list:
            # Get enrollments for this faculty
            enrollments = db.session.query(Enrollment).join(Course).filter(
                Course.faculty == faculty_name
            )

            if start_date:
                enrollments = enrollments.filter(Enrollment.enrollment_date >= start_date)
            if end_date:
                enrollments = enrollments.filter(Enrollment.enrollment_date <= end_date)

            enrollments_list = enrollments.all()

            # Calculate totals
            faculty_students = len(set(e.student_id for e in enrollments_list))
            faculty_total_fees = sum(e.course_fee for e in enrollments_list)

            # Get payments for students in this faculty
            student_ids = [e.student_id for e in enrollments_list]
            payments_query = db.session.query(Payment).filter(Payment.student_id.in_(student_ids))

            if start_date:
                payments_query = payments_query.filter(Payment.payment_date >= start_date)
            if end_date:
                payments_query = payments_query.filter(Payment.payment_date <= end_date)

            payments = payments_query.filter(Payment.status == 'RECEIVED').all()
            faculty_collected = sum(p.amount for p in payments)
            faculty_pending = faculty_total_fees - faculty_collected

            # Calculate student status counts
            paid_students = 0
            pending_students = 0
            unpaid_students = 0

            for student_id in set(student_ids):
                student = User.query.get(student_id)
                if student:
                    if student.dues_balance == 0:
                        paid_students += 1
                    elif student.dues_balance < student.dues_balance + faculty_collected:  # Partially paid
                        pending_students += 1
                    else:
                        unpaid_students += 1

            collection_rate = (faculty_collected / faculty_total_fees * 100) if faculty_total_fees > 0 else 0

            faculties_data.append({
                "name": faculty_name,
                "total_students": faculty_students,
                "total_fees": faculty_total_fees,
                "total_collected": faculty_collected,
                "total_pending": faculty_pending,
                "collection_rate": round(collection_rate, 2),
                "paid_students": paid_students,
                "pending_students": pending_students,
                "unpaid_students": unpaid_students
            })

            total_students += faculty_students
            total_fees += faculty_total_fees
            total_collected += faculty_collected
            total_pending += faculty_pending

        overall_collection_rate = (total_collected / total_fees * 100) if total_fees > 0 else 0

        return jsonify({
            "report_date": datetime.now(timezone.utc).isoformat(),
            "date_range": {
                "start": start_date_str or "All time",
                "end": end_date_str or "Present"
            },
            "faculties": faculties_data,
            "totals": {
                "total_students": total_students,
                "total_fees": total_fees,
                "total_collected": total_collected,
                "total_pending": total_pending,
                "overall_collection_rate": round(overall_collection_rate, 2)
            }
        }), 200

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"ERROR in get_faculty_summary: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({
            "error": f"Failed to get faculty summary: {str(e)}"
        }), 500


@finance_bp.route("/reports/university-summary", methods=["GET"])
@jwt_required()
@require_admin
def get_university_summary():
    """
    Returns university-wide overview data for University Level Report (alyan's modification).

    Query Parameters:
    - start_date: Filter start date (optional)
    - end_date: Filter end date (optional)
    """
    try:
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')

        start_date = None
        end_date = None
        if start_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').replace(tzinfo=timezone.utc)
        if end_date_str:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').replace(tzinfo=timezone.utc)

        # Get all students (non-admin)
        students_query = User.query.filter(User.is_admin is False)
        total_students = students_query.count()

        # Get all enrollments
        enrollments_query = Enrollment.query
        if start_date:
            enrollments_query = enrollments_query.filter(Enrollment.enrollment_date >= start_date)
        if end_date:
            enrollments_query = enrollments_query.filter(Enrollment.enrollment_date <= end_date)

        enrollments = enrollments_query.all()
        total_enrolled_courses = len(enrollments)
        total_fees_expected = sum(e.course_fee for e in enrollments)

        # Get all payments
        payments_query = Payment.query.filter(Payment.status == 'RECEIVED')
        if start_date:
            payments_query = payments_query.filter(Payment.payment_date >= start_date)
        if end_date:
            payments_query = payments_query.filter(Payment.payment_date <= end_date)

        payments = payments_query.all()
        total_collected = sum(p.amount for p in payments)
        total_pending = total_fees_expected - total_collected
        collection_rate = (total_collected / total_fees_expected * 100) if total_fees_expected > 0 else 0

        # Calculate by status
        paid_count = User.query.filter(User.is_admin is False, User.dues_balance == 0).count()
        pending_count = User.query.filter(User.is_admin is False, User.dues_balance > 0).count()
        unpaid_count = total_students - paid_count - pending_count

        # Monthly trends (last 6 months)
        monthly_trends = []
        for i in range(6):
            month_date = datetime.now(timezone.utc) - timedelta(days=30 * i)
            month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if i == 0:
                month_end = datetime.now(timezone.utc)
            else:
                next_month = month_start + timedelta(days=32)
                month_end = next_month.replace(day=1) - timedelta(seconds=1)

            month_payments = Payment.query.filter(
                Payment.status == 'RECEIVED',
                Payment.payment_date >= month_start,
                Payment.payment_date <= month_end
            ).all()

            month_collected = sum(p.amount for p in month_payments)
            month_target = total_fees_expected / 12  # Rough estimate
            month_rate = (month_collected / month_target * 100) if month_target > 0 else 0

            monthly_trends.append({
                "month": month_start.strftime('%b %Y'),
                "collected": month_collected,
                "target": month_target,
                "rate": round(month_rate, 1)
            })

        monthly_trends.reverse()

        # By payment method
        payment_methods = {}
        for payment in payments:
            method = payment.payment_method or 'UNKNOWN'
            if method not in payment_methods:
                payment_methods[method] = {"amount": 0, "count": 0}
            payment_methods[method]["amount"] += payment.amount
            payment_methods[method]["count"] += 1

        by_payment_method = []
        for method, data in payment_methods.items():
            percentage = (data["amount"] / total_collected * 100) if total_collected > 0 else 0
            by_payment_method.append({
                "method": method,
                "amount": data["amount"],
                "count": data["count"],
                "percentage": round(percentage, 2)
            })

        # By faculty
        faculties = db.session.query(Course.faculty).distinct().filter(Course.faculty.isnot(None)).all()
        by_faculty = []
        for faculty_tuple in faculties:
            faculty_name = faculty_tuple[0]
            faculty_enrollments = db.session.query(Enrollment).join(Course).filter(
                Course.faculty == faculty_name
            ).all()
            student_ids = [e.student_id for e in faculty_enrollments]
            faculty_payments = Payment.query.filter(
                Payment.student_id.in_(student_ids),
                Payment.status == 'RECEIVED'
            ).all()
            faculty_collected = sum(p.amount for p in faculty_payments)
            percentage = (faculty_collected / total_collected * 100) if total_collected > 0 else 0
            by_faculty.append({
                "faculty": faculty_name,
                "collected": faculty_collected,
                "percentage": round(percentage, 2)
            })

        return jsonify({
            "report_date": datetime.now(timezone.utc).isoformat(),
            "period": f"Academic Year {datetime.now(timezone.utc).year}-{datetime.now(timezone.utc).year + 1}",
            "overview": {
                "total_students": total_students,
                "total_enrolled_courses": total_enrolled_courses,
                "total_fees_expected": total_fees_expected,
                "total_collected": total_collected,
                "total_pending": total_pending,
                "collection_rate": round(collection_rate, 2)
            },
            "by_status": {
                "paid": {"count": paid_count, "percentage": round((paid_count / total_students * 100) if total_students > 0 else 0, 1)},  # noqa: E501
                "pending": {"count": pending_count, "percentage": round((pending_count / total_students * 100) if total_students > 0 else 0, 1)},  # noqa: E501
                "unpaid": {"count": unpaid_count, "percentage": round((unpaid_count / total_students * 100) if total_students > 0 else 0, 1)}  # noqa: E501
            },
            "monthly_trends": monthly_trends,
            "by_payment_method": by_payment_method,
            "by_faculty": by_faculty
        }), 200

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"ERROR in get_university_summary: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({
            "error": f"Failed to get university summary: {str(e)}"
        }), 500


@finance_bp.route("/reports/<report_id>", methods=["DELETE"])
@jwt_required()
@require_admin
def delete_report(report_id):
    """
    Deletes a saved report from history (alyan's modification).
    """
    try:
        report = GeneratedReport.query.get(report_id)
        if not report:
            return jsonify({"error": "Report not found"}), 404

        db.session.delete(report)
        db.session.commit()

        return jsonify({
            "msg": "Report deleted successfully",
            "report_id": report_id
        }), 200

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"ERROR in delete_report: {str(e)}")
        print(f"Traceback: {error_trace}")
        return jsonify({
            "error": f"Failed to delete report: {str(e)}"
        }), 500


# ============================================================================
# HELPER FUNCTIONS FOR REPORT GENERATION (alyan's modification)


# ============================================================================

def _generate_student_level_report(faculty, start_date, end_date):
    """Generate student level report data."""
    query = User.query.filter(User.is_admin is False)

    if faculty and faculty != 'All Faculties':
        # Filter by faculty through enrollments
        student_ids = db.session.query(Enrollment.student_id).join(Course).filter(
            Course.faculty == faculty
        ).distinct().all()
        student_ids = [s[0] for s in student_ids]
        query = query.filter(User.id.in_(student_ids))

    students = query.all()

    data = []
    total_fees = 0
    total_collected = 0
    total_pending = 0
    paid_count = 0
    pending_count = 0
    unpaid_count = 0

    for student in students:
        # Get enrollments
        enrollments = Enrollment.query.filter(Enrollment.student_id == student.id)
        if start_date:
            enrollments = enrollments.filter(Enrollment.enrollment_date >= start_date)
        if end_date:
            enrollments = enrollments.filter(Enrollment.enrollment_date <= end_date)

        enrollments_list = enrollments.all()
        student_total_fees = sum(e.course_fee for e in enrollments_list)

        # Get payments
        payments = Payment.query.filter(
            Payment.student_id == student.id,
            Payment.status == 'RECEIVED'
        )
        if start_date:
            payments = payments.filter(Payment.payment_date >= start_date)
        if end_date:
            payments = payments.filter(Payment.payment_date <= end_date)

        payments_list = payments.all()
        student_paid = sum(p.amount for p in payments_list)
        student_dues = student.dues_balance

        # Get faculty from first enrollment
        faculty_name = None
        if enrollments_list:
            first_enrollment = enrollments_list[0]
            if first_enrollment.course:
                faculty_name = first_enrollment.course.faculty

        # Get last payment date
        last_payment_date = None
        if payments_list:
            last_payment = max(payments_list, key=lambda p: p.payment_date)
            last_payment_date = last_payment.payment_date.strftime('%Y-%m-%d')

        status = "Paid" if student_dues == 0 else ("Pending" if student_paid > 0 else "Unpaid")

        data.append({
            "student_id": f"STD-{student.id:03d}",
            "name": student.username,
            "email": student.email,
            "faculty": faculty_name,
            "total_fees": student_total_fees,
            "paid": student_paid,
            "dues": student_dues,
            "status": status,
            "last_payment_date": last_payment_date
        })

        total_fees += student_total_fees
        total_collected += student_paid
        total_pending += student_dues

        if status == "Paid":
            paid_count += 1
        elif status == "Pending":
            pending_count += 1
        else:
            unpaid_count += 1

    summary = {
        "total_students": len(students),
        "total_fees": total_fees,
        "total_collected": total_collected,
        "total_pending": total_pending,
        "collection_rate": round((total_collected / total_fees * 100) if total_fees > 0 else 0, 2),
        "paid_count": paid_count,
        "pending_count": pending_count,
        "unpaid_count": unpaid_count
    }

    return data, summary


def _generate_faculty_level_report(start_date, end_date):
    """Generate faculty level report data."""
    # This will use the same logic as get_faculty_summary
    # For now, return simplified data
    return [], {
        "total_faculties": 0,
        "total_students": 0,
        "total_fees": 0,
        "total_collected": 0
    }


def _generate_university_level_report(start_date, end_date):
    """Generate university level report data."""
    # This will use the same logic as get_university_summary
    # For now, return simplified data
    return [], {
        "total_students": 0,
        "total_fees": 0,
        "total_collected": 0
    }


def _generate_finance_overview_report(start_date, end_date):
    """Generate finance overview report data."""
    # Get summary statistics
    total_students = User.query.filter(User.is_admin is False).count()

    payments_query = Payment.query.filter(Payment.status == 'RECEIVED')
    if start_date:
        payments_query = payments_query.filter(Payment.payment_date >= start_date)
    if end_date:
        payments_query = payments_query.filter(Payment.payment_date <= end_date)

    payments = payments_query.all()
    total_collected = sum(p.amount for p in payments)

    unpaid_students = User.query.filter(
        User.is_admin is False,
        User.dues_balance > 0
    ).count()

    return [], {
        "total_students": total_students,
        "total_collected": total_collected,
        "unpaid_students": unpaid_students,
        "collection_rate": 0
    }


# ============================================================================
# UNPAID STUDENTS PAGE ENDPOINTS (alyan's modification)


# ============================================================================

# ============================================================================
# ENDPOINT: GET /api/finance/unpaid-students (Enhanced)
# Description: Returns unpaid students with all required fields for the page


# ============================================================================
@finance_bp.route("/unpaid-students", methods=["GET"])
@jwt_required()
@require_admin
def get_unpaid_students():
    """
    Returns unpaid students with all required fields for the page (alyan's modification).

    Returns:
    {
        "summary": {
            "unpaid_count": 5,
            "total_outstanding": 47400,
            "overdue_count": 2,
            "due_today_count": 1,
            "due_soon_count": 2
        },
        "students": [
            {
                "id": 1,
                "user_id": 5,
                "name": "James Wilson",
                "student_id": "STD-005",
                "email": "james.w@uni.edu",
                "faculty": "Engineering",
                "outstanding": 12500,
                "due_date": "2025-12-15",
                "days_overdue": 0,
                "status": "Due Today",
                "is_blocked": false,
                "last_reminder_sent": "2025-12-01"
            }
        ]
    }
    """
    try:
        from datetime import datetime, timedelta, timezone

        # Get all students with outstanding dues
        students = User.query.filter(
            User.is_admin is False,
            User.dues_balance > 0
        ).all()

        today = datetime.now(timezone.utc).date()
        students_list = []
        overdue_count = 0
        due_today_count = 0
        due_soon_count = 0

        for student in students:
            # Get enrollments to determine faculty and calculate due date
            enrollments = Enrollment.query.filter_by(student_id=student.id).all()

            # Determine faculty from first enrollment's course
            faculty = "Unknown"
            if enrollments:
                first_enrollment = enrollments[0]
                if first_enrollment.course:
                    if hasattr(first_enrollment.course, 'faculty') and first_enrollment.course.faculty:
                        faculty = first_enrollment.course.faculty
                    else:
                        # Fallback: Map course name to faculty
                        course_name = first_enrollment.course.name.lower()
                        if 'computer' in course_name or 'cs' in course_name:
                            faculty = "Computer Science"
                        elif 'english' in course_name or 'literature' in course_name:
                            faculty = "Digital Arts"
                        elif 'data' in course_name or 'analytics' in course_name:
                            faculty = "Computer Science"
                        elif 'business' in course_name or 'management' in course_name:
                            faculty = "Business Informatics"
                        elif 'math' in course_name:
                            faculty = "Engineering"
                        else:
                            faculty = "Engineering"  # Default

            # Calculate due date (30 days from first enrollment, or use payment_due_date if set)
            # alyan's modification: Use getattr to safely access new fields that may not exist yet
            due_date = None
            days_overdue = 0
            status = "Unpaid"

            payment_due_date = getattr(student, 'payment_due_date', None)
            if payment_due_date:
                if isinstance(payment_due_date, datetime):
                    due_date = payment_due_date.date()
                elif hasattr(payment_due_date, 'date'):
                    due_date = payment_due_date.date()
                else:
                    # Try to parse as date string or use as-is
                    try:
                        due_date = datetime.fromisoformat(str(payment_due_date)).date()
                    except Exception:
                        due_date = None
            elif enrollments:
                first_enrollment_date = enrollments[0].enrollment_date
                if first_enrollment_date:
                    if isinstance(first_enrollment_date, datetime):
                        due_date = (first_enrollment_date + timedelta(days=30)).date()
                    elif hasattr(first_enrollment_date, 'date'):
                        due_date = (first_enrollment_date + timedelta(days=30)).date()
                    else:
                        # Try to parse and add 30 days
                        try:
                            if isinstance(first_enrollment_date, str):
                                parsed_date = datetime.fromisoformat(first_enrollment_date)
                                due_date = (parsed_date + timedelta(days=30)).date()
                            else:
                                due_date = None
                        except Exception:
                            due_date = None

            if due_date:
                days_overdue = (today - due_date).days

                if days_overdue > 0:
                    status = "Overdue"
                    overdue_count += 1
                elif days_overdue == 0:
                    status = "Due Today"
                    due_today_count += 1
                elif days_overdue >= -7:
                    status = "Due Soon"
                    due_soon_count += 1
                else:
                    status = "Unpaid"

            # Get last reminder sent date (from notifications)
            # alyan's modification: Use notification_type instead of type
            last_reminder = Notification.query.filter_by(
                student_id=student.id,
                notification_type='PAYMENT_REMINDER'
            ).order_by(Notification.created_at.desc()).first()

            last_reminder_sent = None
            if last_reminder and last_reminder.created_at:
                last_reminder_sent = last_reminder.created_at.date().isoformat() if isinstance(
                    last_reminder.created_at, datetime) else str(last_reminder.created_at)

            students_list.append({
                "id": student.id,
                "user_id": student.id,
                "name": student.username,
                "student_id": f"STD-{str(student.id).zfill(3)}",
                "email": student.email,
                "faculty": faculty,
                "outstanding": float(student.dues_balance),
                "due_date": due_date.isoformat() if due_date else None,
                "days_overdue": days_overdue,
                "status": status,
                "is_blocked": getattr(student, 'is_blocked', False),  # alyan's modification: Safely access new field
                "last_reminder_sent": last_reminder_sent
            })

        # Calculate summary
        total_outstanding = sum(float(s.dues_balance) for s in students)

        return jsonify({
            "summary": {
                "unpaid_count": len(students),
                "total_outstanding": total_outstanding,
                "overdue_count": overdue_count,
                "due_today_count": due_today_count,
                "due_soon_count": due_soon_count
            },
            "students": students_list
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching unpaid students: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to fetch unpaid students", "details": str(e)}), 500


# ============================================================================
# ENDPOINT: PUT /api/finance/action/penalty/<student_id>
# Description: Apply late fee penalty to a student


# ============================================================================
@finance_bp.route("/action/penalty/<int:student_id>", methods=["PUT"])
@jwt_required()
@require_admin
def apply_penalty(student_id):
    """
    Apply late fee penalty to a student (alyan's modification).

    Request Body:
    {
        "penalty_amount": 50,
        "penalty_type": "LATE_FEE",
        "notes": "Late payment penalty - 11 days overdue"
    }

    Returns:
    {
        "msg": "Penalty applied successfully",
        "student_id": 12,
        "penalty_amount": 50,
        "new_dues_balance": 8550,
        "penalty_id": 1
    }
    """
    try:
        from flask_jwt_extended import get_jwt_identity

        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400

        penalty_amount = data.get('penalty_amount')
        penalty_type = data.get('penalty_type', 'LATE_FEE')
        notes = data.get('notes', '')

        if not penalty_amount or penalty_amount <= 0:
            return jsonify({"error": "penalty_amount must be a positive number"}), 400

        # Get student
        student = User.query.get(student_id)
        if not student or student.is_admin:
            return jsonify({"error": "Student not found"}), 404

        # Get current admin user
        admin_id = get_jwt_identity()

        # Create penalty record
        penalty = Penalty(
            student_id=student_id,
            amount=float(penalty_amount),
            penalty_type=penalty_type,
            applied_by=admin_id,
            notes=notes
        )
        db.session.add(penalty)

        # Update student's dues balance
        student.dues_balance = float(student.dues_balance) + float(penalty_amount)

        # Create notification for student
        notification = Notification(
            student_id=student_id,
            notification_type='PENALTY_APPLIED',  # alyan's modification: Use notification_type instead of type
            message=f"Late fee penalty of ${penalty_amount} has been applied to your account.",
            is_read=False
        )
        db.session.add(notification)

        # Log action (alyan's modification: Use correct ActionLog fields)
        action_log = ActionLog(
            student_id=student_id,
            action_type='APPLY_PENALTY',
            action_description=f"Applied ${penalty_amount} penalty ({penalty_type}) to student {student.username} (ID: {student_id})",  # noqa: E501
            performed_by=admin_id
        )
        db.session.add(action_log)

        db.session.commit()

        return jsonify({
            "msg": "Penalty applied successfully",
            "student_id": student_id,
            "penalty_amount": float(penalty_amount),
            "new_dues_balance": float(student.dues_balance),
            "penalty_id": penalty.id
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error applying penalty: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to apply penalty", "details": str(e)}), 500


# ============================================================================
# ENDPOINT: PUT /api/finance/action/block/<student_id>
# Description: Block student registration due to unpaid dues


# ============================================================================
@finance_bp.route("/action/block/<int:student_id>", methods=["PUT"])
@jwt_required()
@require_admin
def block_student(student_id):
    """
    Block student registration due to unpaid dues (alyan's modification).

    Request Body:
    {
        "block_type": "REGISTRATION",
        "reason": "Outstanding dues over 7 days",
        "notes": "Blocked due to unpaid fees"
    }

    Returns:
    {
        "msg": "Registration blocked successfully",
        "student_id": 12,
        "blocked_at": "2025-12-10T15:30:00",
        "block_type": "REGISTRATION"
    }
    """
    try:
        from flask_jwt_extended import get_jwt_identity

        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400

        block_type = data.get('block_type', 'REGISTRATION')
        reason = data.get('reason', 'Outstanding dues')
        notes = data.get('notes', '')

        # Get student
        student = User.query.get(student_id)
        if not student or student.is_admin:
            return jsonify({"error": "Student not found"}), 404

        # Block student (alyan's modification: Use setattr to safely set fields that may not exist yet)
        setattr(student, 'is_blocked', True)
        setattr(student, 'blocked_at', datetime.now(timezone.utc))
        setattr(student, 'blocked_reason', reason)

        # Get current admin user
        admin_id = get_jwt_identity()

        # Create notification for student
        notification = Notification(
            student_id=student_id,
            notification_type='REGISTRATION_BLOCKED',  # alyan's modification: Use notification_type instead of type
            message=f"Your registration has been blocked due to: {reason}",
            is_read=False
        )
        db.session.add(notification)

        # Log action (alyan's modification: Use correct ActionLog fields)
        action_log = ActionLog(
            student_id=student_id,
            action_type='BLOCK_STUDENT',
            action_description=f"Blocked registration ({block_type}) for student {student.username} (ID: {student_id}): {reason}. Notes: {notes}",  # noqa: E501
            performed_by=admin_id
        )
        db.session.add(action_log)

        try:
            db.session.commit()
        except Exception as commit_error:
            db.session.rollback()
            # Check if error is due to missing columns
            error_str = str(commit_error).lower()
            if 'is_blocked' in error_str or 'blocked_at' in error_str or 'blocked_reason' in error_str or 'no such column' in error_str:  # noqa: E501
                return jsonify({
                    "error": "Blocking feature requires database migration",
                    "details": "Please run: flask db migrate -m 'Add User blocking fields and Penalty model' && flask db upgrade"  # noqa: E501
                }), 500
            raise  # Re-raise if it's a different error

        blocked_at = getattr(student, 'blocked_at', datetime.now(timezone.utc))
        return jsonify({
            "msg": "Registration blocked successfully",
            "student_id": student_id,
            "blocked_at": blocked_at.isoformat() if blocked_at else datetime.now(timezone.utc).isoformat(),
            "block_type": block_type
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error blocking student: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to block student", "details": str(e)}), 500


# ============================================================================
# ENDPOINT: POST /api/finance/action/bulk-reminder
# Description: Send reminders to multiple students


# ============================================================================
@finance_bp.route("/action/bulk-reminder", methods=["POST"])
@jwt_required()
@require_admin
def bulk_reminder():
    """
    Send reminders to multiple students (alyan's modification).

    Request Body:
    {
        "student_ids": [1, 2, 3, 4, 5],
        "message_template": "default",
        "contact_method": "EMAIL"
    }
    // Or send to all unpaid:
    {
        "student_ids": "all",
        "message_template": "default",
        "contact_method": "EMAIL"
    }

    Returns:
    {
        "msg": "Bulk reminders sent successfully",
        "sent_count": 5,
        "failed_count": 0,
        "notifications_created": 5,
        "details": [
            { "student_id": 1, "status": "sent" },
            { "student_id": 2, "status": "sent" }
        ]
    }
    """
    try:
        from flask_jwt_extended import get_jwt_identity

        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400

        student_ids_input = data.get('student_ids', [])
        message_template = data.get('message_template', 'default')
        contact_method = data.get('contact_method', 'EMAIL')

        # Get list of student IDs
        if student_ids_input == "all":
            # Get all unpaid students
            students = User.query.filter(
                User.is_admin is False,
                User.dues_balance > 0
            ).all()
            student_ids = [s.id for s in students]
        elif isinstance(student_ids_input, list):
            student_ids = student_ids_input
        else:
            return jsonify({"error": "student_ids must be a list or 'all'"}), 400

        if not student_ids:
            return jsonify({"error": "No students to send reminders to"}), 400

        # Get current admin user
        admin_id = get_jwt_identity()
        if not admin_id:
            return jsonify({"error": "Authentication required"}), 401

        sent_count = 0
        failed_count = 0
        notifications_created = 0
        details = []

        for student_id in student_ids:
            try:
                student = User.query.get(student_id)
                if not student or student.is_admin:
                    details.append({"student_id": student_id, "status": "failed", "reason": "Student not found"})
                    failed_count += 1
                    continue

                # Get dues balance safely
                dues_balance = float(student.dues_balance) if student.dues_balance else 0.0

                # Create notification
                message = f"Reminder: You have outstanding dues of ${dues_balance:.2f}. Please make a payment to avoid penalties."  # noqa: E501
                if message_template == "urgent":
                    message = f"URGENT: You have outstanding dues of ${dues_balance:.2f}. Payment is overdue. Please contact the finance office immediately."  # noqa: E501

                notification = Notification(
                    student_id=student_id,
                    notification_type='PAYMENT_REMINDER',  # alyan's modification: Use notification_type instead of type
                    message=message,
                    is_read=False
                )
                db.session.add(notification)
                notifications_created += 1

                # Log action (alyan's modification: Use correct ActionLog fields)
                try:
                    action_log = ActionLog(
                        student_id=student_id,
                        action_type='BULK_REMINDER',
                        action_description=f"Sent {contact_method} reminder to student {student.username} (ID: {student_id}). Template: {message_template}",  # noqa: E501
                        performed_by=admin_id
                    )
                    db.session.add(action_log)
                except Exception as log_error:
                    # If ActionLog fails, continue without logging
                    current_app.logger.warning(f"Failed to log action for student {student_id}: {str(log_error)}")

                details.append({"student_id": student_id, "status": "sent"})
                sent_count += 1

            except Exception as e:
                current_app.logger.error(f"Error sending reminder to student {student_id}: {str(e)}", exc_info=True)
                details.append({"student_id": student_id, "status": "failed", "reason": str(e)})
                failed_count += 1

        try:
            db.session.commit()
        except Exception as commit_error:
            db.session.rollback()
            current_app.logger.error(f"Error committing bulk reminders: {str(commit_error)}", exc_info=True)
            return jsonify({
                "error": "Failed to save reminders",
                "details": str(commit_error),
                "partial_results": {
                    "sent_count": sent_count,
                    "failed_count": failed_count,
                    "notifications_created": notifications_created
                }
            }), 500

        return jsonify({
            "msg": "Bulk reminders sent successfully",
            "sent_count": sent_count,
            "failed_count": failed_count,
            "notifications_created": notifications_created,
            "details": details
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error sending bulk reminders: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to send bulk reminders", "details": str(e)}), 500


# ============================================================================
# ENDPOINT: POST /api/finance/action/bulk-penalty
# Description: Apply penalties to multiple students


# ============================================================================
@finance_bp.route("/action/bulk-penalty", methods=["POST"])
@jwt_required()
@require_admin
def bulk_penalty():
    """
    Apply penalties to multiple students (alyan's modification).

    Request Body:
    {
        "student_ids": [2, 3, 5],
        "penalty_amount": 50,
        "penalty_type": "LATE_FEE"
    }

    Returns:
    {
        "msg": "Bulk penalties applied successfully",
        "applied_count": 3,
        "total_penalties": 150,
        "details": [
            { "student_id": 2, "penalty_amount": 50, "new_dues": 11250 },
            { "student_id": 3, "penalty_amount": 50, "new_dues": 8550 }
        ]
    }
    """
    try:
        from flask_jwt_extended import get_jwt_identity

        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400

        student_ids = data.get('student_ids', [])
        penalty_amount = data.get('penalty_amount')
        penalty_type = data.get('penalty_type', 'LATE_FEE')

        if not student_ids or not isinstance(student_ids, list):
            return jsonify({"error": "student_ids must be a non-empty list"}), 400

        if not penalty_amount or penalty_amount <= 0:
            return jsonify({"error": "penalty_amount must be a positive number"}), 400

        # Get current admin user
        admin_id = get_jwt_identity()

        applied_count = 0
        total_penalties = 0
        details = []

        for student_id in student_ids:
            try:
                student = User.query.get(student_id)
                if not student or student.is_admin:
                    details.append({"student_id": student_id, "status": "failed", "reason": "Student not found"})
                    continue

                # Only apply to students who are overdue (have dues > 0)
                if student.dues_balance <= 0:
                    details.append({"student_id": student_id, "status": "skipped", "reason": "No outstanding dues"})
                    continue

                # Create penalty record
                penalty = Penalty(
                    student_id=student_id,
                    amount=float(penalty_amount),
                    penalty_type=penalty_type,
                    applied_by=admin_id,
                    notes="Bulk penalty application"
                )
                db.session.add(penalty)

                # Update student's dues balance
                old_dues = float(student.dues_balance)
                student.dues_balance = old_dues + float(penalty_amount)

                # Create notification for student
                notification = Notification(
                    student_id=student_id,
                    notification_type='PENALTY_APPLIED',  # alyan's modification: Use notification_type instead of type
                    message=f"Late fee penalty of ${penalty_amount} has been applied to your account.",
                    is_read=False
                )
                db.session.add(notification)

                # Log action (alyan's modification: Use correct ActionLog fields)
                action_log = ActionLog(
                    student_id=student_id,
                    action_type='BULK_PENALTY',
                    action_description=f"Applied ${penalty_amount} penalty ({penalty_type}) to student {student.username} (ID: {student_id})",  # noqa: E501
                    performed_by=admin_id
                )
                db.session.add(action_log)

                details.append({
                    "student_id": student_id,
                    "penalty_amount": float(penalty_amount),
                    "new_dues": float(student.dues_balance)
                })
                applied_count += 1
                total_penalties += float(penalty_amount)

            except Exception as e:
                current_app.logger.error(f"Error applying penalty to student {student_id}: {str(e)}")
                details.append({"student_id": student_id, "status": "failed", "reason": str(e)})

        db.session.commit()

        return jsonify({
            "msg": "Bulk penalties applied successfully",
            "applied_count": applied_count,
            "total_penalties": total_penalties,
            "details": details
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error applying bulk penalties: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to apply bulk penalties", "details": str(e)}), 500


# ============================================================================
# ENDPOINT: POST /api/finance/action/bulk-block
# Description: Block registrations for multiple students


# ============================================================================
@finance_bp.route("/action/bulk-block", methods=["POST"])
@jwt_required()
@require_admin
def bulk_block():
    """
    Block registrations for multiple students (alyan's modification).

    Request Body:
    {
        "student_ids": [3, 5],
        "block_type": "REGISTRATION",
        "reason": "Outstanding dues over 7 days"
    }

    Returns:
    {
        "msg": "Bulk registrations blocked successfully",
        "blocked_count": 2,
        "details": [
            { "student_id": 3, "blocked_at": "2025-12-10T15:30:00" },
            { "student_id": 5, "blocked_at": "2025-12-10T15:30:00" }
        ]
    }
    """
    try:
        from flask_jwt_extended import get_jwt_identity

        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400

        student_ids = data.get('student_ids', [])
        block_type = data.get('block_type', 'REGISTRATION')
        reason = data.get('reason', 'Outstanding dues over 7 days')

        if not student_ids or not isinstance(student_ids, list):
            return jsonify({"error": "student_ids must be a non-empty list"}), 400

        # Get current admin user
        admin_id = get_jwt_identity()

        blocked_count = 0
        details = []

        for student_id in student_ids:
            try:
                student = User.query.get(student_id)
                if not student or student.is_admin:
                    details.append({"student_id": student_id, "status": "failed", "reason": "Student not found"})
                    continue

                # Block student (alyan's modification: Use setattr to safely set fields)
                setattr(student, 'is_blocked', True)
                setattr(student, 'blocked_at', datetime.now(timezone.utc))
                setattr(student, 'blocked_reason', reason)

                # Create notification for student
                notification = Notification(
                    student_id=student_id,
                    notification_type='REGISTRATION_BLOCKED',
                    # alyan's modification: Use notification_type instead of type
                    message=f"Your registration has been blocked due to: {reason}",
                    is_read=False
                )
                db.session.add(notification)

                # Log action (alyan's modification: Use correct ActionLog fields)
                action_log = ActionLog(
                    student_id=student_id,
                    action_type='BULK_BLOCK',
                    action_description=f"Blocked registration ({block_type}) for student {student.username} (ID: {student_id}): {reason}",  # noqa: E501
                    performed_by=admin_id
                )
                db.session.add(action_log)

                blocked_at = getattr(student, 'blocked_at', datetime.now(timezone.utc))
                details.append({
                    "student_id": student_id,
                    "blocked_at": blocked_at.isoformat() if blocked_at else datetime.now(timezone.utc).isoformat()
                })
                blocked_count += 1

            except Exception as e:
                current_app.logger.error(f"Error blocking student {student_id}: {str(e)}")
                details.append({"student_id": student_id, "status": "failed", "reason": str(e)})

        try:
            db.session.commit()
        except Exception as commit_error:
            db.session.rollback()
            # Check if error is due to missing columns
            error_str = str(commit_error).lower()
            if 'is_blocked' in error_str or 'blocked_at' in error_str or 'blocked_reason' in error_str or 'no such column' in error_str:  # noqa: E501
                return jsonify({
                    "error": "Blocking feature requires database migration",
                    "details": "Please run: flask db migrate -m 'Add User blocking fields and Penalty model' && flask db upgrade"  # noqa: E501
                }), 500
            raise  # Re-raise if it's a different error

        return jsonify({
            "msg": "Bulk registrations blocked successfully",
            "blocked_count": blocked_count,
            "details": details
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error blocking bulk registrations: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to block bulk registrations", "details": str(e)}), 500
