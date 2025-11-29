from app import create_app
from models import db, User, StudentProfile, Transaction

app = create_app()
app.app_context().push()

def seed():
    # create finance admin
    if not User.query.filter_by(username='finance1').first():
        u = User(username='finance1', password_hash=User.generate_hash('finance123'), role='FINANCE')
        db.session.add(u)

    # student
    if not User.query.filter_by(username='student1').first():
        s = User(username='student1', password_hash=User.generate_hash('student123'), role='STUDENT')
        db.session.add(s)
        db.session.commit()
        prof = StudentProfile(user_id=s.id, student_id='S1001', name='Seif Wafik', faculty='Engineering', year='3', fees_status='UNPAID')
        db.session.add(prof)

    db.session.commit()
    print("Seeded")

if __name__ == "__main__":
    seed()
