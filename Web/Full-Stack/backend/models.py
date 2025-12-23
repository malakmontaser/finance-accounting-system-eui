from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone
from passlib.hash import pbkdf2_sha256 as sha256

db = SQLAlchemy()

# ============================================================================
# FACULTY MODEL - Represents different faculties in the university
# ============================================================================
class Faculty(db.Model):
    __tablename__ = "faculties"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), unique=True, nullable=False)  # e.g., 'Computer and Information Sciences'
    code = db.Column(db.String(10), unique=True, nullable=False)   # e.g., 'CIS', 'DAD', 'BI', 'ENG'
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), 
                         onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    students = db.relationship('User', back_populates='faculty', foreign_keys='User.faculty_id')
    courses = db.relationship('Course', back_populates='faculty')

    def to_dict(self):
        """Convert faculty to dictionary representation."""
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'description': self.description or '',
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# ============================================================================
# USER MODEL - Represents both students and admin users
# ============================================================================
class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(200), unique=True, nullable=True)
    first_name = db.Column(db.String(100), nullable=False, default='')
    last_name = db.Column(db.String(100), nullable=False, default='')
    password_hash = db.Column(db.String(200), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)  # True for Finance/Admin users
    faculty_id = db.Column(db.Integer, db.ForeignKey('faculties.id'), nullable=True)  # Nullable for admin users
    dues_balance = db.Column(db.Float, default=0.0)  # Total outstanding dues
    is_blocked = db.Column(db.Boolean, default=False)  # alyan's modification: Block registration due to unpaid dues
    blocked_at = db.Column(db.DateTime, nullable=True)  # alyan's modification: When student was blocked
    blocked_reason = db.Column(db.String(255), nullable=True)  # alyan's modification: Reason for blocking
    payment_due_date = db.Column(db.DateTime, nullable=True)  # alyan's modification: Payment due date (calculated from enrollment)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), 
                         onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    faculty = db.relationship('Faculty', back_populates='students', foreign_keys=[faculty_id])
    enrollments = db.relationship('Enrollment', back_populates='student', foreign_keys='Enrollment.student_id')
    payments = db.relationship('Payment', back_populates='student', foreign_keys='Payment.student_id')
    notifications = db.relationship('Notification', back_populates='student', foreign_keys='Notification.student_id')

    # Password hashing methods
    @staticmethod
    def generate_hash(password):
        """Generate a password hash using PBKDF2-SHA256."""
        return sha256.hash(password)
    
    @staticmethod
    def verify_hash(password, hash_):
        """Verify a password against its hash."""
        return sha256.verify(password, hash_)
        
    def set_password(self, password):
        """Set the user's password."""
        self.password_hash = self.generate_hash(password)
        
    def verify_password(self, password):
        """Verify the user's password."""
        return self.verify_hash(password, self.password_hash)

    def to_dict(self, include_faculty=False):
        """Convert user to dictionary representation.
        
        Args:
            include_faculty (bool): Whether to include faculty information
        """
        result = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'is_admin': self.is_admin,
            'dues_balance': self.dues_balance,
            'is_blocked': self.is_blocked,  # alyan's modification
            'blocked_at': self.blocked_at.isoformat() if self.blocked_at else None,  # alyan's modification
            'blocked_reason': self.blocked_reason,  # alyan's modification
            'payment_due_date': self.payment_due_date.isoformat() if self.payment_due_date else None,  # alyan's modification
            'created_at': self.created_at.isoformat()
        }
        
        if include_faculty and self.faculty:
            result['faculty'] = self.faculty.to_dict()
        
        return result


# ============================================================================
# COURSE MODEL - Represents academic courses with fees
# ============================================================================
class Course(db.Model):
    __tablename__ = "courses"
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.String(50), nullable=False)  # e.g., 'ENG101', 'CS201'
    name = db.Column(db.String(150), nullable=False)  # e.g., 'English', 'Computer Science', 'Data Analytics'
    credits = db.Column(db.Integer, nullable=False)  # Credit hours
    total_fee = db.Column(db.Float, nullable=False)  # Total fee for the course
    faculty_id = db.Column(db.Integer, db.ForeignKey('faculties.id'), nullable=False)
    description = db.Column(db.Text, nullable=True)
    faculty = db.Column(db.String(100), nullable=True)  # alyan's modification: Faculty/Department name (Engineering, Computer Science, Digital Arts, Business Informatics)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), 
                         onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    faculty = db.relationship('Faculty', back_populates='courses')
    enrollments = db.relationship('Enrollment', back_populates='course', cascade='all, delete-orphan')

    def to_dict(self, include_faculty=False):
        """Convert course to dictionary representation.
        
        Args:
            include_faculty (bool): Whether to include faculty information
        """
        result = {
            'id': self.id,
            'course_id': self.course_id,
            'name': self.name,
            'credits': self.credits,
            'total_fee': self.total_fee,
            'description': self.description,
            'faculty': self.faculty,  # alyan's modification
            'created_at': self.created_at.isoformat()
        }
        
        if include_faculty and self.faculty:
            result['faculty'] = self.faculty.to_dict()
        
        return result


# ============================================================================
# ENROLLMENT MODEL - Association table linking students to courses
# ============================================================================
class Enrollment(db.Model):
    __tablename__ = "enrollments"
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    enrollment_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    status = db.Column(db.String(20), default='ACTIVE')  # ACTIVE, COMPLETED, DROPPED
    course_fee = db.Column(db.Float, nullable=False)  # Fee at time of enrollment (snapshot)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    student = db.relationship('User', back_populates='enrollments', foreign_keys=[student_id])
    course = db.relationship('Course', back_populates='enrollments')

    __table_args__ = (
        db.UniqueConstraint('student_id', 'course_id', name='unique_student_course'),
        db.Index('idx_enrollment_student', 'student_id'),
        db.Index('idx_enrollment_course', 'course_id')
    )

    def to_dict(self):
        """Convert enrollment to dictionary representation."""
        return {
            'id': self.id,
            'student_id': self.student_id,
            'course_id': self.course_id,
            'course_name': self.course.name,
            'course_fee': self.course_fee,
            'enrollment_date': self.enrollment_date.isoformat(),
            'status': self.status
        }


# ============================================================================
# PAYMENT MODEL - Records all payment transactions
# ============================================================================
class Payment(db.Model):
    __tablename__ = "payments"
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    payment_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    payment_method = db.Column(db.String(50), default='MANUAL')  # MANUAL, BANK_TRANSFER, ONLINE
    status = db.Column(db.String(20), default='RECEIVED')  # RECEIVED, PENDING, RECONCILED
    reference_number = db.Column(db.String(100), nullable=True)  # For external payments
    proof_document = db.Column(db.String(255), nullable=True)  # Path to uploaded file
    recorded_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Admin who recorded it
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    student = db.relationship('User', back_populates='payments', foreign_keys=[student_id])
    recorded_by_user = db.relationship('User', foreign_keys=[recorded_by])

    def to_dict(self):
        """Convert payment to dictionary representation."""
        return {
            'id': self.id,
            'student_id': self.student_id,
            'amount': self.amount,
            'payment_date': self.payment_date.isoformat(),
            'payment_method': self.payment_method,
            'status': self.status,
            'reference_number': self.reference_number,
            'proof_document': self.proof_document,
            'notes': self.notes,
            'created_at': self.created_at.isoformat()
        }


# ============================================================================
# NOTIFICATION MODEL - Tracks key system events and notifications
# ============================================================================
class Notification(db.Model):
    __tablename__ = "notifications"
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    notification_type = db.Column(db.String(100), nullable=False)  # e.g., 'REGISTRATION', 'PAYMENT_RECEIVED', 'CONTACT_REQUEST'
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    action_date = db.Column(db.DateTime, nullable=True)  # Date of action (e.g., when contacted)

    # Relationships
    student = db.relationship('User', back_populates='notifications', foreign_keys=[student_id])

    def to_dict(self):
        """Convert notification to dictionary representation."""
        return {
            'id': self.id,
            'student_id': self.student_id,
            'notification_type': self.notification_type,
            'message': self.message,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat(),
            'action_date': self.action_date.isoformat() if self.action_date else None
        }


# ============================================================================
# ACTION LOG MODEL - Tracks admin actions on student accounts
# ============================================================================
class ActionLog(db.Model):
    __tablename__ = "action_logs"
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action_type = db.Column(db.String(100), nullable=False)  # e.g., 'CONTACT_REQUEST', 'PAYMENT_RECORDED', 'ENROLLMENT'
    action_description = db.Column(db.Text, nullable=False)
    performed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Admin who performed action
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    student = db.relationship('User', foreign_keys=[student_id])
    performed_by_user = db.relationship('User', foreign_keys=[performed_by])

    def to_dict(self):
        """Convert action log to dictionary representation."""
        return {
            'id': self.id,
            'student_id': self.student_id,
            'action_type': self.action_type,
            'action_description': self.action_description,
            'performed_by': self.performed_by,
            'created_at': self.created_at.isoformat()
        }


# ============================================================================
# FEE STRUCTURE MODEL - Represents fee categories and items (alyan's modification)
# ============================================================================
class FeeStructure(db.Model):
    __tablename__ = "fee_structures"
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(50), nullable=False)  # 'tuition', 'bus', 'other'
    name = db.Column(db.String(100), nullable=False)  # e.g., 'Per Credit Hour', 'Registration Fee'
    amount = db.Column(db.Float, default=0)
    is_per_credit = db.Column(db.Boolean, default=False)  # If true, multiply by credit hours
    is_active = db.Column(db.Boolean, default=True)
    display_order = db.Column(db.Integer, default=0)  # For ordering items
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    def to_dict(self):
        """Convert fee structure to dictionary representation."""
        return {
            'id': self.id,
            'category': self.category,
            'name': self.name,
            'amount': self.amount,
            'is_per_credit': self.is_per_credit,
            'is_active': self.is_active,
            'display_order': self.display_order,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


# ============================================================================
# BANK TRANSACTION MODEL - Represents bank transactions for reconciliation (alyan's modification)
# ============================================================================
class BankTransaction(db.Model):
    __tablename__ = "bank_transactions"
    id = db.Column(db.Integer, primary_key=True)
    bank_ref = db.Column(db.String(100), unique=True, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    transaction_date = db.Column(db.DateTime, nullable=False)
    bank_description = db.Column(db.String(255))
    status = db.Column(db.String(20), default='Unmatched')  # Matched, Unmatched, Pending
    matched_payment_id = db.Column(db.Integer, db.ForeignKey('payments.id'), nullable=True)
    matched_student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    matched_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    matched_at = db.Column(db.DateTime, nullable=True)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    matched_payment = db.relationship('Payment', foreign_keys=[matched_payment_id])
    matched_student = db.relationship('User', foreign_keys=[matched_student_id])
    matcher = db.relationship('User', foreign_keys=[matched_by])
    
    def to_dict(self):
        """Convert bank transaction to dictionary representation."""
        return {
            'id': self.id,
            'bank_ref': self.bank_ref,
            'amount': self.amount,
            'transaction_date': self.transaction_date.isoformat() if self.transaction_date else None,
            'bank_description': self.bank_description,
            'status': self.status,
            'matched_payment_id': self.matched_payment_id,
            'matched_student_id': self.matched_student_id,
            'matched_by': self.matched_by,
            'matched_at': self.matched_at.isoformat() if self.matched_at else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


# ============================================================================
# GENERATED REPORT MODEL - Stores generated financial reports (alyan's modification)
# ============================================================================
class GeneratedReport(db.Model):
    __tablename__ = "generated_reports"
    id = db.Column(db.String(20), primary_key=True)  # RPT-2025-001
    name = db.Column(db.String(200), nullable=False)
    report_type = db.Column(db.String(50), nullable=False)  # student_level, faculty_level, university_level, finance_overview
    parameters = db.Column(db.JSON)  # Store filter parameters as JSON
    file_path_pdf = db.Column(db.String(255), nullable=True)
    file_path_excel = db.Column(db.String(255), nullable=True)
    file_size_pdf = db.Column(db.Integer, nullable=True)  # Size in bytes
    file_size_excel = db.Column(db.Integer, nullable=True)
    generated_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    generated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = db.Column(db.DateTime, nullable=True)  # For auto-cleanup
    
    # Relationship
    generator = db.relationship('User', foreign_keys=[generated_by])
    
    def to_dict(self):
        """Convert generated report to dictionary representation."""
        return {
            'id': self.id,
            'name': self.name,
            'report_type': self.report_type,
            'report_type_display': self.get_report_type_display(),
            'parameters': self.parameters,
            'file_path_pdf': self.file_path_pdf,
            'file_path_excel': self.file_path_excel,
            'file_size_pdf': self.format_file_size(self.file_size_pdf) if self.file_size_pdf else None,
            'file_size_excel': self.format_file_size(self.file_size_excel) if self.file_size_excel else None,
            'available_formats': self.get_available_formats(),
            'generated_by': self.generated_by,
            'generated_at': self.generated_at.isoformat() if self.generated_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None
        }
    
    def get_report_type_display(self):
        """Get human-readable report type name."""
        type_map = {
            'student_level': 'Student Level',
            'faculty_level': 'Faculty Level',
            'university_level': 'University Level',
            'finance_overview': 'Finance Overview'
        }
        return type_map.get(self.report_type, self.report_type)
    
    def get_available_formats(self):
        """Get list of available file formats."""
        formats = []
        if self.file_path_pdf:
            formats.append('pdf')
        if self.file_path_excel:
            formats.append('excel')
        return formats
    
    @staticmethod
    def format_file_size(size_bytes):
        """Format file size in human-readable format."""
        if not size_bytes:
            return None
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.1f} TB"


# ============================================================================
# PENALTY MODEL - Tracks late fees and penalties applied to students (alyan's modification)
# ============================================================================
class Penalty(db.Model):
    __tablename__ = "penalties"
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    penalty_type = db.Column(db.String(50), nullable=False)  # LATE_FEE, etc.
    applied_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Admin who applied it
    applied_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    notes = db.Column(db.Text, nullable=True)
    
    # Relationships
    student = db.relationship('User', foreign_keys=[student_id])
    applied_by_user = db.relationship('User', foreign_keys=[applied_by])
    
    def to_dict(self):
        """Convert penalty to dictionary representation."""
        return {
            'id': self.id,
            'student_id': self.student_id,
            'amount': self.amount,
            'penalty_type': self.penalty_type,
            'applied_by': self.applied_by,
            'applied_at': self.applied_at.isoformat() if self.applied_at else None,
            'notes': self.notes
        }
