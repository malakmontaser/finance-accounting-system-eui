# 🔧 Quick Fix: Authorization Header Error

## Problem
```
{
    "msg": "Bad Authorization header. Expected 'Authorization: Bearer <JWT>'"
}
```

## Solution

### **Step 1: Set Up Environment in Postman**

1. **Create/Select Environment:**
   - Click the **gear icon** (⚙️) in top-right corner of Postman
   - Click **"Add"** to create new environment OR select existing one
   - Name it: `Finance API Local`

2. **Add Variables:**
   - `base_url` = `http://127.0.0.1:5000`
   - `admin_token` = (leave empty for now)

3. **Select the Environment:**
   - Click the dropdown in top-right (next to gear icon)
   - Select your environment: `Finance API Local`

---

### **Step 2: Login as Admin to Get Token**

1. **Open the "Login Admin" request** in Postman:
   - Go to: `Authentication` → `Login Admin`

2. **Check the Request:**
   - Method: `POST`
   - URL: `{{base_url}}/api/auth/login`
   - Body:
     ```json
     {
         "username": "admin",
         "password": "admin123"
     }
     ```

3. **Send the Request:**
   - Click **"Send"**
   - You should get a response like:
     ```json
     {
         "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
         "user_id": 1,
         "username": "admin",
         "is_admin": true
     }
     ```

4. **Verify Token is Saved:**
   - The Postman collection has a **Test Script** that automatically saves the token
   - Check your environment variables:
     - Click the **eye icon** (👁️) in top-right
     - Look for `admin_token` - it should have a long JWT token value
   - If it's empty, manually copy the `access_token` from the response and paste it into `admin_token`

---

### **Step 3: Test the Finance Summary Endpoint**

1. **Open "Get Finance Summary (Dashboard)" request**

2. **Check the Authorization Header:**
   - Go to **"Headers"** tab
   - Look for:
     ```
     Key: Authorization
     Value: Bearer {{admin_token}}
     ```
   - Make sure there's a **space** between `Bearer` and `{{admin_token}}`

3. **Verify Environment Variable:**
   - In the **"Headers"** tab, hover over `{{admin_token}}`
   - It should show the actual token value
   - If it shows `undefined` or empty, go back to Step 2

4. **Send the Request:**
   - Click **"Send"**
   - You should get a successful response with financial data

---

## ✅ Verification Checklist

Before testing, make sure:

- [ ] Environment is **selected** (dropdown in top-right shows your environment name)
- [ ] `base_url` variable is set to `http://127.0.0.1:5000`
- [ ] `admin_token` variable has a value (long JWT token string)
- [ ] Authorization header shows: `Bearer {{admin_token}}` (with space)
- [ ] Flask backend server is running

---

## 🐛 Common Issues

### **Issue 1: Token is "undefined"**
**Solution:**
- Make sure you ran "Login Admin" request first
- Check that the Test Script ran (look for green checkmark in "Test Results" tab)
- Manually copy `access_token` from login response and paste into `admin_token` variable

### **Issue 2: "401 Unauthorized"**
**Solution:**
- Token might be expired (JWT tokens expire after some time)
- Run "Login Admin" again to get a fresh token

### **Issue 3: "403 Forbidden"**
**Solution:**
- You're logged in as a student, not admin
- Make sure you're using the "Login Admin" request, not "Login Student"
- Check that the user has `is_admin: true` in the database

### **Issue 4: Environment variable not updating**
**Solution:**
- Make sure you **selected** the environment (dropdown in top-right)
- Close and reopen Postman
- Manually set the variable: Click eye icon → Edit → Set `admin_token` value

---

## 📝 Manual Token Setup (If Auto-Save Fails)

If the automatic token saving doesn't work:

1. **After logging in**, copy the `access_token` value from the response
2. **Click the eye icon** (👁️) in top-right of Postman
3. **Click "Edit"** next to your environment
4. **Find `admin_token`** variable
5. **Paste the token** into the "Current Value" field
6. **Click "Save"**

---

## 🎯 Quick Test

**Test if everything is working:**

1. Run: `POST {{base_url}}/api/auth/login` (Login Admin)
2. Check: `admin_token` variable is set
3. Run: `GET {{base_url}}/api/finance/summary`
4. Expected: Success response with financial data

---

**If you still have issues, check:**
- Flask server console for error messages
- Postman Console (View → Show Postman Console) for request details
- That the Authorization header is exactly: `Bearer {{admin_token}}` (with space!)

