from app import create_app, db
from models import Payment, User, Enrollment, Course

def clear_payments_and_reset_balance():
    app = create_app()
    with app.app_context():
        print("Clearing all payments...")
        try:
            num_deleted = db.session.query(Payment).delete()
            print(f"Deleted {num_deleted} payment records.")
        except Exception as e:
            print(f"Error decreasing payments: {e}")
            db.session.rollback()
            return

        print("Recalculating student balances...")
        try:
            students = User.query.filter_by(is_admin=False).all()
            
            for student in students:
                # Calculate total course fees from enrollments
                total_fees = 0
                enrollments = Enrollment.query.filter_by(student_id=student.id).all()
                for enrollment in enrollments:
                    # Access course fee directly if relationship exists, or query it
                    # Assuming Enrollment has no direct fee relation, using course_id
                     course = Course.query.get(enrollment.course_id)
                     if course:
                        total_fees += float(course.total_fee)
                
                # Reset balance to total fees (since 0 payments exist)
                student.dues_balance = total_fees
                print(f"Reset balance for {student.username}: ${total_fees}")
            
            db.session.commit()
            print("Successfully cleared payments and reset balances.")
        except Exception as e:
             print(f"Error resetting balances: {e}")
             db.session.rollback()

if __name__ == "__main__":
    clear_payments_and_reset_balance()
