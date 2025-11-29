from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from passlib.hash import pbkdf2_sha256 as sha256

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(200), unique=True, nullable=True)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # STUDENT | FINANCE | ADMIN
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    profile = db.relationship('StudentProfile', uselist=False, back_populates='user')

    @staticmethod
    def generate_hash(password):
        return sha256.hash(password)

    @staticmethod
    def verify_hash(password, hash_):
        return sha256.verify(password, hash_)

class StudentProfile(db.Model):
    __tablename__ = "student_profiles"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    student_id = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(150))
    faculty = db.Column(db.String(120))
    year = db.Column(db.String(10))
    fees_status = db.Column(db.String(20), default="UNPAID")  # UNPAID / PARTIAL / PAID

    user = db.relationship('User', back_populates='profile')
    transactions = db.relationship('Transaction', back_populates='student')

class Transaction(db.Model):
    __tablename__ = "transactions"
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student_profiles.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    type = db.Column(db.String(50), nullable=False)  # payment/refund
    date = db.Column(db.DateTime, default=datetime.utcnow)
    recorded_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    status = db.Column(db.String(20), default="RECEIVED")  # RECEIVED / PENDING / RECONCILED

    student = db.relationship('StudentProfile', back_populates='transactions')
