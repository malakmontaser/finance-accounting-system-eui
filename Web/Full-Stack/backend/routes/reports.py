from flask import Blueprint, jsonify
from models import db, StudentProfile, Transaction
from sqlalchemy import func

reports_bp = Blueprint("reports", __name__)

@reports_bp.route("/summary", methods=["GET"])
def summary():
    total_students = StudentProfile.query.count()
    total_payments = db.session.query(func.sum(Transaction.amount)).scalar() or 0
    return jsonify({"total_students": total_students, "total_payments": float(total_payments)})
