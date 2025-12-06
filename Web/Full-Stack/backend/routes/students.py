from flask import Blueprint, request, jsonify, current_app
from models import db, User, Course, Enrollment, Payment, Notification
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

students_bp = Blueprint("students", __name__)


# ============================================================================
# ENDPOINT: POST /api/students/enroll
# Description: Course registration with automatic dues calculation
# ============================================================================
@students_bp.route("/enroll", methods=["POST"])
@jwt_required()
def enroll_course():
    """
    Enroll a student in a course. Automatically calculates and updates dues_balance.
    
    Request Body:
    {
        "course_id": 1
    }
    
    Returns:
    {
        "msg": "Successfully enrolled in course",
        "enrollment_id": 1,
        "course_name": "Computer Science",
        "course_fee": 5000.0,
        "updated_dues_balance": 5000.0
    }
    """
    try:
        identity = get_jwt_identity()
        if not identity:
            return jsonify({"error": "Invalid or missing user identity"}), 401
            
        # The identity is the user ID as a string
        student_id = int(identity)  # Convert string ID to integer
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        course_id = data.get("course_id")
        if not course_id:
            return jsonify({"error": "course_id is required"}), 400
        
        # Verify student exists
        student = User.query.get(student_id)
        if not student:
            return jsonify({"error": "Student not found"}), 404
        
        # Verify course exists
        course = Course.query.get(course_id)
        if not course:
            return jsonify({"error": "Course not found"}), 404
        
        # Check if already enrolled
        existing_enrollment = Enrollment.query.filter_by(
            student_id=student_id,
            course_id=course_id
        ).first()
        
        if existing_enrollment:
            return jsonify({"error": "Student already enrolled in this course"}), 409
        
        # Start transaction
        try:
            # Create enrollment record
            enrollment = Enrollment(
                student_id=student_id,
                course_id=course_id,
                course_fee=course.total_fee,
                status='ACTIVE'
            )
            db.session.add(enrollment)
            
            # Update student's dues_balance
            student.dues_balance += course.total_fee
            student.updated_at = datetime.utcnow()
            
            # Create notification for student
            notification = Notification(
                student_id=student_id,
                notification_type='ENROLLMENT',
                message=f"You have successfully enrolled in {course.name}. Course fee: ${course.total_fee:.2f}"
            )
            db.session.add(notification)
            
            # Create notification for finance department
            finance_notification = Notification(
                student_id=student_id,
                notification_type='FINANCE_ALERT',
                message=f"Student {student.username} enrolled in {course.name}. New dues: ${student.dues_balance:.2f}"
            )
            db.session.add(finance_notification)
            
            db.session.commit()
            
            return jsonify({
                "msg": "Successfully enrolled in course",
                "enrollment_id": enrollment.id,
                "course_name": course.name,
                "course_fee": course.total_fee,
                "updated_dues_balance": student.dues_balance
            }), 201
            
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": "Failed to process enrollment due to a database error"}), 500
    
    except Exception as e:
        return jsonify({"error": "An unexpected error occurred while processing your request"}), 500


# ============================================================================
# ENDPOINT: POST /api/students/pay
# Description: Record student payment and update dues_balance
# ============================================================================
@students_bp.route("/pay", methods=["POST"])
@jwt_required()
def make_payment():
    """
    Record a student payment. Updates Payment model and reduces dues_balance atomically.
    
    Request Body:
    {
        "amount": 1000.0,
        "payment_method": "ONLINE",
        "reference_number": "TXN123456"
    }
    
    Returns:
    {
        "msg": "Payment recorded successfully",
        "payment_id": 1,
        "amount": 1000.0,
        "remaining_dues": 4000.0,
        "payment_date": "2025-12-05T15:30:00"
    }
    """
    try:
        identity = get_jwt_identity()
        if not identity:
            return jsonify({"error": "Invalid or missing user identity"}), 401
            
        # The identity is the user ID as a string
        student_id = int(identity)  # Convert string ID to integer
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No payment data provided"}), 400
            
        amount = data.get("amount")
        payment_method = data.get("payment_method", "MANUAL")
        reference_number = data.get("reference_number")
        notes = data.get("notes", "")
        
        # Validate amount
        if not amount or not isinstance(amount, (int, float)) or amount <= 0:
            return jsonify({"error": "Amount must be a number greater than 0"}), 400
        
        # Verify student exists
        student = User.query.get(student_id)
        if not student:
            return jsonify({"error": "Student not found"}), 404
        
        # Check if payment exceeds dues
        if amount > student.dues_balance:
            error_msg = f"Payment amount (${amount:.2f}) exceeds outstanding dues (${student.dues_balance:.2f})"
            return jsonify({"error": error_msg}), 400
        
        # Start transaction
        try:
            # Create payment record
            payment = Payment(
                student_id=student_id,
                amount=amount,
                payment_method=payment_method,
                reference_number=reference_number,
                status='RECEIVED',
                notes=notes
            )
            db.session.add(payment)
            
            # Update student's dues_balance
            student.dues_balance -= amount
            student.updated_at = datetime.utcnow()
            
            # Create notification for student
            notification = Notification(
                student_id=student_id,
                notification_type='PAYMENT_RECEIVED',
                message=f"Payment of ${amount:.2f} received. Remaining dues: ${student.dues_balance:.2f}"
            )
            db.session.add(notification)
            
            db.session.commit()
            
            return jsonify({
                "msg": "Payment recorded successfully",
                "payment_id": payment.id,
                "amount": amount,
                "remaining_dues": student.dues_balance,
                "payment_date": payment.payment_date.isoformat()
            }), 201
            
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": "Failed to process payment due to a database error"}), 500
    
    except Exception as e:
        return jsonify({"error": "An unexpected error occurred while processing your payment"}), 500


# ============================================================================
# ENDPOINT: GET /api/students/status
# Description: Retrieve enrollment and current dues_balance
# ============================================================================
@students_bp.route("/status", methods=["GET"])
@jwt_required()
def get_student_status():
    """
    Retrieve student's enrollment status and current dues_balance.
    
    Returns:
    {
        "user_id": 1,
        "username": "student_username",
        "email": "student@example.com",
        "dues_balance": 4000.0,
        "enrollments": [
            {
                "id": 1,
                "course_id": 1,
                "course_name": "Computer Science",
                "course_fee": 5000.0,
                "enrollment_date": "2025-12-05T10:00:00",
                "status": "ACTIVE"
            }
        ],
        "total_enrolled_courses": 1,
        "total_course_fees": 5000.0
    }
    """
    identity = get_jwt_identity()
    if not identity:
        return jsonify({"error": "Invalid or missing user identity"}), 401
        
    try:
        # Convert identity (user ID as string) to integer
        student_id = int(identity)
        
        # Fetch student
        student = User.query.get(student_id)
        if not student:
            return jsonify({"error": "Student not found"}), 404
        
        # Fetch enrollments
        enrollments = Enrollment.query.filter_by(student_id=student_id).all()
        enrollment_list = [
            {
                "id": e.id,
                "course_id": e.course_id,
                "course_name": e.course.name,
                "course_fee": e.course_fee,
                "enrollment_date": e.enrollment_date.isoformat(),
                "status": e.status
            }
            for e in enrollments if hasattr(e, 'course') and e.course is not None
        ]
        
        # Calculate totals
        total_course_fees = sum(e.course_fee for e in enrollments if hasattr(e, 'course_fee'))
        
        return jsonify({
            "user_id": student.id,
            "username": student.username,
            "email": student.email,
            "dues_balance": student.dues_balance,
            "enrollments": enrollment_list,
            "total_enrolled_courses": len(enrollments),
            "total_course_fees": total_course_fees
        }), 200
    
    except ValueError:
        return jsonify({"error": "Invalid user identity format"}), 400
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve status: {str(e)}"}), 500


# ============================================================================
# ENDPOINT: GET /api/students/payments
# Description: Retrieve payment history for the student
# ============================================================================
@students_bp.route("/payments", methods=["GET"])
@jwt_required()
def get_payment_history():
    """
    Retrieve payment history for the authenticated student.
    
    Returns:
    {
        "user_id": 1,
        "username": "student_username",
        "total_paid": 1000.0,
        "payments": [
            {
                "id": 1,
                "amount": 1000.0,
                "payment_date": "2025-12-05T15:30:00",
                "payment_method": "ONLINE",
                "status": "RECEIVED",
                "reference_number": "TXN123456"
            }
        ]
    }
    """
    identity = get_jwt_identity()
    if not identity:
        return jsonify({"error": "Invalid or missing user identity"}), 401
        
    try:
        # Convert identity (user ID as string) to integer
        student_id = int(identity)
        
        # Fetch student
        student = User.query.get(student_id)
        if not student:
            return jsonify({"error": "Student not found"}), 404
        
        # Fetch payments
        payments = Payment.query.filter_by(student_id=student_id).order_by(
            Payment.payment_date.desc()
        ).all()
        
        payment_list = [
            {
                "id": p.id,
                "amount": p.amount,
                "payment_date": p.payment_date.isoformat() if p.payment_date else None,
                "payment_method": p.payment_method,
                "status": p.status,
                "reference_number": p.reference_number
            }
            for p in payments
        ]
        
        total_paid = sum(p.amount for p in payments if hasattr(p, 'amount') and p.amount is not None)
        
        return jsonify({
            "user_id": student.id,
            "username": student.username,
            "total_paid": total_paid,
            "payments": payment_list
        }), 200
    
    except ValueError:
        return jsonify({"error": "Invalid user identity format"}), 400
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve payments: {str(e)}"}), 500
