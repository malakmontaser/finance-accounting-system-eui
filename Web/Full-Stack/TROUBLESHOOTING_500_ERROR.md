# 🔧 Troubleshooting 500 Error: `/api/finance/payments/by-faculty`

## 🚨 Current Issue
The endpoint `/api/finance/payments/by-faculty` is returning a 500 Internal Server Error.

## 📋 Step-by-Step Diagnosis

### **Step 1: Check Flask Console for Error Message**

**Most Important:** Look at your Flask server console (where you ran `python app.py`). You should see an error message like:

```
ERROR in get_payments_by_faculty: [error message here]
Traceback: [full traceback]
```

**Common errors you might see:**

1. **`AttributeError: 'Course' object has no attribute 'faculty'`**
   - **Cause:** Database doesn't have the `faculty` column yet
   - **Fix:** Run database migration (see Step 2)

2. **`NameError: name 'Course' is not defined`**
   - **Cause:** Flask server wasn't restarted after adding Course import
   - **Fix:** Restart Flask server (see Step 3)

3. **`OperationalError: no such column: courses.faculty`**
   - **Cause:** Database schema is outdated
   - **Fix:** Run database migration (see Step 2)

4. **`NoResultFound` or empty query results**
   - **Cause:** No data in database
   - **Fix:** Run seed script (see Step 4)

---

### **Step 2: Check Database Schema**

The `faculty` field needs to exist in the `courses` table.

**Check if column exists:**
```sql
-- If using SQLite
.schema courses

-- Or check directly
PRAGMA table_info(courses);
```

**If column doesn't exist, add it:**

**Option A: Using Flask-Migrate (Recommended)**
```bash
# Create migration
flask db migrate -m "Add faculty field to Course model"

# Apply migration
flask db upgrade
```

**Option B: Manual SQL (Quick Fix)**
```sql
ALTER TABLE courses ADD COLUMN faculty VARCHAR(100);
```

---

### **Step 3: Restart Flask Server**

After making code changes, **always restart your Flask server**:

1. Stop the Flask server (Ctrl+C)
2. Start it again:
   ```bash
   python app.py
   ```

**Why?** Python needs to reload the modules with the new `Course` import.

---

### **Step 4: Seed Database with Faculty Data**

Make sure your database has courses with faculty values:

```bash
python seed.py
```

This will:
- Create sample courses with `faculty` field populated
- Create sample enrollments
- Create sample payments

---

### **Step 5: Verify Database Has Data**

Check if you have data in your database:

**Using Python:**
```python
from app import create_app
from models import db, Course, Enrollment

app = create_app()
with app.app_context():
    courses = Course.query.all()
    print(f"Total courses: {len(courses)}")
    for course in courses:
        print(f"Course: {course.name}, Faculty: {course.faculty}")
    
    enrollments = Enrollment.query.filter_by(status='ACTIVE').count()
    print(f"Active enrollments: {enrollments}")
```

**Expected output:**
```
Total courses: 5
Course: English Literature, Faculty: Digital Arts
Course: Computer Science, Faculty: Computer Science
...
Active enrollments: [some number > 0]
```

---

## 🔍 Quick Test Checklist

Before testing the endpoint, verify:

- [ ] Flask server is running (`python app.py`)
- [ ] Flask server was restarted after code changes
- [ ] Database has `faculty` column in `courses` table
- [ ] Database has sample data (run `python seed.py`)
- [ ] You're logged in as admin (have valid JWT token)
- [ ] Frontend is pointing to correct backend URL

---

## 🧪 Test the Endpoint Directly

**Using Postman or curl:**

```bash
# Get admin token first
curl -X POST http://127.0.0.1:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Copy the access_token from response, then:
curl -X GET http://127.0.0.1:5000/api/finance/payments/by-faculty \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected successful response:**
```json
{
  "faculties": [
    {
      "name": "Engineering",
      "collected": 850000.0,
      "total": 1000000.0,
      "percentage": 85.0,
      "color": "#10b981"
    },
    ...
  ]
}
```

---

## 🐛 Common Issues & Solutions

### **Issue 1: "AttributeError: 'Course' object has no attribute 'faculty'"**

**Solution:**
1. Add the column to database:
   ```sql
   ALTER TABLE courses ADD COLUMN faculty VARCHAR(100);
   ```
2. Update existing courses:
   ```sql
   UPDATE courses SET faculty = 'Computer Science' WHERE name LIKE '%Computer%';
   UPDATE courses SET faculty = 'Digital Arts' WHERE name LIKE '%English%';
   -- etc.
   ```
3. Or re-run seed script: `python seed.py`

---

### **Issue 2: Empty Response `{"faculties": []}`**

**Possible causes:**
- No active enrollments in database
- No courses in database
- All enrollments have status != 'ACTIVE'

**Solution:**
1. Run seed script: `python seed.py`
2. Check database:
   ```python
   from models import Enrollment
   active = Enrollment.query.filter_by(status='ACTIVE').count()
   print(f"Active enrollments: {active}")
   ```

---

### **Issue 3: "No module named 'models'" or Import Errors**

**Solution:**
1. Make sure you're running Flask from the correct directory
2. Check your `PYTHONPATH`
3. Verify `models.py` is in the `backend` folder

---

### **Issue 4: Frontend Request Going to Wrong URL**

**Check:** The error shows `localhost:5173` (frontend port) instead of `localhost:5000` (backend port).

**Solution:**
1. Check your frontend API configuration
2. Make sure proxy is set up correctly in `vite.config.js` or similar
3. Or update API base URL to point to `http://127.0.0.1:5000`

---

## 📝 Next Steps

1. **Check Flask console** - This will tell you the exact error
2. **Run database migration** - Add `faculty` column if missing
3. **Restart Flask server** - Reload code changes
4. **Re-seed database** - Ensure you have test data
5. **Test endpoint in Postman** - Verify it works independently
6. **Check frontend API config** - Ensure it's pointing to correct backend URL

---

## 💡 Still Having Issues?

**Share these details:**
1. The exact error message from Flask console
2. Output of: `python -c "from models import Course; print(Course.__table__.columns.keys())"`
3. Number of courses and enrollments in your database
4. Your Flask server startup logs

This will help identify the exact problem!

