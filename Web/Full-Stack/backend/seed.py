"""
Database seeding script to populate the database with sample data for testing.
Run this script after initializing the database.

Usage:
    python seed.py
"""

from app import create_app, db
from models import User, Course, Enrollment, Payment, Notification, ActionLog, Faculty
from datetime import datetime, timedelta
from sqlalchemy import text

def seed_database():
    """Populate the database with sample data."""
    
    app = create_app()
    
    with app.app_context():
        # Clear existing data
        print("Clearing existing data...")
        
        # Disable foreign key checks and drop all tables manually
        try:
            # Disable foreign key checks temporarily
            db.session.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
            db.session.commit()
            
            # Get all tables in the database
            result = db.session.execute(text("SHOW TABLES"))
            tables = [row[0] for row in result]
            
            # Drop all tables
            for table in tables:
                print(f"Dropping table '{table}'...")
                db.session.execute(text(f"DROP TABLE IF EXISTS `{table}`"))
                db.session.commit()
            
            # Re-enable foreign key checks
            db.session.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
            db.session.commit()
            
            print("All tables dropped successfully.")
            
        except Exception as e:
            print(f"Error during table cleanup: {e}")
            # Make sure to re-enable foreign key checks even if there's an error
            try:
                db.session.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
                db.session.commit()
            except:
                pass
            raise
        
        # Create all tables
        print("Creating all tables...")
        db.create_all()
        
        # Create Faculties
        print("Creating faculties...")
        faculties = [
            Faculty(
                name="Computer and Information Sciences",
                code="CIS",
                description="Faculty of Computer and Information Sciences, offering programs in Computer Science, Software Engineering, and Data Science."
            ),
            Faculty(
                name="Digital Arts and Design",
                code="DAD",
                description="Faculty of Digital Arts and Design, focusing on creative digital media, animation, and design."
            ),
            Faculty(
                name="Business Informatics",
                code="BI",
                description="Faculty of Business Informatics, combining business administration with information technology."
            ),
            Faculty(
                name="Engineering",
                code="ENG",
                description="Faculty of Engineering, offering various engineering disciplines and specializations."
            )
        ]
        db.session.add_all(faculties)
        db.session.commit()
        
        # Get faculty IDs for reference
        cis_faculty = Faculty.query.filter_by(code="CIS").first()
        dad_faculty = Faculty.query.filter_by(code="DAD").first()
        bi_faculty = Faculty.query.filter_by(code="BI").first()
        eng_faculty = Faculty.query.filter_by(code="ENG").first()
        
        if not all([cis_faculty, dad_faculty, bi_faculty, eng_faculty]):
            raise ValueError("Failed to create all required faculties")
        
        print("Seeding database with sample data...\n")
        
        # ====================================================================
        # Create Sample Users
        # ====================================================================
        print("Creating users...")
        # Create Admin User
        print("Creating admin user...")
        admin = User(
            username="admin",
            email="admin@example.com",
            password_hash=User.generate_hash("admin123"),
            is_admin=True,
            faculty=None  # Admin doesn't need to be in a faculty
        )
        db.session.add(admin)
        
        # Create Sample Students
        print("Creating sample students...")
        students = []
        faculties = [cis_faculty, dad_faculty, bi_faculty, eng_faculty]
        
        for i in range(1, 11):
            # Distribute students across faculties
            faculty = faculties[i % len(faculties)]
            student = User(
                username=f"student{i}",
                email=f"student{i}@example.com",
                password_hash=User.generate_hash(f"pass123"),
                is_admin=False,
                faculty=faculty,
                dues_balance=float(1000 - (i * 50))  # Vary the dues balance
            )
            students.append(student)
        db.session.add_all(students)
        
        db.session.commit()
        print(f"✓ Created 1 admin and {len(students)} student users")
        
        # ====================================================================
        # Create Sample Courses
        # ====================================================================
        print("Creating sample courses...")
        courses = []
        
        # CIS Courses
        cis_courses = [
            Course(
                course_id="CS101",
                name="Introduction to Computer Science",
                credits=3,
                total_fee=1200.00,
                faculty=cis_faculty,
                description="Fundamentals of computer science and programming"
            ),
            Course(
                course_id="CS201",
                name="Data Structures and Algorithms",
                credits=4,
                total_fee=1400.00,
                faculty=cis_faculty,
                description="Advanced data structures and algorithm analysis"
            ),
            Course(
                course_id="CS301",
                name="Database Systems",
                credits=3,
                total_fee=1300.00,
                faculty=cis_faculty,
                description="Design and implementation of database systems"
            )
        ]
        
        # DAD Courses
        dad_courses = [
            Course(
                course_id="DAD101",
                name="Digital Design Fundamentals",
                credits=3,
                total_fee=1500.00,
                faculty=dad_faculty,
                description="Introduction to digital design principles and tools"
            ),
            Course(
                course_id="ANI201",
                name="3D Animation",
                credits=4,
                total_fee=1800.00,
                faculty=dad_faculty,
                description="Creating 3D animations using industry-standard software"
            )
        ]
        
        # BI Courses
        bi_courses = [
            Course(
                course_id="BI101",
                name="Business Analytics",
                credits=3,
                total_fee=1400.00,
                faculty=bi_faculty,
                description="Using data analysis for business decision making"
            ),
            Course(
                course_id="BI201",
                name="Enterprise Systems",
                credits=3,
                total_fee=1500.00,
                faculty=bi_faculty,
                description="Overview of enterprise resource planning systems"
            )
        ]
        
        # Engineering Courses
        eng_courses = [
            Course(
                course_id="ENG101",
                name="Engineering Mathematics I",
                credits=4,
                total_fee=1300.00,
                faculty=eng_faculty,
                description="Mathematical methods for engineering applications"
            ),
            Course(
                course_id="MECH201",
                name="Thermodynamics",
                credits=4,
                total_fee=1600.00,
                faculty=eng_faculty,
                description="Fundamentals of energy and thermodynamics"
            )
        ]
        
        # Add all courses to the list
        courses.extend(cis_courses)
        courses.extend(dad_courses)
        courses.extend(bi_courses)
        courses.extend(eng_courses)
        db.session.add_all(courses)
        
        db.session.commit()
        print(f"✓ Created {len(courses)} courses")
        
        # ====================================================================
        # Create Sample Enrollments
        # ====================================================================
        print("\nCreating enrollments...")
        
        enrollments = []
        import random
        
        for student in students:
            # Get courses for this student's faculty
            faculty_courses = [c for c in courses if c.faculty_id == student.faculty_id]
            
            if faculty_courses:
                # Enroll in 1 to all available courses for their faculty
                # For deterministic seeding, let's just pick the first 1-2 courses
                num_courses = min(len(faculty_courses), 2)
                courses_to_enroll = faculty_courses[:num_courses]
                
                for course in courses_to_enroll:
                    enrollments.append(
                        Enrollment(
                            student_id=student.id,
                            course_id=course.id,
                            course_fee=course.total_fee,
                            status='ACTIVE'
                        )
                    )
        
        # Add manually specified complex enrollments for specific testing scenarios if needed
        # But for now, the dynamic logic above covers all students correctly.
        
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
