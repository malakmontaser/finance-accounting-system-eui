from flask import Blueprint, request, jsonify
from models import db, User, Payment, Enrollment, Notification, ActionLog
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone
from sqlalchemy import and_
from functools import wraps

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
        query = User.query.filter(User.dues_balance > 0, User.is_admin == False)
        
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
        students = User.query.filter(
            and_(User.dues_balance > 0, User.is_admin == False)
        ).order_by(User.dues_balance.desc()).all()
        
        # Categorize by dues amount
        critical = []  # > 5000
        moderate = []  # 1000 - 5000
        low = []       # < 1000
        
        detailed_report = []
        total_outstanding = 0
        
        for student in students:
            # Get enrollment details
            enrollments = Enrollment.query.filter_by(student_id=student.id).all()
            enrollment_details = [
                {
                    "course_name": e.course.name,
                    "course_fee": e.course_fee,
                    "enrollment_date": e.enrollment_date.isoformat()
                }
                for e in enrollments
            ]
            
            # Get payment history
            payments = Payment.query.filter_by(student_id=student.id).order_by(
                Payment.payment_date.desc()
            ).limit(5).all()
            
            student_data = {
                "user_id": student.id,
                "username": student.username,
                "email": student.email,
                "dues_balance": student.dues_balance,
                "enrollments": enrollment_details,
                "recent_payments": [
                    {
                        "amount": p.amount,
                        "payment_date": p.payment_date.isoformat(),
                        "payment_method": p.payment_method
                    }
                    for p in payments
                ]
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
        return jsonify({"error": f"Failed to generate report: {str(e)}"}), 500


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
            message=f"Finance department has contacted you regarding your outstanding dues of ${student.dues_balance:.2f}",
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
        students = User.query.filter(User.is_admin == False).all()
        
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
