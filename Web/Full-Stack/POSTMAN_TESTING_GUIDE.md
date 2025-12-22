# Postman Testing Guide - New Finance Dashboard APIs

## 🚀 Quick Start

### 1. **Setup Environment Variables in Postman**

1. Open Postman
2. Click on **Environments** → **Create Environment** (or use existing)
3. Add these variables:
   - `base_url`: `http://127.0.0.1:5000` (or your Flask server URL)
   - `admin_token`: (will be set automatically after login)

### 2. **Get Admin Token**

**Request:** `POST {{base_url}}/api/auth/login`

**Body:**
```json
{
    "username": "admin",
    "password": "admin123"
}
```

**Response:** Copy the `access_token` and set it as `admin_token` in your environment.

---

## 📋 New Dashboard APIs to Test

### **1. GET /api/finance/summary**
**Purpose:** Get overall financial summary statistics

**Request:**
- **Method:** `GET`
- **URL:** `{{base_url}}/api/finance/summary`
- **Headers:**
  ```
  Authorization: Bearer {{admin_token}}
  ```

**Expected Response (200 OK):**
```json
{
    "total_collected": 2400000.0,
    "total_collected_change": 12.5,
    "total_students": 2847,
    "total_students_change": 5.3,
    "pending_payments": 125000.0,
    "pending_payments_change": -8.2,
    "unpaid_students": 142,
    "unpaid_students_change": -3.1
}
```

**What to Check:**
- ✅ Status code is 200
- ✅ All fields are present
- ✅ Numbers are positive (or negative for changes)
- ✅ Change percentages are reasonable (-100% to +100%)

---

### **2. GET /api/finance/payments/recent**
**Purpose:** Get list of recent payments with student info

**Request:**
- **Method:** `GET`
- **URL:** `{{base_url}}/api/finance/payments/recent?limit=5&offset=0`
- **Headers:**
  ```
  Authorization: Bearer {{admin_token}}
  ```
- **Query Parameters:**
  - `limit` (optional): Number of payments to return (default: 10)
  - `offset` (optional): Number of payments to skip (default: 0)

**Expected Response (200 OK):**
```json
{
    "payments": [
        {
            "id": 1,
            "student_id": 2,
            "student_name": "John Smith",
            "faculty": "Engineering",
            "amount": 2916.67,
            "date": "2025-12-10T10:30:00",
            "status": "Paid",
            "payment_method": "ONLINE"
        }
    ],
    "total": 50,
    "limit": 5,
    "offset": 0
}
```

**What to Check:**
- ✅ Status code is 200
- ✅ `payments` array contains payment objects
- ✅ Each payment has: `id`, `student_name`, `faculty`, `amount`, `date`, `status`
- ✅ Pagination works (try different `limit` and `offset` values)

**Test Cases:**
- `limit=5` → Should return 5 payments
- `limit=10&offset=5` → Should return payments 6-15
- `limit=1` → Should return 1 payment

---

### **3. GET /api/finance/payments/by-faculty**
**Purpose:** Get payment collection progress grouped by faculty

**Request:**
- **Method:** `GET`
- **URL:** `{{base_url}}/api/finance/payments/by-faculty`
- **Headers:**
  ```
  Authorization: Bearer {{admin_token}}
  ```

**Expected Response (200 OK):**
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
        {
            "name": "Computer Science",
            "collected": 620000.0,
            "total": 750000.0,
            "percentage": 82.67,
            "color": "#fbbf24"
        },
        {
            "name": "Digital Arts",
            "collected": 280000.0,
            "total": 400000.0,
            "percentage": 70.0,
            "color": "#3b82f6"
        },
        {
            "name": "Business Informatics",
            "collected": 450000.0,
            "total": 500000.0,
            "percentage": 90.0,
            "color": "#10b981"
        }
    ]
}
```

**What to Check:**
- ✅ Status code is 200
- ✅ `faculties` array contains faculty objects
- ✅ Each faculty has: `name`, `collected`, `total`, `percentage`, `color`
- ✅ `collected` ≤ `total` (collected should never exceed total)
- ✅ `percentage` = (collected / total) * 100
- ✅ `percentage` is between 0 and 100

**Test Cases:**
- Check that all faculties from your database are included
- Verify percentages are calculated correctly
- Check that colors are valid hex codes

---

### **4. GET /api/finance/bank-reconciliation**
**Purpose:** Get bank transactions with reconciliation status

**Request:**
- **Method:** `GET`
- **URL:** `{{base_url}}/api/finance/bank-reconciliation?limit=10&offset=0`
- **Headers:**
  ```
  Authorization: Bearer {{admin_token}}
  ```
- **Query Parameters:**
  - `limit` (optional): Number of transactions to return (default: 10)
  - `offset` (optional): Number of transactions to skip (default: 0)

**Expected Response (200 OK):**
```json
{
    "message": "Bank reconciliation feature coming soon. BankTransaction model needs to be created.",
    "transactions": []
}
```

**Note:** This endpoint currently returns a placeholder message because the `BankTransaction` model hasn't been created yet. Once the model is added to the database, it will return actual transaction data.

**What to Check:**
- ✅ Status code is 200
- ✅ Response contains a message explaining the placeholder
- ✅ `transactions` array is present (even if empty)

---

## 🔒 Authentication Requirements

**All endpoints require:**
- ✅ Valid JWT token in `Authorization` header
- ✅ Token must belong to an **admin user** (`is_admin = True`)
- ✅ Token format: `Bearer <token>`

**If you get 401 Unauthorized:**
1. Make sure you're logged in as admin
2. Check that the token is set in the `Authorization` header
3. Verify the token hasn't expired

**If you get 403 Forbidden:**
- The user is authenticated but not an admin
- Make sure you're using an admin account

---

## 🧪 Testing Checklist

### **Before Testing:**
- [ ] Flask backend server is running (`python app.py`)
- [ ] Database is seeded with sample data (`python seed.py`)
- [ ] Postman environment variables are set
- [ ] Admin token is obtained and set

### **Test Each Endpoint:**
- [ ] **Summary API** - Returns all statistics correctly
- [ ] **Recent Payments API** - Returns payment list with pagination
- [ ] **Payments by Faculty API** - Returns faculty breakdown
- [ ] **Bank Reconciliation API** - Returns placeholder message

### **Error Handling:**
- [ ] Test without token (should return 401)
- [ ] Test with invalid token (should return 401)
- [ ] Test with student token (should return 403)
- [ ] Test with invalid query parameters (should handle gracefully)

---

## 📊 Expected Data Ranges

Based on seed data, you should see:

| Metric | Expected Range |
|--------|---------------|
| Total Collected | $100,000 - $3,000,000 |
| Total Students | 5 - 50 (depending on seed) |
| Unpaid Students | 0 - 20 |
| Pending Payments | $0 - $200,000 |
| Recent Payments | 0 - 50 records |
| Faculties | 4 (Engineering, Computer Science, Digital Arts, Business Informatics) |

---

## 🐛 Troubleshooting

### **Issue: "No data returned"**
- **Solution:** Run `python seed.py` to populate the database

### **Issue: "401 Unauthorized"**
- **Solution:** Login again and update the `admin_token` variable

### **Issue: "500 Internal Server Error"**
- **Solution:** Check Flask console for error messages
- **Common causes:**
  - Database not initialized
  - Missing `faculty` field in `Course` model (run migration)
  - SQL query errors

### **Issue: "Empty faculty data"**
- **Solution:** Make sure courses have `faculty` field populated
- Run seed script again: `python seed.py`

---

## 📝 Notes

1. **Faculty Field:** The `faculty` field was recently added to the `Course` model. Make sure to:
   - Run database migration to add the column
   - Re-seed the database to populate faculty values

2. **Bank Reconciliation:** This endpoint is a placeholder until the `BankTransaction` model is created. It will return empty data for now.

3. **Change Percentages:** Some change percentages are calculated from historical data. If you don't have historical data, they may show as 0 or placeholder values.

---

## ✅ Success Criteria

All APIs are working correctly if:
- ✅ All 4 endpoints return 200 status codes
- ✅ Response data matches expected structure
- ✅ No errors in Flask console
- ✅ Data values are reasonable and consistent
- ✅ Pagination works for endpoints that support it

---

**Happy Testing! 🎉**

