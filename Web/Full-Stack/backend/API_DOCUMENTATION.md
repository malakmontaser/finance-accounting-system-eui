# Student Management and Finance System - API Documentation

**Version:** 1.0.0  
**Author:** Manus AI  
**Date:** December 5, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Data Models](#data-models)
4. [API Endpoints](#api-endpoints)
   - [Authentication Endpoints](#authentication-endpoints)
   - [Student Endpoints](#student-endpoints)
   - [Course Management Endpoints](#course-management-endpoints)
   - [Finance Department Endpoints](#finance-department-endpoints)
5. [Error Handling](#error-handling)
6. [Database Schema](#database-schema)
7. [Setup and Deployment](#setup-and-deployment)

---

## Overview

The Student Management and Finance System is a robust backend API built with **Flask** and **SQLAlchemy** that manages student registration, course enrollment, and financial transactions. The system enforces role-based access control (RBAC) to ensure that only authorized personnel can access sensitive financial information.

### Key Features

- **Student Registration and Authentication:** Secure user registration and JWT-based authentication
- **Course Management:** Create, read, update, and delete courses with fee structures
- **Course Enrollment:** Students can enroll in courses with automatic dues calculation
- **Payment Processing:** Record student payments with atomic transaction updates
- **Finance Management:** Comprehensive financial reporting and student contact tracking
- **Notification System:** Automated notifications for key events
- **Action Logging:** Track all administrative actions for audit purposes

---

## Authentication

All protected endpoints require a valid JWT (JSON Web Token) in the `Authorization` header.

### JWT Token Structure

```
Authorization: Bearer <access_token>
```

The JWT token contains the following claims:

```json
{
  "id": 1,
  "username": "student_username",
  "is_admin": false
}
```

### Token Expiration

- **Access Token Expiration:** 8 hours (configurable in `config.py`)
- **Refresh Token:** Not implemented in current version

---

## Data Models

### User Model

Represents both students and admin users.

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer (PK) | Unique user identifier |
| `username` | String(150) | Unique username |
| `email` | String(200) | User email address |
| `password_hash` | String(200) | Hashed password (PBKDF2-SHA256) |
| `is_admin` | Boolean | True for Finance/Admin users, False for students |
| `dues_balance` | Float | Total outstanding dues |
| `created_at` | DateTime | Account creation timestamp |
| `updated_at` | DateTime | Last update timestamp |

### Course Model

Represents academic courses with associated fees.

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer (PK) | Unique course identifier |
| `course_id` | String(50) | Unique course code (e.g., 'CS101') |
| `name` | String(150) | Course name |
| `credits` | Integer | Credit hours |
| `total_fee` | Float | Total course fee |
| `description` | Text | Course description |
| `created_at` | DateTime | Course creation timestamp |

### Enrollment Model

Association table linking students to courses.

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer (PK) | Unique enrollment identifier |
| `student_id` | Integer (FK) | Reference to User |
| `course_id` | Integer (FK) | Reference to Course |
| `enrollment_date` | DateTime | Enrollment timestamp |
| `status` | String(20) | ACTIVE, COMPLETED, or DROPPED |
| `course_fee` | Float | Fee snapshot at enrollment time |
| `updated_at` | DateTime | Last update timestamp |

**Unique Constraint:** (student_id, course_id)

### Payment Model

Records all payment transactions.

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer (PK) | Unique payment identifier |
| `student_id` | Integer (FK) | Reference to User |
| `amount` | Float | Payment amount |
| `payment_date` | DateTime | Payment timestamp |
| `payment_method` | String(50) | MANUAL, BANK_TRANSFER, or ONLINE |
| `status` | String(20) | RECEIVED, PENDING, or RECONCILED |
| `reference_number` | String(100) | External reference (e.g., bank transaction ID) |
| `recorded_by` | Integer (FK) | Admin user who recorded the payment |
| `notes` | Text | Additional payment notes |
| `created_at` | DateTime | Record creation timestamp |

### Notification Model

Tracks key system events and notifications.

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer (PK) | Unique notification identifier |
| `student_id` | Integer (FK) | Reference to User |
| `notification_type` | String(100) | ENROLLMENT, PAYMENT_RECEIVED, CONTACT_REQUEST, etc. |
| `message` | Text | Notification message |
| `is_read` | Boolean | Read status |
| `created_at` | DateTime | Notification creation timestamp |
| `action_date` | DateTime | Date of related action |

### ActionLog Model

Tracks administrative actions for audit purposes.

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer (PK) | Unique action log identifier |
| `student_id` | Integer (FK) | Reference to User |
| `action_type` | String(100) | CONTACT_REQUEST, PAYMENT_RECORDED, ENROLLMENT, etc. |
| `action_description` | Text | Detailed description of action |
| `performed_by` | Integer (FK) | Admin user who performed the action |
| `created_at` | DateTime | Action timestamp |

---

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/register

Register a new student user.

**Request Body:**
```json
{
  "username": "student_username",
  "email": "student@example.com",
  "password": "secure_password"
}
```

**Response (201 Created):**
```json
{
  "msg": "User registered successfully",
  "user_id": 1,
  "username": "student_username"
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields
- `409 Conflict` - Username or email already exists

---

#### POST /api/auth/login

Authenticate user and issue JWT access token.

**Request Body:**
```json
{
  "username": "student_username",
  "password": "secure_password"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user_id": 1,
  "username": "student_username",
  "is_admin": false,
  "dues_balance": 0.0
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields
- `401 Unauthorized` - Invalid credentials

---

#### POST /api/auth/register-admin

Register a new admin user (Finance Department personnel).

**Request Body:**
```json
{
  "username": "admin_username",
  "email": "admin@example.com",
  "password": "secure_password"
}
```

**Response (201 Created):**
```json
{
  "msg": "Admin user registered successfully",
  "user_id": 2,
  "username": "admin_username",
  "is_admin": true
}
```

---

### Student Endpoints

#### POST /api/students/enroll

Enroll a student in a course. Automatically calculates and updates dues_balance.

**Authentication:** Required (JWT)  
**Authorization:** Student user

**Request Body:**
```json
{
  "course_id": 1
}
```

**Response (201 Created):**
```json
{
  "msg": "Successfully enrolled in course",
  "enrollment_id": 1,
  "course_name": "Computer Science",
  "course_fee": 5000.0,
  "updated_dues_balance": 5000.0
}
```

**Error Responses:**
- `400 Bad Request` - Missing course_id
- `404 Not Found` - Student or course not found
- `409 Conflict` - Student already enrolled in course

---

#### POST /api/students/pay

Record a student payment. Updates Payment model and reduces dues_balance atomically.

**Authentication:** Required (JWT)  
**Authorization:** Student user

**Request Body:**
```json
{
  "amount": 1000.0,
  "payment_method": "ONLINE",
  "reference_number": "TXN123456",
  "notes": "Payment for Computer Science course"
}
```

**Response (201 Created):**
```json
{
  "msg": "Payment recorded successfully",
  "payment_id": 1,
  "amount": 1000.0,
  "remaining_dues": 4000.0,
  "payment_date": "2025-12-05T15:30:00"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid amount or exceeds dues
- `404 Not Found` - Student not found

---

#### GET /api/students/status

Retrieve student's enrollment status and current dues_balance.

**Authentication:** Required (JWT)  
**Authorization:** Student user

**Response (200 OK):**
```json
{
  "user_id": 1,
  "username": "student_username",
  "email": "student@example.com",
  "dues_balance": 4000.0,
  "enrollments": [
    {
      "id": 1,
      "course_id": 1,
      "course_name": "Computer Science",
      "course_fee": 5000.0,
      "enrollment_date": "2025-12-05T10:00:00",
      "status": "ACTIVE"
    }
  ],
  "total_enrolled_courses": 1,
  "total_course_fees": 5000.0
}
```

---

#### GET /api/students/payments

Retrieve payment history for the authenticated student.

**Authentication:** Required (JWT)  
**Authorization:** Student user

**Response (200 OK):**
```json
{
  "user_id": 1,
  "username": "student_username",
  "total_paid": 1000.0,
  "payments": [
    {
      "id": 1,
      "amount": 1000.0,
      "payment_date": "2025-12-05T15:30:00",
      "payment_method": "ONLINE",
      "status": "RECEIVED",
      "reference_number": "TXN123456"
    }
  ]
}
```

---

### Course Management Endpoints

#### GET /api/courses

List all available courses.

**Response (200 OK):**
```json
{
  "total_courses": 3,
  "courses": [
    {
      "id": 1,
      "course_id": "CS101",
      "name": "Computer Science",
      "credits": 3,
      "total_fee": 5000.0,
      "description": "Introduction to Computer Science"
    }
  ]
}
```

---

#### GET /api/courses/<course_id>

Get details of a specific course.

**Response (200 OK):**
```json
{
  "id": 1,
  "course_id": "CS101",
  "name": "Computer Science",
  "credits": 3,
  "total_fee": 5000.0,
  "description": "Introduction to Computer Science",
  "created_at": "2025-12-05T10:00:00"
}
```

---

#### POST /api/courses

Create a new course (Admin only).

**Authentication:** Required (JWT)  
**Authorization:** Admin user (is_admin=true)

**Request Body:**
```json
{
  "course_id": "CS101",
  "name": "Computer Science",
  "credits": 3,
  "total_fee": 5000.0,
  "description": "Introduction to Computer Science"
}
```

**Response (201 Created):**
```json
{
  "msg": "Course created successfully",
  "course_id": 1,
  "name": "Computer Science"
}
```

---

#### PUT /api/courses/<course_id>

Update course details (Admin only).

**Authentication:** Required (JWT)  
**Authorization:** Admin user

**Request Body:**
```json
{
  "name": "Advanced Computer Science",
  "credits": 4,
  "total_fee": 6000.0,
  "description": "Advanced topics in CS"
}
```

**Response (200 OK):**
```json
{
  "msg": "Course updated successfully",
  "course_id": 1,
  "name": "Advanced Computer Science"
}
```

---

#### DELETE /api/courses/<course_id>

Delete a course (Admin only).

**Authentication:** Required (JWT)  
**Authorization:** Admin user

**Response (200 OK):**
```json
{
  "msg": "Course deleted successfully",
  "course_id": 1
}
```

---

### Finance Department Endpoints

All finance endpoints require admin authentication (`is_admin=true`).

#### GET /api/finance/dues

Lists all students with outstanding dues.

**Authentication:** Required (JWT)  
**Authorization:** Admin user

**Query Parameters:**
- `min_amount` (optional): Filter students with dues >= min_amount
- `max_amount` (optional): Filter students with dues <= max_amount
- `sort_by` (optional): Sort by 'dues_balance' (default) or 'username'

**Response (200 OK):**
```json
{
  "total_students_with_dues": 5,
  "total_outstanding_amount": 25000.0,
  "students": [
    {
      "user_id": 1,
      "username": "student1",
      "email": "student1@example.com",
      "dues_balance": 5000.0,
      "total_enrollments": 1,
      "last_payment_date": "2025-12-01T10:00:00"
    }
  ]
}
```

---

#### GET /api/finance/unpaid-report

Generates a detailed report of students with outstanding dues.

**Authentication:** Required (JWT)  
**Authorization:** Admin user

**Response (200 OK):**
```json
{
  "report_date": "2025-12-05T15:30:00",
  "total_students": 5,
  "total_outstanding": 25000.0,
  "students_by_status": {
    "critical": [
      {
        "user_id": 1,
        "username": "student1",
        "email": "student1@example.com",
        "dues_balance": 10000.0,
        "enrollments": [
          {
            "course_name": "Computer Science",
            "course_fee": 5000.0,
            "enrollment_date": "2025-12-05T10:00:00"
          }
        ],
        "recent_payments": [
          {
            "amount": 1000.0,
            "payment_date": "2025-12-01T10:00:00",
            "payment_method": "ONLINE"
          }
        ]
      }
    ],
    "moderate": [],
    "low": []
  },
  "detailed_report": []
}
```

---

#### PUT /api/finance/action/contact/<student_id>

Log action: Contact the student for outstanding dues.

**Authentication:** Required (JWT)  
**Authorization:** Admin user

**Request Body:**
```json
{
  "contact_method": "EMAIL",
  "notes": "Sent reminder email about pending dues"
}
```

**Response (201 Created):**
```json
{
  "msg": "Contact action logged successfully",
  "action_id": 1,
  "student_id": 1,
  "contact_date": "2025-12-05T15:30:00"
}
```

---

#### POST /api/finance/record-payment

Records and logs a payment transaction (e.g., bank transfer).

**Authentication:** Required (JWT)  
**Authorization:** Admin user

**Request Body:**
```json
{
  "student_id": 1,
  "amount": 2000.0,
  "payment_method": "BANK_TRANSFER",
  "reference_number": "BANK123456",
  "notes": "Payment received from student bank account"
}
```

**Response (201 Created):**
```json
{
  "msg": "Payment recorded successfully",
  "payment_id": 1,
  "student_id": 1,
  "amount": 2000.0,
  "remaining_dues": 3000.0
}
```

---

#### GET /api/finance/reports/status

Generates a status report based on student dues and fees (Pass/Fail).

**Authentication:** Required (JWT)  
**Authorization:** Admin user

**Query Parameters:**
- `threshold` (optional): Dues threshold for 'Fail' status (default: 0)

**Response (200 OK):**
```json
{
  "report_date": "2025-12-05T15:30:00",
  "total_students": 10,
  "pass_count": 5,
  "fail_count": 5,
  "threshold": 0,
  "pass_students": [
    {
      "user_id": 2,
      "username": "student2",
      "email": "student2@example.com",
      "dues_balance": 0.0,
      "total_fees": 5000.0,
      "total_enrollments": 1,
      "status": "PASS"
    }
  ],
  "fail_students": [
    {
      "user_id": 1,
      "username": "student1",
      "email": "student1@example.com",
      "dues_balance": 5000.0,
      "total_fees": 5000.0,
      "total_enrollments": 1,
      "status": "FAIL"
    }
  ]
}
```

---

## Error Handling

The API uses standard HTTP status codes and returns error responses in the following format:

```json
{
  "error": "Description of the error"
}
```

### Common HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions (RBAC) |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists or conflict |
| 500 | Internal Server Error | Server error |

---

## Database Schema

The system uses MySQL as the database backend. The schema includes the following tables:

- `users` - User accounts (students and admins)
- `courses` - Course definitions
- `enrollments` - Student course enrollments
- `payments` - Payment transactions
- `notifications` - System notifications
- `action_logs` - Administrative action logs

### Database Relationships

```
User (1) ----< (M) Enrollment >---- (1) Course
User (1) ----< (M) Payment
User (1) ----< (M) Notification
User (1) ----< (M) ActionLog
```

---

## Setup and Deployment

### Prerequisites

- Python 3.8+
- MySQL 8.0+
- pip (Python package manager)

### Installation

1. **Clone the repository:**
```bash
cd /home/ubuntu/backend
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Configure environment variables:**

Create a `.env` file in the backend directory:

```env
# Database Configuration
DB_USER=fas_user
DB_PASSWORD=StrongPassword123!
DB_HOST=localhost
DB_PORT=3306
DB_NAME=fas_db

# Flask Configuration
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
FLASK_ENV=development
```

4. **Initialize the database:**
```bash
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

5. **Run the application:**
```bash
flask run
```

The API will be available at `http://localhost:5000`

### Docker Deployment

The project includes a `docker-compose.yml` file for containerized deployment:

```bash
docker-compose up -d
```

This will start both the MySQL database and Flask API in separate containers.

### Testing the API

Use tools like **Postman**, **curl**, or **Thunder Client** to test the endpoints.

**Example: Register a student**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student1",
    "email": "student1@example.com",
    "password": "password123"
  }'
```

**Example: Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student1",
    "password": "password123"
  }'
```

---

## Core Logic Implementation

### 1. Automated Due Calculation

When a student enrolls in a course, the system automatically:
- Creates an `Enrollment` record
- Snapshots the course fee at enrollment time
- Updates the student's `dues_balance` by adding the course fee
- Creates notifications for both the student and finance department

**Implementation Location:** `routes/students.py` - `enroll_course()` function

### 2. Atomic Payment Update

When a payment is recorded:
- A `Payment` record is created
- The student's `dues_balance` is reduced atomically in the same transaction
- Notifications are created for the student
- All changes are committed together or rolled back on error

**Implementation Location:** `routes/students.py` - `make_payment()` function

### 3. Notification Logic

The system tracks key events through the `Notification` and `ActionLog` models:
- Student enrollment notifications
- Payment received notifications
- Contact request notifications
- Admin action logging for audit purposes

**Implementation Location:** `models.py` - `Notification` and `ActionLog` models

---

## Security Considerations

1. **Password Hashing:** Passwords are hashed using PBKDF2-SHA256 algorithm
2. **JWT Authentication:** All protected endpoints require valid JWT tokens
3. **Role-Based Access Control:** Admin endpoints enforce `is_admin=true` check
4. **Database Transactions:** Critical operations use atomic transactions
5. **Input Validation:** All user inputs are validated before processing
6. **CORS:** Cross-Origin Resource Sharing is enabled for frontend integration

---

## Future Enhancements

- Implement refresh token mechanism for extended sessions
- Add email notification service integration
- Implement payment gateway integration (Stripe, PayPal)
- Add student transcript generation
- Implement course prerequisites and scheduling
- Add bulk import/export functionality
- Implement advanced reporting and analytics
- Add two-factor authentication (2FA)
- Implement API rate limiting
- Add comprehensive logging and monitoring

---

**End of Documentation**
