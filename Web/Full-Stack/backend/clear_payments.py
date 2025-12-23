from models import db, Payment, User
from app import create_app

app = create_app()
with app.app_context():
    # Delete all payments
    payments = Payment.query.all()
    print(f'Found {len(payments)} payments')

    for payment in payments:
        db.session.delete(payment)

    db.session.commit()
    print('All payments deleted')

    # Reset student1 dues balance to match enrolled courses
    student = User.query.filter_by(username='student1').first()
    if student:
        total_fees = sum([e.course_fee for e in student.enrollments])
        student.dues_balance = total_fees
        db.session.commit()
        print(f'Reset student1 dues_balance to ${student.dues_balance}')
    else:
        print('Student1 not found')
