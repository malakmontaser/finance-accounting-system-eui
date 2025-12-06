# Student Management and Finance System - Backend API

A robust, production-ready backend API for managing student registration, course enrollment, and financial transactions. Built with **Flask** and **SQLAlchemy**, featuring JWT authentication, role-based access control, and comprehensive financial reporting.

## Features

- **User Management:** Student registration, authentication, and admin user management
- **Course Management:** Create and manage courses with fee structures
- **Course Enrollment:** Students can enroll in courses with automatic dues calculation
- **Payment Processing:** Record and track student payments with atomic transactions
- **Financial Reporting:** Comprehensive reports on outstanding dues and payment status
- **Notification System:** Automated notifications for key events
- **Action Logging:** Audit trail for all administrative actions
- **JWT Authentication:** Secure token-based authentication
- **Role-Based Access Control (RBAC):** Admin-only endpoints for sensitive operations

## Technology Stack

- **Framework:** Flask 3.1.2
- **Database:** MySQL 8.0
- **ORM:** SQLAlchemy 2.0.44
- **Authentication:** Flask-JWT-Extended 4.7.1
- **Password Hashing:** Passlib with PBKDF2-SHA256
- **Migration Tool:** Flask-Migrate 4.1.0
- **CORS:** Flask-CORS 6.0.1

## Project Structure

```
backend/
├── app.py                      # Flask application factory
├── config.py                   # Configuration management
├── models.py                   # SQLAlchemy data models
├── seed.py                     # Database seeding script
├── requirements.txt            # Python dependencies
├── .env                        # Environment variables (local)
├── Dockerfile                  # Docker container definition
├── API_DOCUMENTATION.md        # Complete API documentation
├── README.md                   # This file
├── routes/
│   ├── auth.py                # Authentication endpoints
│   ├── students.py            # Student endpoints
│   ├── finance.py             # Finance department endpoints
│   └── courses.py             # Course management endpoints
├── services/
│   └── (service layer for business logic)
└── utils/
    └── (utility functions and decorators)
```

## Installation

### Prerequisites

- Python 3.8 or higher
- MySQL 8.0 or higher
- pip (Python package manager)
- virtualenv (recommended)

### Step 1: Clone and Setup

```bash
cd /home/ubuntu/backend
```

### Step 2: Create Virtual Environment (Recommended)

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Configure Environment Variables

Create a `.env` file in the backend directory with the following content:

```env
# Database Configuration
DB_USER=fas_user
DB_PASSWORD=StrongPassword123!
DB_HOST=localhost
DB_PORT=3306
DB_NAME=fas_db

# Flask Configuration
SECRET_KEY=your-secret-key-here-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key-here-change-in-production
FLASK_ENV=development
FLASK_APP=app.py
```

### Step 5: Initialize Database

```bash
# Create database tables
flask db init
flask db migrate -m "Initial migration"
flask db upgrade

# Or use the seed script to create tables and populate sample data
python seed.py
```

### Step 6: Run the Application

```bash
flask run
```

The API will be available at `http://localhost:5000`

## Docker Deployment

### Local Development with Docker Compose

A `docker-compose.yml` file is provided for local development:

```bash
docker-compose up -d
```

This will start:
- MySQL database on port 3306
- Flask API on port 5000

### Deploying to Docker Hub (For Team Sharing)

**Step 1: Build and Push Image**

On Windows (PowerShell):
```powershell
.\deploy.ps1 v1.0.0 yourusername
```

On Linux/Mac:
```bash
chmod +x deploy.sh
./deploy.sh v1.0.0 yourusername
```

Or manually:
```bash
cd backend
docker build -t seifwafeek/finance-accounting-api:latest .
docker login
docker push seifwafeek/finance-accounting-api:latest
```

**Step 2: Share with Team**

Your teammates can then use:
```bash
# Create .env file with your image name
echo "DOCKER_IMAGE=seifwafeek/finance-accounting-api:latest" > .env

# Run with production compose
docker-compose -f docker-compose.prod.yml up -d
```

See [DEPLOYMENT.md](../DEPLOYMENT.md) for detailed deployment instructions.

### Manual Docker Build

```bash
docker build -t student-finance-api ./backend
docker run -p 5000:5000 --env-file .env student-finance-api
```

## API Endpoints Overview

### Authentication
- `POST /api/auth/register` - Register a new student
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/register-admin` - Register an admin user

### Student Endpoints
- `POST /api/students/enroll` - Enroll in a course
- `POST /api/students/pay` - Make a payment
- `GET /api/students/status` - Get enrollment and dues status
- `GET /api/students/payments` - Get payment history

### Course Management
- `GET /api/courses` - List all courses
- `GET /api/courses/<id>` - Get course details
- `POST /api/courses` - Create a course (Admin only)
- `PUT /api/courses/<id>` - Update a course (Admin only)
- `DELETE /api/courses/<id>` - Delete a course (Admin only)

### Finance Department (Admin Only)
- `GET /api/finance/dues` - List students with outstanding dues
- `GET /api/finance/unpaid-report` - Generate unpaid report
- `PUT /api/finance/action/contact/<student_id>` - Log contact action
- `POST /api/finance/record-payment` - Record external payment
- `GET /api/finance/reports/status` - Generate status report (Pass/Fail)

For detailed endpoint documentation, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

## Testing the API

### Using cURL

**Register a student:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student1",
    "email": "student1@example.com",
    "password": "password123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student1",
    "password": "password123"
  }'
```

**Get student status (requires JWT token):**
```bash
curl -X GET http://localhost:5000/api/students/status \
  -H "Authorization: Bearer <access_token>"
```

### Using Postman

1. Import the API endpoints into Postman
2. Set up environment variables for `base_url` and `access_token`
3. Use the provided request templates to test endpoints

### Using the Seed Script

The `seed.py` script populates the database with sample data:

```bash
python seed.py
```

This creates:
- 1 admin user (username: `admin`, password: `admin123`)
- 5 student users (username: `student1-5`, password: `pass123`)
- 5 sample courses
- Sample enrollments and payments

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts (students and admins) |
| `courses` | Course definitions |
| `enrollments` | Student course enrollments |
| `payments` | Payment transactions |
| `notifications` | System notifications |
| `action_logs` | Administrative action audit trail |

### Key Relationships

```
User (1) ----< (M) Enrollment >---- (1) Course
User (1) ----< (M) Payment
User (1) ----< (M) Notification
User (1) ----< (M) ActionLog
```

## Core Business Logic

### 1. Automated Due Calculation

When a student enrolls in a course:
- An `Enrollment` record is created
- The course fee is captured at enrollment time
- The student's `dues_balance` is updated atomically
- Notifications are created for the student and finance department

### 2. Atomic Payment Processing

When a payment is recorded:
- A `Payment` record is created
- The student's `dues_balance` is reduced in the same transaction
- Notifications are generated
- All changes are committed together or rolled back on error

### 3. Notification and Audit Trail

Key events are tracked through:
- **Notifications:** Student-facing messages about enrollments, payments, and contact requests
- **ActionLogs:** Admin-facing audit trail of all administrative actions

## Security Features

- **Password Hashing:** PBKDF2-SHA256 algorithm
- **JWT Authentication:** Secure token-based authentication with 8-hour expiration
- **Role-Based Access Control:** Admin endpoints enforce `is_admin=true` check
- **Input Validation:** All user inputs are validated before processing
- **Atomic Transactions:** Critical operations use database transactions
- **CORS:** Configurable cross-origin resource sharing

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_USER` | Database user | fas_user |
| `DB_PASSWORD` | Database password | StrongPassword123! |
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 3306 |
| `DB_NAME` | Database name | fas_db |
| `SECRET_KEY` | Flask secret key | dev-secret |
| `JWT_SECRET_KEY` | JWT secret key | jwt-secret |
| `FLASK_ENV` | Flask environment | development |

### JWT Configuration

- **Token Expiration:** 8 hours (configurable in `config.py`)
- **Algorithm:** HS256 (HMAC with SHA-256)
- **Claims:** `id`, `username`, `is_admin`

## Error Handling

The API returns standard HTTP status codes with error messages:

```json
{
  "error": "Description of the error"
}
```

### Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Internal Server Error |

## Development

### Running in Development Mode

```bash
export FLASK_ENV=development
export FLASK_APP=app.py
flask run
```

### Database Migrations

```bash
# Create a new migration
flask db migrate -m "Description of changes"

# Apply migrations
flask db upgrade

# Revert to previous migration
flask db downgrade
```

### Debugging

Enable debug mode in `.env`:
```env
FLASK_ENV=development
```

The Flask development server includes:
- Automatic code reloading
- Interactive debugger
- Request/response logging

## Production Deployment

### Pre-Deployment Checklist

- [ ] Change `SECRET_KEY` and `JWT_SECRET_KEY` to strong random values
- [ ] Set `FLASK_ENV=production`
- [ ] Use a production database (not SQLite)
- [ ] Enable HTTPS/SSL
- [ ] Set up proper logging
- [ ] Configure database backups
- [ ] Set up monitoring and alerts
- [ ] Review security headers

### Recommended Production Setup

- **Web Server:** Gunicorn or uWSGI
- **Reverse Proxy:** Nginx or Apache
- **Database:** MySQL with replication
- **Caching:** Redis
- **Monitoring:** Prometheus + Grafana
- **Logging:** ELK Stack (Elasticsearch, Logstash, Kibana)

### Example Gunicorn Command

```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:create_app()
```

## Troubleshooting

### Database Connection Error

**Error:** `pymysql.err.OperationalError: (2003, "Can't connect to MySQL server")`

**Solution:**
1. Ensure MySQL is running
2. Check database credentials in `.env`
3. Verify database host and port
4. Create the database if it doesn't exist:
   ```sql
   CREATE DATABASE fas_db;
   CREATE USER 'fas_user'@'localhost' IDENTIFIED BY 'StrongPassword123!';
   GRANT ALL PRIVILEGES ON fas_db.* TO 'fas_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

### JWT Token Errors

**Error:** `Missing or invalid token`

**Solution:**
1. Ensure token is included in `Authorization` header
2. Use format: `Authorization: Bearer <token>`
3. Check token expiration (8 hours)
4. Verify `JWT_SECRET_KEY` matches

### Port Already in Use

**Error:** `Address already in use`

**Solution:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or use a different port
flask run --port 5001
```

## Future Enhancements

- [ ] Implement refresh token mechanism
- [ ] Add email notification service integration
- [ ] Integrate payment gateway (Stripe, PayPal)
- [ ] Generate student transcripts
- [ ] Implement course prerequisites and scheduling
- [ ] Add bulk import/export functionality
- [ ] Advanced reporting and analytics
- [ ] Two-factor authentication (2FA)
- [ ] API rate limiting
- [ ] Comprehensive logging and monitoring
- [ ] WebSocket support for real-time notifications

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add your feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit a pull request

## License

This project is proprietary and confidential.

## Support

For issues, questions, or feature requests, please contact the development team.

## Authors

- **Manus AI** - Initial implementation

## Changelog

### Version 1.0.0 (December 5, 2025)
- Initial release
- Complete API implementation
- Database models and migrations
- JWT authentication and RBAC
- Financial reporting features
- Notification and audit logging

---

**Last Updated:** December 5, 2025
