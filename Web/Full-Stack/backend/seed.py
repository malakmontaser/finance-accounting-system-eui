"""
Database seeding script to populate the database with sample data for testing.
Run this script after initializing the database.

Usage:
    python seed.py
"""

from app import create_app, db
from models import User, Course, Enrollment, Payment, Notification, ActionLog
from datetime import datetime, timedelta
from sqlalchemy import text

def seed_database():
    """Populate the database with sample data."""
    
    app = create_app()
    
    with app.app_context():
        # Clear existing data
        print("Clearing existing data...")
        
        # Drop orphaned tables that may have foreign key constraints
        # These tables might exist from previous migrations but are no longer in models
        try:
            with db.engine.connect() as conn:
                # Disable foreign key checks temporarily
                conn.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
                
                # Drop transactions table first (it references student_profiles)
                result = conn.execute(text("SHOW TABLES LIKE 'transactions'"))
                if result.fetchone():
                    print("Dropping orphaned table 'transactions'...")
                    conn.execute(text("DROP TABLE IF EXISTS transactions"))
                
                # Drop student_profiles table (it references users)
                result = conn.execute(text("SHOW TABLES LIKE 'student_profiles'"))
                if result.fetchone():
                    print("Dropping orphaned table 'student_profiles'...")
                    conn.execute(text("DROP TABLE IF EXISTS student_profiles"))
                
                # Re-enable foreign key checks
                conn.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
                conn.commit()
        except Exception as e:
            print(f"Warning: Could not drop orphaned tables: {e}")
        
        db.drop_all()
        db.create_all()
        
        print("Seeding database with sample data...\n")
        
        # ====================================================================
        # Create Sample Users
        # ====================================================================
        print("Creating users...")
        
        # Admin user
        admin = User(
            username="admin",
            email="admin@finance.edu",
            password_hash=User.generate_hash("admin123"),
            is_admin=True,
            dues_balance=0.0
        )
        db.session.add(admin)
        
        # Student users
        students = [
            User(
                username="student1",
                email="student1@edu.com",
                password_hash=User.generate_hash("pass123"),
                is_admin=False,
                dues_balance=0.0
            ),
            User(
                username="student2",
                email="student2@edu.com",
                password_hash=User.generate_hash("pass123"),
                is_admin=False,
                dues_balance=0.0
            ),
            User(
                username="student3",
                email="student3@edu.com",
                password_hash=User.generate_hash("pass123"),
                is_admin=False,
                dues_balance=0.0
            ),
            User(
                username="student4",
                email="student4@edu.com",
                password_hash=User.generate_hash("pass123"),
                is_admin=False,
                dues_balance=0.0
            ),
            User(
                username="student5",
                email="student5@edu.com",
                password_hash=User.generate_hash("pass123"),
                is_admin=False,
                dues_balance=0.0
            ),
        ]
        
        for student in students:
            db.session.add(student)
        
        db.session.commit()
        print(f"✓ Created 1 admin and {len(students)} student users")
        
        # ====================================================================
        # Create Sample Courses
        # ====================================================================
        print("\nCreating courses...")
        
        courses = [
            Course(
                course_id="ENG101",
                name="English Literature",
                credits=3,
                total_fee=4000.0,
                description="Introduction to English Literature and Writing"
            ),
            Course(
                course_id="CS101",
                name="Computer Science",
                credits=4,
                total_fee=5000.0,
                description="Introduction to Computer Science and Programming"
            ),
            Course(
                course_id="DA101",
                name="Data Analytics",
                credits=3,
                total_fee=4500.0,
                description="Fundamentals of Data Analytics and Visualization"
            ),
            Course(
                course_id="MATH101",
                name="Mathematics",
                credits=4,
                total_fee=4000.0,
                description="Calculus and Advanced Mathematics"
            ),
            Course(
                course_id="BUS101",
                name="Business Management",
                credits=3,
                total_fee=3500.0,
                description="Introduction to Business Management Principles"
            ),
        ]
        
        for course in courses:
            db.session.add(course)
        
        db.session.commit()
        print(f"✓ Created {len(courses)} courses")
        
        # ====================================================================
        # Create Sample Enrollments
        # ====================================================================
        print("\nCreating enrollments...")
        
        enrollments = [
            # Student 1: 2 courses
            Enrollment(
                student_id=students[0].id,
                course_id=courses[0].id,
                course_fee=courses[0].total_fee,
                status='ACTIVE'
            ),
            Enrollment(
                student_id=students[0].id,
                course_id=courses[1].id,
                course_fee=courses[1].total_fee,
                status='ACTIVE'
            ),
            # Student 2: 1 course
            Enrollment(
                student_id=students[1].id,
                course_id=courses[1].id,
                course_fee=courses[1].total_fee,
                status='ACTIVE'
            ),
            # Student 3: 3 courses
            Enrollment(
                student_id=students[2].id,
                course_id=courses[0].id,
                course_fee=courses[0].total_fee,
                status='ACTIVE'
            ),
            Enrollment(
                student_id=students[2].id,
                course_id=courses[2].id,
                course_fee=courses[2].total_fee,
                status='ACTIVE'
            ),
            Enrollment(
                student_id=students[2].id,
                course_id=courses[3].id,
                course_fee=courses[3].total_fee,
                status='ACTIVE'
            ),
            # Student 4: 2 courses
            Enrollment(
                student_id=students[3].id,
                course_id=courses[2].id,
                course_fee=courses[2].total_fee,
                status='ACTIVE'
            ),
            Enrollment(
                student_id=students[3].id,
                course_id=courses[4].id,
                course_fee=courses[4].total_fee,
                status='ACTIVE'
            ),
            # Student 5: 1 course
            Enrollment(
                student_id=students[4].id,
                course_id=courses[3].id,
                course_fee=courses[3].total_fee,
                status='ACTIVE'
            ),
        ]
        
        for enrollment in enrollments:
            db.session.add(enrollment)
        
        db.session.commit()
        print(f"✓ Created {len(enrollments)} enrollments")
        
        # Update student dues_balance based on enrollments
        for student in students:
            total_dues = sum(
                e.course_fee for e in Enrollment.query.filter_by(student_id=student.id).all()
            )
            student.dues_balance = total_dues
        
        db.session.commit()
        print("✓ Updated student dues_balance")
        
        # ====================================================================
        # Create Sample Payments
        # ====================================================================
        print("\nCreating payments...")
        
        payments = [
            # Student 1 paid 4000 (owes 5000)
            Payment(
                student_id=students[0].id,
                amount=4000.0,
                payment_method="ONLINE",
                reference_number="TXN001",
                status="RECEIVED",
                recorded_by=admin.id,
                notes="Online payment received"
            ),
            # Student 2 paid 2500 (owes 2500)
            Payment(
                student_id=students[1].id,
                amount=2500.0,
                payment_method="BANK_TRANSFER",
                reference_number="BANK001",
                status="RECEIVED",
                recorded_by=admin.id,
                notes="Bank transfer received"
            ),
            # Student 3 paid 6000 (owes 6500)
            Payment(
                student_id=students[2].id,
                amount=3000.0,
                payment_method="MANUAL",
                reference_number="MANUAL001",
                status="RECEIVED",
                recorded_by=admin.id,
                notes="Cash payment received"
            ),
            Payment(
                student_id=students[2].id,
                amount=3000.0,
                payment_method="ONLINE",
                reference_number="TXN002",
                status="RECEIVED",
                recorded_by=admin.id,
                notes="Online payment received"
            ),
            # Student 4 no payments (owes 8000)
            # Student 5 paid 2000 (owes 2000)
            Payment(
                student_id=students[4].id,
                amount=2000.0,
                payment_method="ONLINE",
                reference_number="TXN003",
                status="RECEIVED",
                recorded_by=admin.id,
                notes="Online payment received"
            ),
        ]
        
        for payment in payments:
            db.session.add(payment)
        
        db.session.commit()
        print(f"✓ Created {len(payments)} payments")
        
        # Update student dues_balance based on payments
        for student in students:
            total_paid = sum(
                p.amount for p in Payment.query.filter_by(student_id=student.id).all()
            )
            total_fees = sum(
                e.course_fee for e in Enrollment.query.filter_by(student_id=student.id).all()
            )
            student.dues_balance = max(0, total_fees - total_paid)
        
        db.session.commit()
        print("✓ Updated student dues_balance after payments")
        
        # ====================================================================
        # Create Sample Notifications
        # ====================================================================
        print("\nCreating notifications...")
        
        notifications = [
            Notification(
                student_id=students[0].id,
                notification_type="ENROLLMENT",
                message="You have successfully enrolled in English Literature. Course fee: $4000.00"
            ),
            Notification(
                student_id=students[0].id,
                notification_type="ENROLLMENT",
                message="You have successfully enrolled in Computer Science. Course fee: $5000.00"
            ),
            Notification(
                student_id=students[0].id,
                notification_type="PAYMENT_RECEIVED",
                message="Payment of $4000.00 received. Remaining dues: $5000.00"
            ),
            Notification(
                student_id=students[1].id,
                notification_type="ENROLLMENT",
                message="You have successfully enrolled in Computer Science. Course fee: $5000.00"
            ),
            Notification(
                student_id=students[1].id,
                notification_type="PAYMENT_RECEIVED",
                message="Payment of $2500.00 received. Remaining dues: $2500.00"
            ),
        ]
        
        for notification in notifications:
            db.session.add(notification)
        
        db.session.commit()
        print(f"✓ Created {len(notifications)} notifications")
        
        # ====================================================================
        # Create Sample Action Logs
        # ====================================================================
        print("\nCreating action logs...")
        
        action_logs = [
            ActionLog(
                student_id=students[0].id,
                action_type="ENROLLMENT",
                action_description="Student enrolled in English Literature",
                performed_by=admin.id
            ),
            ActionLog(
                student_id=students[0].id,
                action_type="PAYMENT_RECORDED",
                action_description="Payment of $4000.00 recorded via ONLINE. Reference: TXN001",
                performed_by=admin.id
            ),
            ActionLog(
                student_id=students[3].id,
                action_type="CONTACT_REQUEST",
                action_description="Contacted student via EMAIL. Notes: Sent reminder email about pending dues",
                performed_by=admin.id
            ),
        ]
        
        for action_log in action_logs:
            db.session.add(action_log)
        
        db.session.commit()
        print(f"✓ Created {len(action_logs)} action logs")
        
        # ====================================================================
        # Print Summary
        # ====================================================================
        print("\n" + "="*60)
        print("DATABASE SEEDING COMPLETED SUCCESSFULLY")
        print("="*60)
        
        print("\nSample Credentials:")
        print("-" * 60)
        print("Admin User:")
        print("  Username: admin")
        print("  Password: admin123")
        print("  is_admin: true")
        print()
        print("Student Users:")
        for i, student in enumerate(students, 1):
            print(f"  {i}. Username: {student.username}")
            print(f"     Password: pass123")
            print(f"     Email: {student.email}")
            print(f"     Dues Balance: ${student.dues_balance:.2f}")
            print()
        
        print("Sample Courses:")
        print("-" * 60)
        for course in courses:
            print(f"  {course.course_id}: {course.name} (${course.total_fee:.2f})")
        
        print("\n" + "="*60)
        print("You can now start the Flask application and test the API")
        print("="*60)


if __name__ == "__main__":
    seed_database()
