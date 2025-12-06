from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone
from passlib.hash import pbkdf2_sha256 as sha256

db = SQLAlchemy()

# ============================================================================
# USER MODEL - Represents both students and admin users
# ============================================================================
class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(200), unique=True, nullable=True)
    password_hash = db.Column(db.String(200), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)  # True for Finance/Admin users
    dues_balance = db.Column(db.Float, default=0.0)  # Total outstanding dues
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    enrollments = db.relationship('Enrollment', back_populates='student', foreign_keys='Enrollment.student_id')
    payments = db.relationship('Payment', back_populates='student', foreign_keys='Payment.student_id')
    notifications = db.relationship('Notification', back_populates='student', foreign_keys='Notification.student_id')

    @staticmethod
    def generate_hash(password):
        """Generate a password hash using PBKDF2-SHA256."""
        return sha256.hash(password)

    @staticmethod
    def verify_hash(password, hash_):
        """Verify a password against its hash."""
        return sha256.verify(password, hash_)

    def to_dict(self):
        """Convert user to dictionary representation."""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'is_admin': self.is_admin,
            'dues_balance': self.dues_balance,
            'created_at': self.created_at.isoformat()
        }


# ============================================================================
# COURSE MODEL - Represents academic courses with fees
# ============================================================================
class Course(db.Model):
    __tablename__ = "courses"
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.String(50), unique=True, nullable=False)  # e.g., 'ENG101', 'CS201'
    name = db.Column(db.String(150), nullable=False)  # e.g., 'English', 'Computer Science', 'Data Analytics'
    credits = db.Column(db.Integer, nullable=False)  # Credit hours
    total_fee = db.Column(db.Float, nullable=False)  # Total fee for the course
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    enrollments = db.relationship('Enrollment', back_populates='course', cascade='all, delete-orphan')

    def to_dict(self):
        """Convert course to dictionary representation."""
        return {
            'id': self.id,
            'course_id': self.course_id,
            'name': self.name,
            'credits': self.credits,
            'total_fee': self.total_fee,
            'description': self.description,
            'created_at': self.created_at.isoformat()
        }


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
