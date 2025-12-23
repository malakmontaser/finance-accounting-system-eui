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

## Alyan's New APIs

This section documents all the new finance-related APIs implemented for the Finance Portal. These APIs provide comprehensive functionality for managing student finances, fee structures, bank reconciliation, reporting, and handling unpaid students.

### Finance Dashboard APIs

#### GET /api/finance/summary

Returns overall financial summary statistics for the Finance Dashboard. This endpoint provides key metrics including total collected payments, pending payments, total students, and unpaid students count, along with percentage changes from the previous period.

**Authentication:** Required (JWT)  
**Authorization:** Admin user (`is_admin=true`)

**Response (200 OK):**
```json
{
  "total_collected": 2400000.0,
  "total_collected_change": 12.5,
  "pending_payments": 340000.0,
  "pending_payments_change": -8.2,
  "total_students": 2847,
  "total_students_change": 5.3,
  "unpaid_students": 156,
  "unpaid_students_change": -3.1
}
```

**Description:**
- Calculates total collected from all payments with status 'RECEIVED'
- Calculates pending payments as sum of all student `dues_balance`
- Counts total students (non-admin users)
- Counts unpaid students (students with `dues_balance > 0`)
- Calculates percentage changes based on 30-day comparison

---

#### GET /api/finance/payments/recent

Returns a list of recent payments with student and faculty information. Used to display recent payment activity on the Finance Dashboard.

**Authentication:** Required (JWT)  
**Authorization:** Admin user

**Query Parameters:**
- `limit` (optional): Number of recent payments to return (default: 5)

**Response (200 OK):**
```json
{
  "payments": [
    {
      "id": 1,
      "student_id": 5,
      "student_name": "John Smith",
      "amount": 5000.0,
      "payment_date": "2025-12-05T15:30:00",
      "payment_method": "ONLINE",
      "faculty": "Engineering",
      "status": "RECEIVED"
    }
  ],
  "total_count": 10
}
```

**Description:**
- Retrieves the most recent payments ordered by payment date
- Includes student name and faculty information
- Returns payment method, amount, and status
- Used for displaying recent payment activity on dashboard

---

#### GET /api/finance/payments/by-faculty

Returns payment statistics grouped by faculty/department. Provides a breakdown of total collected and pending payments per faculty.

**Authentication:** Required (JWT)  
**Authorization:** Admin user

**Response (200 OK):**
```json
{
  "faculties": [
    {
      "faculty": "Engineering",
      "total_collected": 500000.0,
      "pending_payments": 75000.0,
      "student_count": 500
    },
    {
      "faculty": "Computer Science",
      "total_collected": 600000.0,
      "pending_payments": 90000.0,
      "student_count": 600
    }
  ],
  "total_collected": 1100000.0,
  "total_pending": 165000.0
}
```

**Description:**
- Groups payments and dues by faculty from course enrollments
- Calculates total collected per faculty from payments
- Calculates pending payments per faculty from student dues
- Provides faculty-level financial overview

---

### Student List APIs

#### GET /api/finance/students

Returns all students with their payment information for the Student List page. Supports search, filtering by faculty and payment status, and pagination.

**Authentication:** Required (JWT)  
**Authorization:** Admin user

**Query Parameters:**
- `search` (optional): Search by name, email, or student ID (e.g., "STD-001")
- `faculty` (optional): Filter by faculty name
- `status` (optional): Filter by payment status - "Paid", "Pending", or "Unpaid"
- `limit` (optional): Number of records to return (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response (200 OK):**
```json
{
  "students": [
    {
      "id": "STD-001",
      "user_id": 1,
      "name": "John Smith",
      "email": "john.s@uni.edu",
      "faculty": "Engineering",
      "totalFees": 12500.0,
      "paid": 12500.0,
      "dues": 0.0,
      "status": "Paid"
    }
  ],
  "total_count": 100,
  "faculties": ["Engineering", "Computer Science", "Digital Arts", "Business Informatics"]
}
```

**Description:**
- Retrieves all non-admin users with their enrollment and payment data
- Calculates total fees from enrollments
- Calculates paid amount from received payments
- Determines status: "Paid" (dues=0), "Pending" (dues>0 and paid>0), "Unpaid" (paid=0)
- Returns list of unique faculties for filter dropdown
- Supports pagination for large datasets

---

#### GET /api/finance/students/<student_id>

Returns detailed information for a specific student including enrollments, payments, and notifications. Used when clicking "View" button in the Student List table.

**Authentication:** Required (JWT)  
**Authorization:** Admin user

**Response (200 OK):**
```json
{
  "student": {
    "id": "STD-001",
    "user_id": 1,
    "name": "John Smith",
    "email": "john.s@uni.edu",
    "faculty": "Engineering",
    "totalFees": 12500.0,
    "paid": 12500.0,
    "dues": 0.0,
    "status": "Paid",
    "created_at": "2025-09-01T10:00:00"
  },
  "enrollments": [
    {
      "id": 1,
      "course_name": "Computer Science",
      "course_fee": 5000.0,
      "enrollment_date": "2025-09-01T10:00:00",
      "status": "ACTIVE"
    }
  ],
  "payments": [
    {
      "id": 1,
      "amount": 5000.0,
      "payment_date": "2025-09-15T10:00:00",
      "payment_method": "ONLINE",
      "status": "RECEIVED"
    }
  ],
  "notifications": [
    {
      "id": 1,
      "notification_type": "PAYMENT_RECEIVED",
      "message": "Payment of $5000.00 received",
      "created_at": "2025-09-15T10:00:00",
      "is_read": false
    }
  ]
}
```

**Description:**
- Retrieves complete student profile with financial summary
- Includes all active enrollments with course details
- Lists all payment history
- Shows recent notifications related to the student
- Provides comprehensive view for finance department review

---

### Fee Calculation APIs

#### GET /api/finance/fee-structure

Returns all fee categories with their items grouped by category. Also returns list of unique faculties for the fee calculator dropdown.

**Authentication:** Required (JWT)  
**Authorization:** Admin user

**Response (200 OK):**
```json
{
  "categories": [
    {
      "id": 1,
      "name": "tuition",
      "display_name": "Tuition Fees",
      "fees": [
        {
          "id": 1,
          "name": "Per Credit Hour",
          "amount": 500.0,
          "is_per_credit": true
        },
        {
          "id": 2,
          "name": "Registration Fee",
          "amount": 100.0,
          "is_per_credit": false
        }
      ]
    },
    {
      "id": 2,
      "name": "bus",
      "display_name": "Bus Fees",
      "fees": [
        {
          "id": 3,
          "name": "Semester Bus Pass",
          "amount": 200.0,
          "is_per_credit": false
        }
      ]
    }
  ],
  "faculties": ["Engineering", "Computer Science", "Digital Arts", "Business Informatics"]
}
```

**Description:**
- Retrieves all active fee structure items from the database
- Groups fees by category (tuition, bus, other)
- Returns fee items with amounts and per-credit flags
- Provides faculty list for fee calculation dropdown
- Used to populate the Fee Calculation page

---

#### PUT /api/finance/fee-structure

Updates multiple fee items at once. Accepts fee items grouped by category and updates their names, amounts, and per-credit settings.

**Authentication:** Required (JWT)  
**Authorization:** Admin user

**Request Body:**
```json
{
  "tuition": [
    {
      "id": 1,
      "name": "Per Credit Hour",
      "amount": 550.0,
      "is_per_credit": true
    }
  ],
  "bus": [
    {
      "id": 3,
      "name": "Semester Bus Pass",
      "amount": 250.0,
      "is_per_credit": false
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "msg": "Fee structure updated successfully",
  "updated_count": 2
}
```

**Description:**
- Updates fee items in bulk by category
- Allows modification of fee names, amounts, and per-credit settings
- Updates the `updated_at` timestamp for modified items
- Performs atomic transaction (all or nothing)

---

#### POST /api/finance/fee-structure/item

Creates a new fee item in the specified category. Used to add new fees to the fee structure.

**Authentication:** Required (JWT)  
**Authorization:** Admin user

**Request Body:**
```json
{
  "category": "tuition",
  "name": "Lab Fee",
  "amount": 150.0,
  "is_per_credit": false
}
```

**Response (201 Created):**
```json
{
  "msg": "Fee item created successfully",
  "fee": {
    "id": 4,
    "name": "Lab Fee",
    "amount": 150.0,
    "category": "tuition",
    "is_per_credit": false
  }
}
```

**Description:**
- Creates a new fee structure item
- Automatically sets `is_active=true` and assigns display order
- Validates required fields (category, name, amount)
- Returns the created fee item with its ID

---

#### DELETE /api/finance/fee-structure/item/<item_id>

Removes a fee item by performing a soft delete (sets `is_active=False`). The item remains in the database but is hidden from active fee structures.

**Authentication:** Required (JWT)  
**Authorization:** Admin user

**Response (200 OK):**
```json
{
  "msg": "Fee item deleted successfully",
  "id": 4
}
```

**Description:**
- Performs soft delete by setting `is_active=False`
- Preserves historical data
- Updates `updated_at` timestamp
- Item will no longer appear in fee structure listings

---

#### POST /api/finance/calculate-fees

Calculates total fees based on credit hours, faculty, and selected fee options. Returns detailed breakdown for transparency.

**Authentication:** Required (JWT)  
**Authorization:** Admin user

**Request Body:**
```json
{
  "credit_hours": 15,
  "include_bus": true,
  "faculty": "Engineering"
}
```

**Response (200 OK):**
```json
{
  "breakdown": {
    "tuition": {
      "Per Credit Hour": 7500.0,
      "Registration Fee": 100.0,
      "subtotal": 7600.0
    },
    "bus": {
      "Semester Bus Pass": 200.0,
      "subtotal": 200.0
    }
  },
  "total": 7800.0,
  "credit_hours": 15
}
```

**Description:**
- Calculates fees based on credit hours and selected options
- Applies per-credit fees by multiplying amount × credit hours
- Includes fixed fees regardless of credit hours
- Optionally includes bus fees if `include_bus=true`
- Returns detailed breakdown by category for transparency

---

### Bank Reconciliation APIs

#### GET /api/finance/bank-reconciliation

Returns list of bank transactions that need to be reconciled with student payments. Supports filtering by status and pagination.

**Authentication:** Required (JWT)  
**Authorization:** Admin user

**Query Parameters:**
- `status` (optional): Filter by status - "PENDING", "MATCHED", "RECONCILED" (default: all)
- `limit` (optional): Number of records to return (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response (200 OK):**
```json
{
  "transactions": [
    {
      "id": 1,
      "transaction_date": "2025-12-05T10:00:00",
      "amount": 5000.0,
      "description": "Payment from John Smith",
      "reference_number": "BANK-123456",
      "status": "PENDING",
      "matched_payment_id": null,
      "matched_student_id": null
    }
  ],
  "total_count": 25,
  "pending_count": 10,
  "matched_count": 12,
  "reconciled_count": 3
}
```

**Description:**
- Retrieves bank transactions from the `BankTransaction` model
- Filters by reconciliation status
- Shows matched payment and student information if matched
- Provides summary counts by status
- Used for bank reconciliation workflow

---

#### POST /api/finance/bank-reconciliation/sync

Syncs bank transaction data from external source (e.g., bank API or CSV import). Creates new `BankTransaction` records for unmatched transactions.

**Authentication:** Required (JWT)  
**Authorization:** Admin user

**Request Body:**
```json
{
  "transactions": [
    {
      "transaction_date": "2025-12-05T10:00:00",
      "amount": 5000.0,
      "description": "Payment from John Smith",
      "reference_number": "BANK-123456"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "msg": "Bank data synced successfully",
  "synced_count": 5,
  "new_transactions": 3,
  "duplicate_count": 2
}
```

**Description:**
- Accepts array of bank transactions
- Creates new `BankTransaction` records for new transactions
- Skips duplicates based on reference number
- Sets status to "PENDING" for new transactions
- Returns count of synced, new, and duplicate transactions

---

#### GET /api/finance/bank-reconciliation/<transaction_id>

Returns detailed information for a specific bank transaction including match suggestions and related payment information.

**Authentication:** Required (JWT)  
**Authorization:** Admin user

**Response (200 OK):**
```json
{
  "transaction": {
    "id": 1,
    "transaction_date": "2025-12-05T10:00:00",
    "amount": 5000.0,
    "description": "Payment from John Smith",
    "reference_number": "BANK-123456",
    "status": "PENDING",
    "created_at": "2025-12-05T11:00:00"
  },
  "matched_payment": null,
  "suggestions": [
    {
      "payment_id": 10,
      "student_id": 5,
      "student_name": "John Smith",
      "amount": 5000.0,
      "payment_date": "2025-12-05T09:00:00",
      "match_score": 0.95,
      "match_reason": "Amount and date match"
    }
  ]
}
```

**Description:**
- Retrieves detailed transaction information
- Shows matched payment if transaction is already matched
- Provides match suggestions based on amount, date, and reference number
- Used when viewing transaction details in reconciliation interface

---

#### PUT /api/finance/bank-reconciliation/<transaction_id>/match

Manually matches a bank transaction to a student payment. Updates both the transaction status and payment reconciliation status.

**Authentication:** Required (JWT)  
**Authorization:** Admin user

**Request Body:**
```json
{
  "payment_id": 10,
  "student_id": 5,
  "notes": "Matched based on amount and date"
}
```

**Response (200 OK):**
```json
{
  "msg": "Transaction matched successfully",
  "transaction_id": 1,
  "payment_id": 10,
  "student_id": 5,
  "status": "MATCHED"
}
```

**Description:**
- Links bank transaction to a specific payment record
- Updates transaction status to "MATCHED"
- Updates payment status to "RECONCILED"
- Records match information for audit trail
- Used when finance admin confirms a match

---

#### GET /api/finance/bank-reconciliation/suggestions/<transaction_id>

Returns intelligent match suggestions for a bank transaction based on amount, date, reference number, and student information.

**Authentication:** Required (JWT)  
**Authorization:** Admin user

**Response (200 OK):**
```json
{
  "suggestions": [
    {
      "payment_id": 10,
      "student_id": 5,
      "student_name": "John Smith",
      "amount": 5000.0,
      "payment_date": "2025-12-05T09:00:00",
      "match_score": 0.95,
      "match_reason": "Amount matches exactly, date within 1 day, reference number similar"
    },
    {
      "payment_id": 11,
      "student_id": 6,
      "student_name": "Jane Doe",
      "amount": 5000.0,
      "payment_date": "2025-12-04T14:00:00",
      "match_score": 0.75,
      "match_reason": "Amount matches, date within 2 days"
    }
  ]
}
```

**Description:**
- Analyzes transaction details and finds potential payment matches
- Calculates match score based on:
  - Amount similarity (exact match = highest score)
  - Date proximity (closer dates = higher score)
  - Reference number similarity
  - Student name matching in description
- Returns suggestions sorted by match score
- Helps finance admin quickly identify correct matches

---

### Reports APIs

#### GET /api/finance/reports/types

Returns available report types and configuration options including faculties list for report generation.

**Authentication:** Required (JWT)  
**Authorization:** Admin user

**Response (200 OK):**
```json
{
  "report_types": [
    {
      "id": "student_level",
      "name": "Student Level Report",
      "description": "Individual student payment history and outstanding balances",
      "icon": "user",
      "available_formats": ["pdf", "excel", "json"]
    },
    {
      "id": "faculty_level",
      "name": "Faculty Level Report",
      "description": "Aggregated payment data by faculty/department",
      "icon": "building",
      "available_formats": ["pdf", "excel", "json"]
    },
    {
      "id": "university_level",
      "name": "University Level Report",
      "description": "Complete university-wide financial overview",
      "icon": "chart",
      "available_formats": ["pdf", "excel", "json"]
    },
    {
      "id": "finance_overview",
      "name": "Finance Overview",
      "description": "Summary of all financial transactions and metrics",
      "icon": "document",
      "available_formats": ["pdf", "excel", "json"]
    }
  ],
  "faculties": ["All Faculties", "Engineering", "Computer Science", "Digital Arts", "Business Informatics"]
}
```

**Description:**
- Returns list of available report types with descriptions
- Provides available export formats for each report type
- Returns list of faculties for filtering
- Used to populate report generation form

---

#### POST /api/finance/reports/generate

Generates a custom report based on parameters (report type, faculty, date range, format). Saves report to history for later download.

**Authentication:** Required (JWT)  
**Authorization:** Admin user

**Request Body:**
```json
{
  "report_type": "student_level",
  "faculty": "Engineering",
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "format": "json",
  "save_to_history": true
}
```

**Response (200 OK):**
```json
{
  "report_id": "RPT-2025-001",
  "report_name": "Student Level Report - Engineering - 2025",
  "report_type": "student_level",
  "generated_at": "2025-12-05T15:30:00",
  "parameters": {
    "faculty": "Engineering",
    "date_range": "2025-01-01 to 2025-12-31"
  },
  "summary": {
    "total_students": 500,
    "total_collected": 2500000.0,
    "total_outstanding": 125000.0
  },
  "data": [...]
}
```

**Description:**
- Generates report based on type and filters
- Creates unique report ID (format: RPT-YYYY-XXX)
- Saves report data to `GeneratedReport` model
- Returns full report data for JSON format
- For PDF/Excel, returns download URL
- Report expires after 30 days

---

#### GET /api/finance/reports/download/<report_id>

Downloads a previously generated report in the specified format (JSON, PDF, or Excel). Retrieves report data from saved history.

**Authentication:** Required (JWT)  
**Authorization:** Admin user

**Query Parameters:**
- `format` (optional): Download format - "json", "pdf", or "excel" (default: "json")

**Response (200 OK):**
- For JSON: Returns JSON response with report data
- For PDF/Excel: Returns file download with appropriate headers

**Response Headers:**
```
Content-Type: application/json (for JSON)
Content-Type: application/pdf (for PDF)
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (for Excel)
Content-Disposition: attachment; filename="report_RPT-2025-001.json"
```

**Description:**
- Retrieves saved report from `GeneratedReport` model
- Checks if report has expired (30-day limit)
- Returns report data in requested format
- For JSON: Returns full data structure
- For PDF/Excel: Returns downloadable file (requires additional libraries in production)

---

#### GET /api/finance/reports/history

Returns list of previously generated reports with their metadata. Supports filtering and pagination.

**Authentication:** Required (JWT)  
**Authorization:** Admin user

**Query Parameters:**
- `report_type` (optional): Filter by report type
- `limit` (optional): Number of records to return (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response (200 OK):**
```json
{
  "reports": [
    {
      "id": "RPT-2025-001",
      "name": "Student Level Report - Engineering - 2025",
      "report_type": "student_level",
      "generated_at": "2025-12-05T15:30:00",
      "generated_by": 2,
      "expires_at": "2026-01-04T15:30:00",
      "parameters": {
        "faculty": "Engineering",
        "start_date": "2025-01-01",
        "end_date": "2025-12-31"
      }
    }
  ],
  "total_count": 25
}
```

**Description:**
- Retrieves all generated reports from history
- Filters by report type if specified
- Shows report metadata including generation date and expiry
- Supports pagination for large report lists
- Used to display report history page

---

#### GET /api/finance/reports/faculty-summary

Returns aggregated financial summary by faculty including total collected, pending payments, and student counts per faculty.

**Authentication:** Required (JWT)  
**Authorization:** Admin user

**Query Parameters:**
- `start_date` (optional): Start date for date range filter
- `end_date` (optional): End date for date range filter

**Response (200 OK):**
```json
{
  "faculties": [
    {
      "faculty": "Engineering",
      "total_students": 500,
      "total_collected": 2500000.0,
      "total_outstanding": 125000.0,
      "payment_rate": 95.2
    },
    {
      "faculty": "Computer Science",
      "total_students": 600,
      "total_collected": 3000000.0,
      "total_outstanding": 150000.0,
      "payment_rate": 95.2
    }
  ],
  "summary": {
    "total_faculties": 4,
    "total_students": 2847,
    "total_collected": 12000000.0,
    "total_outstanding": 600000.0
  }
}
```

**Description:**
- Aggregates financial data by faculty from course enrollments
- Calculates total collected per faculty from payments
- Calculates total outstanding per faculty from student dues
- Computes payment rate (percentage of students who have paid)
- Provides faculty-level financial overview

---

#### GET /api/finance/reports/university-summary

Returns university-wide financial summary including total collections, outstanding amounts, student statistics, and trends.

**Authentication:** Required (JWT)  
**Authorization:** Admin user

**Query Parameters:**
- `start_date` (optional): Start date for date range filter
- `end_date` (optional): End date for date range filter

**Response (200 OK):**
```json
{
  "summary": {
    "total_students": 2847,
    "total_collected": 12000000.0,
    "total_outstanding": 600000.0,
    "collection_rate": 95.2,
    "average_payment": 4216.0
  },
  "by_faculty": [
    {
      "faculty": "Engineering",
      "student_count": 500,
      "collected": 2500000.0,
      "outstanding": 125000.0
    }
  ],
  "trends": {
    "monthly_collections": [
      {"month": "2025-01", "amount": 1000000.0},
      {"month": "2025-02", "amount": 1100000.0}
    ]
  }
}
```

**Description:**
- Provides comprehensive university-wide financial overview
- Calculates overall collection statistics
- Breaks down data by faculty
- Includes trend analysis (monthly collections)
- Used for high-level financial reporting

---

#### DELETE /api/finance/reports/<report_id>

Deletes a generated report from history. Permanently removes the report record from the database.

**Authentication:** Required (JWT)  
**Authorization:** Admin user

**Response (200 OK):**
```json
{
  "msg": "Report deleted successfully",
  "report_id": "RPT-2025-001"
}
```

**Description:**
- Permanently deletes report from `GeneratedReport` model
- Cannot be undone
- Used to clean up old or unnecessary reports
- Frees up database storage

---

### Unpaid Students APIs

#### GET /api/finance/unpaid-students

Returns comprehensive list of unpaid students with summary statistics, due dates, overdue status, and blocking information. Used for the Unpaid Students management page.

**Authentication:** Required (JWT)  
**Authorization:** Admin user

**Response (200 OK):**
```json
{
  "summary": {
    "unpaid_count": 5,
    "total_outstanding": 47400.0,
    "overdue_count": 2,
    "due_today_count": 1,
    "due_soon_count": 2
  },
  "students": [
    {
      "id": 5,
      "user_id": 5,
      "name": "James Wilson",
      "student_id": "STD-005",
      "email": "james.w@uni.edu",
      "faculty": "Engineering",
      "outstanding": 12500.0,
      "due_date": "2025-12-15",
      "days_overdue": 0,
      "status": "Due Today",
      "is_blocked": false,
      "last_reminder_sent": "2025-12-01"
    }
  ]
}
```

**Description:**
- Retrieves all students with `dues_balance > 0`
- Calculates due dates (30 days from first enrollment or uses `payment_due_date`)
- Determines status: "Overdue", "Due Today", "Due Soon", or "Unpaid"
- Calculates days overdue for each student
- Checks if student registration is blocked
- Retrieves last reminder sent date from notifications
- Provides summary statistics for dashboard display

---

#### PUT /api/finance/action/penalty/<student_id>

Applies a late fee penalty to a student. Updates the student's dues balance, creates a `Penalty` record, and sends a notification.

**Authentication:** Required (JWT)  
**Authorization:** Admin user

**Request Body:**
```json
{
  "penalty_amount": 50.0,
  "penalty_type": "LATE_FEE",
  "notes": "Late payment penalty - 11 days overdue"
}
```

**Response (200 OK):**
```json
{
  "msg": "Penalty applied successfully",
  "student_id": 12,
  "penalty_amount": 50.0,
  "new_dues_balance": 8550.0,
  "penalty_id": 1
}
```

**Description:**
- Adds penalty amount to student's `dues_balance`
- Creates `Penalty` record with type, amount, and notes
- Records which admin applied the penalty
- Creates notification for the student
- Logs action in `ActionLog` for audit trail
- Used when finance admin applies late fees

---

#### PUT /api/finance/action/block/<student_id>

Blocks a student's registration due to unpaid dues. Sets `is_blocked=true`, records blocking reason, and prevents future course enrollments.

**Authentication:** Required (JWT)  
**Authorization:** Admin user

**Request Body:**
```json
{
  "block_type": "REGISTRATION",
  "reason": "Outstanding dues over 7 days",
  "notes": "Blocked due to unpaid fees"
}
```

**Response (200 OK):**
```json
{
  "msg": "Registration blocked successfully",
  "student_id": 12,
  "blocked_at": "2025-12-10T15:30:00",
  "block_type": "REGISTRATION"
}
```

**Description:**
- Sets `is_blocked=true` on student record
- Records `blocked_at` timestamp
- Stores `blocked_reason` for reference
- Creates notification informing student of block
- Logs blocking action in `ActionLog`
- Prevents student from enrolling in new courses until unblocked

---

#### POST /api/finance/action/bulk-reminder

Sends payment reminders to multiple students at once. Creates notifications for each student and logs bulk action.

**Authentication:** Required (JWT)  
**Authorization:** Admin user

**Request Body:**
```json
{
  "student_ids": [1, 2, 3, 4, 5],
  "message_template": "default",
  "contact_method": "EMAIL"
}
```
Or send to all unpaid students:
```json
{
  "student_ids": "all",
  "message_template": "urgent",
  "contact_method": "EMAIL"
}
```

**Response (200 OK):**
```json
{
  "msg": "Bulk reminders sent successfully",
  "sent_count": 5,
  "failed_count": 0,
  "notifications_created": 5,
  "details": [
    {"student_id": 1, "status": "sent"},
    {"student_id": 2, "status": "sent"}
  ]
}
```

**Description:**
- Accepts list of student IDs or "all" for all unpaid students
- Creates `PAYMENT_REMINDER` notification for each student
- Supports message templates: "default" or "urgent"
- Records contact method (EMAIL, SMS, PHONE)
- Logs bulk action in `ActionLog`
- Returns detailed results for each student
- Used for mass reminder campaigns

---

#### POST /api/finance/action/bulk-penalty

Applies late fee penalties to multiple overdue students at once. Updates dues balances, creates penalty records, and sends notifications.

**Authentication:** Required (JWT)  
**Authorization:** Admin user

**Request Body:**
```json
{
  "student_ids": [3, 5, 7],
  "penalty_amount": 50.0,
  "penalty_type": "LATE_FEE",
  "notes": "Bulk penalty for overdue payments"
}
```

**Response (200 OK):**
```json
{
  "msg": "Bulk penalties applied successfully",
  "applied_count": 3,
  "failed_count": 0,
  "total_penalty_amount": 150.0,
  "details": [
    {"student_id": 3, "status": "applied", "new_dues": 5050.0},
    {"student_id": 5, "status": "applied", "new_dues": 12550.0}
  ]
}
```

**Description:**
- Applies same penalty amount to multiple students
- Updates each student's `dues_balance`
- Creates `Penalty` record for each student
- Sends notification to each affected student
- Logs bulk action in `ActionLog`
- Returns summary and per-student results
- Used for automated late fee application

---

#### POST /api/finance/action/bulk-block

Blocks registrations for multiple severely overdue students. Sets blocking flags, records reasons, and sends notifications.

**Authentication:** Required (JWT)  
**Authorization:** Admin user

**Request Body:**
```json
{
  "student_ids": [3, 5],
  "block_type": "REGISTRATION",
  "reason": "Outstanding dues over 7 days"
}
```

**Response (200 OK):**
```json
{
  "msg": "Bulk registrations blocked successfully",
  "blocked_count": 2,
  "details": [
    {"student_id": 3, "blocked_at": "2025-12-10T15:30:00"},
    {"student_id": 5, "blocked_at": "2025-12-10T15:30:00"}
  ]
}
```

**Description:**
- Blocks multiple students' registrations at once
- Sets `is_blocked=true` for each student
- Records `blocked_at` timestamp and `blocked_reason`
- Sends notification to each blocked student
- Logs bulk blocking action in `ActionLog`
- Used for mass blocking of severely overdue students
- Prevents blocked students from enrolling in courses

---

## Notes on Alyan's New APIs

### Database Models Added

The following new models were added to support these APIs:

1. **FeeStructure**: Stores fee categories and items (tuition, bus, other fees)
2. **BankTransaction**: Tracks bank transactions for reconciliation
3. **GeneratedReport**: Stores generated reports for download and history
4. **Penalty**: Records late fee penalties applied to students

### User Model Extensions

The `User` model was extended with the following fields:
- `is_blocked`: Boolean flag to block student registration
- `blocked_at`: Timestamp when student was blocked
- `blocked_reason`: Reason for blocking
- `payment_due_date`: Calculated payment due date

### Key Features

1. **Comprehensive Financial Dashboard**: Real-time statistics and metrics
2. **Advanced Student Management**: Search, filter, and detailed student views
3. **Flexible Fee Structure**: Dynamic fee categories with per-credit support
4. **Bank Reconciliation**: Automated matching and manual reconciliation
5. **Multi-Format Reporting**: JSON, PDF, and Excel export capabilities
6. **Unpaid Student Management**: Bulk actions for reminders, penalties, and blocking
7. **Audit Trail**: All actions logged in `ActionLog` for compliance

### Error Handling

All endpoints include comprehensive error handling:
- Input validation for all request parameters
- Database transaction rollback on errors
- Detailed error messages for debugging
- Safe attribute access for new model fields (using `getattr`/`setattr`)

### Security

- All endpoints require JWT authentication
- Admin-only access enforced via `@require_admin` decorator
- Role-based access control (RBAC) throughout
- Input sanitization and validation

---

**End of Documentation**
