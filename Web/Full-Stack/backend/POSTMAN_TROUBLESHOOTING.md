# Postman API Testing - Troubleshooting Guide

## Common Error: "Not enough segments"

This error occurs when the JWT token format is incorrect. Here's how to fix it:

### Problem
The error `{"msg": "Not enough segments"}` means the JWT token is malformed or not being sent correctly.

### Solutions

#### 1. Check Authorization Header Format

The Authorization header must be in this exact format:
```
Authorization: Bearer <your_token_here>
```

**In Postman:**
- Go to the **Headers** tab
- Add header: `Authorization`
- Value: `Bearer <paste_your_token_here>`
- **Important:** Include the word "Bearer" followed by a space, then the token

**Example:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJzdHVkZW50MSIsImlzX2FkbWluIjpmYWxzZX0.xxxxx
```

#### 2. Get a Valid Token First

**Step 1: Login to get token**
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
    "username": "admin",
    "password": "admin123"
}
```

**Step 2: Copy the `access_token` from response**
```json
{
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user_id": 1,
    "username": "admin",
    "is_admin": true,
    "dues_balance": 0.0
}
```

**Step 3: Use the token in subsequent requests**
- Copy the entire `access_token` value
- Add it to Authorization header as: `Bearer <token>`

#### 3. Common Mistakes

❌ **Wrong:**
```
Authorization: <token>
Authorization: Bearer<token>  (missing space)
Authorization: bearer <token>  (lowercase)
```

✅ **Correct:**
```
Authorization: Bearer <token>
```

#### 4. Using Postman Environment Variables

**Setup:**
1. Create environment variable `student_token` or `admin_token`
2. After login, save token to environment:
   - In Tests tab, add:
   ```javascript
   if (pm.response.code === 200) {
       var jsonData = pm.response.json();
       pm.environment.set("student_token", jsonData.access_token);
   }
   ```
3. Use in Authorization header:
   ```
   Bearer {{student_token}}
   ```

#### 5. Verify Token Format

A valid JWT token has **3 parts** separated by dots:
```
header.payload.signature
```

Example:
```
eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJzdHVkZW50MSJ9.xxxxx
```

If your token doesn't have 3 parts, it's invalid.

## Testing Workflow

### Step-by-Step Testing

1. **Health Check** (No auth needed)
   ```
   GET http://localhost:5000/api/health
   ```

2. **Login as Admin**
   ```
   POST http://localhost:5000/api/auth/login
   Body: {"username": "admin", "password": "admin123"}
   ```
   - Copy the `access_token` from response

3. **Use Admin Token**
   - Add header: `Authorization: Bearer <admin_token>`
   - Test admin endpoints:
     - `GET /api/finance/dues`
     - `GET /api/finance/unpaid-report`
     - `POST /api/courses`

4. **Login as Student**
   ```
   POST http://localhost:5000/api/auth/login
   Body: {"username": "student1", "password": "pass123"}
   ```
   - Copy the `access_token` from response

5. **Use Student Token**
   - Add header: `Authorization: Bearer <student_token>`
   - Test student endpoints:
     - `POST /api/students/enroll`
     - `GET /api/students/status`
     - `POST /api/students/pay`

## Default Credentials

After running `seed.py`:

- **Admin:**
  - Username: `admin`
  - Password: `admin123`

- **Students:**
  - Username: `student1`, `student2`, etc.
  - Password: `pass123`

## Quick Test Script

**In Postman Tests tab (for login request):**
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    
    // Save token to environment
    pm.environment.set("access_token", jsonData.access_token);
    pm.environment.set("user_id", jsonData.user_id);
    
    console.log("Token saved:", jsonData.access_token);
}
```

**Then use in other requests:**
- Header: `Authorization`
- Value: `Bearer {{access_token}}`

## Still Having Issues?

1. **Check if API is running:**
   ```
   GET http://localhost:5000/api/health
   ```

2. **Verify token is not expired:**
   - Tokens expire after 8 hours
   - Login again to get a new token

3. **Check token in JWT.io:**
   - Go to https://jwt.io
   - Paste your token to verify it's valid

4. **Check server logs:**
   - Look for detailed error messages in the Flask console

5. **Verify database is seeded:**
   ```bash
   python seed.py
   ```

## Error Messages Reference

| Error | Cause | Solution |
|-------|-------|----------|
| "Not enough segments" | Token format incorrect | Use `Bearer <token>` format |
| "Token has expired" | Token expired (8 hours) | Login again |
| "Invalid token" | Token is malformed | Get new token from login |
| "Authorization required" | Missing Authorization header | Add `Authorization: Bearer <token>` |
| "Admin access required" | User is not admin | Use admin credentials |

