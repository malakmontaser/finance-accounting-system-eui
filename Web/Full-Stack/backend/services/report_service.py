from models import db, StudentProfile, Transaction
from sqlalchemy import func


class ReportService:

    @staticmethod
    def finance_summary():
        total_students = StudentProfile.query.count()
        total_payments = db.session.query(
            func.sum(Transaction.amount)
        ).filter(Transaction.type == "payment").scalar() or 0

        unpaid = StudentProfile.query.filter_by(fees_status="UNPAID").count()
        partial = StudentProfile.query.filter_by(fees_status="PARTIAL").count()
        paid = StudentProfile.query.filter_by(fees_status="PAID").count()

        return {
            "total_students": total_students,
            "total_payments": float(total_payments),
            "unpaid_students": unpaid,
            "partial_students": partial,
            "paid_students": paid
        }

    @staticmethod
    def faculty_report():
        data = db.session.query(
            StudentProfile.faculty,
            func.count(StudentProfile.id)
        ).group_by(StudentProfile.faculty).all()

        return [{"faculty": f, "student_count": c} for f, c in data]
