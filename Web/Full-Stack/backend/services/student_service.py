from models import db, Transaction, StudentProfile

class PaymentService:

    @staticmethod
    def create_transaction(data, recorded_by):
        tx = Transaction(
            student_id=data["student_id"],
            amount=data["amount"],
            type=data["type"],
            recorded_by=recorded_by,
        )
        db.session.add(tx)
        db.session.commit()

        PaymentService.update_fee_status(data["student_id"])
        return tx

    @staticmethod
    def update_fee_status(student_id):
        student = StudentProfile.query.get(student_id)
        if not student:
            return

        total_paid = sum(t.amount for t in student.transactions if t.type == "payment")

        if total_paid == 0:
            student.fees_status = "UNPAID"
        elif total_paid < 10000:  # example threshold
            student.fees_status = "PARTIAL"
        else:
            student.fees_status = "PAID"

        db.session.commit()

    @staticmethod
    def get_by_student(student_id):
        return Transaction.query.filter_by(student_id=student_id)\
                                .order_by(Transaction.date.desc()).all()

    @staticmethod
    def get_all():
        return Transaction.query.order_by(Transaction.date.desc()).all()
