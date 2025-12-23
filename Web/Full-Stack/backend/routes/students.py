from flask import Blueprint, request, jsonify, current_app
from models import db, User, Course, Enrollment, Payment, Notification, ActionLog
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone
import os
from werkzeug.utils import secure_filename

students_bp = Blueprint("students", __name__)

ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ============================================================================
# ENDPOINT: POST /api/students/enroll
# Description: Enroll a student in a course
# ============================================================================
@students_bp.route("/enroll", methods=["POST"])
@jwt_required()
def enroll_course():
    try:
        identity = get_jwt_identity()
        if not identity:
            return jsonify({"error": "Invalid or missing user identity"}), 401
        
        student_id = int(identity)
        data = request.get_json()
        
        if not data or "course_id" not in data:
            return jsonify({"error": "Missing course_id"}), 400
            
        course_id = int(data["course_id"])
        
        # Verify student
        student = User.query.get(student_id)
        if not student:
            return jsonify({"error": "Student not found"}), 404
            
        # Verify course
        course = Course.query.get(course_id)
        if not course:
            return jsonify({"error": "Course not found"}), 404
            
        # Check if already enrolled
        existing_enrollment = Enrollment.query.filter_by(
            student_id=student_id, 
            course_id=course_id
        ).first()
        
        if existing_enrollment:
            return jsonify({"error": "Already enrolled in this course"}), 400
            
        # Create enrollment
        enrollment = Enrollment(
            student_id=student_id,
            course_id=course_id,
            course_fee=course.total_fee,
            status='ACTIVE'
        )
        
        # Update student dues
        student.dues_balance += course.total_fee
        student.updated_at = datetime.utcnow()
        
        # Create notification
        notification = Notification(
            student_id=student_id,
            notification_type='ENROLLMENT',
            message=f"You have successfully enrolled in {course.name}. Course fee: ${course.total_fee:.2f}"
        )
        
        # Log action
        action_log = ActionLog(
            student_id=student_id,
            action_type='ENROLLMENT',
            action_description=f"Student enrolled in {course.name} ({course.course_id})",
            performed_by=student_id # Self-enrollment
        )
        
        db.session.add(enrollment)
        db.session.add(notification)
        db.session.add(action_log)
        db.session.commit()
        
        return jsonify({
            "msg": "Enrollment successful",
            "enrollment_id": enrollment.id,
            "new_balance": student.dues_balance
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Enrollment failed: {str(e)}"}), 500


# ============================================================================
# ENDPOINT: DELETE /api/students/enroll/<course_id>
# Description: Drop a course for a student
# ============================================================================
@students_bp.route("/enroll/<int:course_id>", methods=["DELETE"])
@jwt_required()
def drop_course(course_id):
    try:
        identity = get_jwt_identity()
        if not identity:
            return jsonify({"error": "Invalid user identity"}), 401
            
        student_id = int(identity)
        
        # Verify student
        student = User.query.get(student_id)
        if not student:
            return jsonify({"error": "Student not found"}), 404
            
        # Verify enrollment
        enrollment = Enrollment.query.filter_by(
            student_id=student_id, 
            course_id=course_id
        ).first()
        
        if not enrollment:
            return jsonify({"error": "Enrollment not found"}), 404
            
        # Business Rule: Cannot drop if payments have been made?
        # Check if student has ANY payments 
        # (Strict rule from guide: "prevents dropping course if !hasPayments" - actually "prevents drop if hasPayments")
        payment_count = Payment.query.filter_by(student_id=student_id).count()
        if payment_count > 0:
            return jsonify({"error": "Cannot drop course after payments have been made. Please contact administration."}), 400
            
        # Capture course details for log before deleting
        course_name = enrollment.course.name if enrollment.course else "Unknown Course"
        course_fee = enrollment.course_fee
        
        # Update dues
        student.dues_balance -= course_fee
        if student.dues_balance < 0:
            student.dues_balance = 0
            
        # Create notification
        notification = Notification(
            student_id=student_id,
            notification_type='DROP_COURSE',
            message=f"You have dropped {course_name}. Balance adjusted by -${course_fee:.2f}"
        )
        
        db.session.delete(enrollment)
        db.session.add(notification)
        db.session.commit()
        
        return jsonify({
            "msg": "Course dropped successfully",
            "new_balance": student.dues_balance
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to drop course: {str(e)}"}), 500


# ============================================================================
# ENDPOINT: POST /api/students/pay
# Description: Record student payment and update dues_balance
# ============================================================================
@students_bp.route("/pay", methods=["POST"])
@jwt_required()
def make_payment():
    """
    Record a student payment. Updates Payment model.
    For ONLINE/MANUAL payments, updates dues_balance immediately.
    For BANK_TRANSFER, sets status to PENDING and does not update balance yet.
    """
    try:
        identity = get_jwt_identity()
        if not identity:
            return jsonify({"error": "Invalid or missing user identity"}), 401
            
        # The identity is the user ID as a string
        student_id = int(identity)  # Convert string ID to integer
        
        # Handle both JSON and FormData
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form
        
        if not data:
            return jsonify({"error": "No payment data provided"}), 400
            
        try:
            amount = float(data.get("amount", 0))
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid amount format"}), 400

        payment_method = data.get("payment_method", "MANUAL")
        reference_number = data.get("reference_number")
        notes = data.get("notes", "")
        
        # Validate amount
        if amount <= 0:
            return jsonify({"error": "Amount must be a number greater than 0"}), 400
        
        # Verify student exists
        student = User.query.get(student_id)
        if not student:
            return jsonify({"error": "Student not found"}), 404
        
        # Check if payment exceeds dues (only for immediate payments)
        # For pending payments, we allow it, but finance might reject it later
        if payment_method != 'BANK_TRANSFER' and amount > student.dues_balance:
            error_msg = f"Payment amount (${amount:.2f}) exceeds outstanding dues (${student.dues_balance:.2f})"
            return jsonify({"error": error_msg}), 400
        
        # Handle local timestamp from frontend if provided
        payment_date_str = data.get("payment_date")
        payment_date = datetime.now(timezone.utc)
        if payment_date_str:
            try:
                # Expecting ISO format from frontend
                payment_date = datetime.fromisoformat(payment_date_str.replace('Z', '+00:00'))
            except ValueError:
                pass # Fallback to now(timezone.utc)

        # Handle File Upload
        proof_document = None
        if 'proof_document' in request.files:
            file = request.files['proof_document']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                # Create unique filename: timestamp_studentID_filename
                # Use the payment_date for consistency in filename as well
                ts_filename = payment_date.strftime("%Y%m%d%H%M%S")
                filename = f"{ts_filename}_{student_id}_{filename}"
                
                upload_folder = os.path.join(current_app.root_path, 'uploads', 'payments')
                if not os.path.exists(upload_folder):
                    os.makedirs(upload_folder)
                    
                file_path = os.path.join(upload_folder, filename)
                file.save(file_path)
                
                # Store relative path in DB
                proof_document = os.path.join('uploads', 'payments', filename)
            elif file:
                return jsonify({"error": "Invalid file type. Allowed: pdf, png, jpg, jpeg"}), 400

        # Determine Status
        status = 'RECEIVED'
        if payment_method == 'BANK_TRANSFER':
            status = 'PENDING'

        # Start transaction
        try:
            # Create payment record
            payment = Payment(
                student_id=student_id,
                amount=amount,
                payment_method=payment_method,
                reference_number=reference_number,
                status=status,
                notes=notes,
                proof_document=proof_document,
                payment_date=payment_date
            )
            db.session.add(payment)
            
            # Update student's dues_balance ONLY if status is RECEIVED
            if status == 'RECEIVED':
                student.dues_balance -= amount
                student.updated_at = datetime.utcnow()
                
                notification_msg = f"Payment of ${amount:.2f} received. Remaining dues: ${student.dues_balance:.2f}"
            else:
                notification_msg = f"Payment of ${amount:.2f} via {payment_method} submitted for verification."
            
            # Create notification for student
            notification = Notification(
                student_id=student_id,
                notification_type='PAYMENT_RECEIVED' if status == 'RECEIVED' else 'PAYMENT_SUBMITTED',
                message=notification_msg
            )
            db.session.add(notification)
            
            db.session.commit()
            
            response_data = {
                "msg": "Payment recorded successfully" if status == 'RECEIVED' else "Payment submitted for verification",
                "payment_id": payment.id,
                "amount": amount,
                "status": status,
                "remaining_dues": student.dues_balance,
                "payment_date": payment.payment_date.isoformat()
            }
            
            if proof_document:
                response_data["proof_document"] = proof_document
                
            return jsonify(response_data), 201
            
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Failed to process payment: {str(e)}"}), 500
    
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500


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
                "credits": e.course.credits,
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
