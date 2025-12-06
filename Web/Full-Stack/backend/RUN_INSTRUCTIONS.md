# How to Run the Finance Accounting System Backend

## Prerequisites
- Python 3.11+ (if running locally)
- Docker and Docker Compose (if using Docker)
- MySQL database (provided by Docker Compose)

## Option 1: Using Docker Compose (Recommended)

### Step 1: Create Environment File
Create a `.env` file in the `backend` directory with the following content:

```env
DB_USER=fas_user
DB_PASSWORD=StrongPassword123!
DB_HOST=mysql
DB_PORT=3306
DB_NAME=fas_db
SECRET_KEY=your-secret-key-here-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key-here-change-in-production
```

### Step 2: Start Services
From the project root directory (where `docker-compose.yml` is located):

```bash
docker-compose up --build
```

This will:
- Start MySQL database on port 3306
- Build and start the Flask API on port 5000

### Step 3: Seed the Database (in a new terminal)
```bash
docker-compose exec api python seed.py
```

### Step 4: Access the API
- API Base URL: `http://localhost:5000`
- Health Check: `http://localhost:5000/api/health`

## Option 2: Running Locally (Without Docker)

### Step 1: Activate Virtual Environment
```bash
cd backend
# On Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# On Windows (CMD)
venv\Scripts\activate.bat

# On Linux/Mac
source venv/bin/activate
```

### Step 2: Install Dependencies (if not already installed)
```bash
pip install -r requirements.txt
```

### Step 3: Set Up Environment Variables
Create a `.env` file in the `backend` directory:

```env
DB_USER=fas_user
DB_PASSWORD=StrongPassword123!
DB_HOST=localhost
DB_PORT=3306
DB_NAME=fas_db
SECRET_KEY=your-secret-key-here-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key-here-change-in-production
```

**Note:** Make sure MySQL is running locally and the database exists, or start it with Docker:
```bash
docker-compose up mysql -d
```

### Step 4: Run Database Migrations (if needed)
```bash
flask db upgrade
```

### Step 5: Seed the Database
```bash
python seed.py
```

### Step 6: Run the Application
```bash
python app.py
```

Or using Flask CLI:
```bash
flask run
```

The API will be available at: `http://localhost:5000`

## Testing the API

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Register a Student
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "email": "test@example.com", "password": "test123"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

## Default Credentials (from seed.py)

**Admin:**
- Username: `admin`
- Password: `admin123`

**Students:**
- Username: `student1`, `student2`, etc.
- Password: `pass123`

## Troubleshooting

### Port Already in Use
If port 5000 is already in use, change it in `app.py`:
```python
app.run(debug=True, port=5001)
```

### Database Connection Error
- Check that MySQL is running
- Verify `.env` file has correct database credentials
- Ensure database `fas_db` exists

### Module Not Found Errors
- Make sure virtual environment is activated
- Run `pip install -r requirements.txt`

## Stopping the Application

### Docker Compose
```bash
docker-compose down
```

### Local Python
Press `Ctrl+C` in the terminal where the app is running

