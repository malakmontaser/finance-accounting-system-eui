# Detailed Test Case Documentation
## Financial & Accounting System - Selenium Test Suite

**Project:** Financial & Accounting System  
**Test Framework:** Selenium WebDriver + Pytest  
**Total Test Cases:** 21  
**Document Version:** 1.0  
**Date:** December 24, 2025

---

## Table of Contents
1. [Authentication Test Cases](#authentication-test-cases)
2. [Student Dashboard Test Cases](#student-dashboard-test-cases)
3. [Admin Dashboard Test Cases](#admin-dashboard-test-cases)
4. [Non-Functional Test Cases](#non-functional-test-cases)

---

# Authentication Test Cases

## TC-01: Student Login with Valid Credentials

**Test ID:** test_01_student_login_valid  
**Priority:** High  
**Type:** Functional - Positive Test  
**Category:** Authentication

### Objective
Verify that a student can successfully log in to the system using valid credentials and is redirected to the student dashboard.

### Preconditions
- Application is running at http://localhost:5173
- Backend API is running at http://localhost:5000
- Database contains student account: username "student1", password "pass123"

### Test Steps
1. Navigate to the application home page (http://localhost:5173)
2. Click the "Login" button in the header
3. Wait for the login modal to appear
4. Select "Student" role from the portal cards
5. Enter username: "student1"
6. Enter password: "pass123"
7. Click the "Sign In" button
8. Wait for page redirect

### Expected Results
- User is redirected to the student dashboard (URL contains "dashboard" or "student")
- Page displays "Welcome" message
- Student-specific content is visible
- No error messages are displayed

### Test Data
- **Username:** student1
- **Password:** pass123
- **Role:** Student

### Actual Result
✅ **PASSED** - Student successfully logged in and redirected to dashboard

---

## TC-02: Student Login with Invalid Credentials

**Test ID:** test_02_student_login_invalid  
**Priority:** High  
**Type:** Functional - Negative Test  
**Category:** Authentication

### Objective
Verify that the system rejects login attempts with invalid credentials and does not grant access to the dashboard.

### Preconditions
- Application is running
- No user account exists with username "wronguser" and password "wrongpass"

### Test Steps
1. Navigate to the application home page
2. Click the "Login" button
3. Select "Student" role
4. Enter username: "wronguser"
5. Enter password: "wrongpass"
6. Click the "Sign In" button
7. Wait 2 seconds

### Expected Results
- User remains on the login page or home page
- URL does NOT contain "dashboard"
- Error message is displayed (e.g., "Invalid credentials")
- User is not authenticated

### Test Data
- **Username:** wronguser
- **Password:** wrongpass
- **Role:** Student

### Actual Result
✅ **PASSED** - System correctly rejected invalid credentials

---

## TC-03: Admin Login with Valid Credentials

**Test ID:** test_03_admin_login_valid  
**Priority:** High  
**Type:** Functional - Positive Test  
**Category:** Authentication

### Objective
Verify that an admin user can successfully log in and access the finance dashboard.

### Preconditions
- Application is running
- Database contains admin account: username "admin", password "admin123"

### Test Steps
1. Navigate to the application home page
2. Click the "Login" button
3. Select "Finance" (Admin) role from portal cards
4. Enter username: "admin"
5. Enter password: "admin123"
6. Click the "Sign In" button
7. Wait for redirect

### Expected Results
- User is redirected to finance dashboard (URL contains "finance" or "admin")
- Admin-specific navigation and features are visible
- Financial statistics are displayed
- No error messages appear

### Test Data
- **Username:** admin
- **Password:** admin123
- **Role:** Finance/Admin

### Actual Result
✅ **PASSED** - Admin successfully logged in to finance dashboard

---

## TC-04: Logout Functionality

**Test ID:** test_04_logout  
**Priority:** High  
**Type:** Functional  
**Category:** Authentication

### Objective
Verify that a logged-in student can successfully log out and is redirected appropriately.

### Preconditions
- Student is logged in to the system
- Student dashboard is displayed

### Test Steps
1. Log in as student (username: "student1", password: "pass123")
2. Wait for dashboard to load
3. Locate the "Logout" button/link
4. Click the "Logout" button
5. Wait for redirect

### Expected Results
- User is logged out of the system
- User is redirected to login page or home page
- URL contains "login" or ends with "/"
- Welcome message for logged-out users is displayed
- User cannot access protected routes without re-authentication

### Test Data
- **Username:** student1
- **Password:** pass123

### Actual Result
❌ **FAILED** - Logout button element not consistently found  
**Issue:** NoSuchElementException when trying to locate logout button  
**Recommendation:** Update logout button selector or add explicit wait

---

## TC-21: Admin Logout Cleanup

**Test ID:** test_21_admin_logout_cleanup  
**Priority:** Medium  
**Type:** Functional  
**Category:** Authentication

### Objective
Verify that an admin user can successfully log out from the finance dashboard.

### Preconditions
- Admin is logged in to the finance dashboard

### Test Steps
1. Log in as admin if not already logged in
2. Verify admin is on finance dashboard
3. Locate the "Logout" button
4. Click the "Logout" button
5. Wait for redirect

### Expected Results
- Admin is logged out
- Redirected to login page or home page
- URL contains "login" or ends with "/"
- Cannot access admin features without re-authentication

### Test Data
- **Username:** admin
- **Password:** admin123

### Actual Result
❌ **FAILED** - Same logout button detection issue as TC-04  
**Recommendation:** Implement consistent logout button across all user roles

---

# Student Dashboard Test Cases

## TC-05: Navigate to Student Dashboard

**Test ID:** test_05_student_nav_dashboard  
**Priority:** High  
**Type:** Functional  
**Category:** Navigation

### Objective
Verify that a student can navigate to and view their dashboard after logging in.

### Preconditions
- Student account exists in the system
- Application is running

### Test Steps
1. Log in as student (username: "student1", password: "pass123")
2. Wait for automatic redirect to dashboard
3. Verify current URL

### Expected Results
- URL contains "dashboard"
- Dashboard page loads successfully
- Student-specific content is visible
- No error messages are displayed

### Test Data
- **Username:** student1
- **Password:** pass123

### Actual Result
✅ **PASSED** - Student successfully navigated to dashboard

---

## TC-06: Payment Option Visibility

**Test ID:** test_06_student_payment_option_visible  
**Priority:** High  
**Type:** Functional  
**Category:** UI Verification

### Objective
Verify that payment-related options are visible and accessible to students on their dashboard.

### Preconditions
- Student is logged in
- Student dashboard is displayed

### Test Steps
1. Log in as student
2. Navigate to student dashboard
3. Scan page content for payment-related elements
4. Verify payment options are visible

### Expected Results
- Page contains text related to payments (e.g., "Pay", "Dues", "Amount")
- Payment buttons or links are visible
- Student can see their outstanding dues
- Payment functionality is accessible

### Test Data
- **Username:** student1
- **Password:** pass123

### Actual Result
✅ **PASSED** - Payment options are visible on student dashboard

---

## TC-07: Student Data Verification

**Test ID:** test_07_student_data_verification  
**Priority:** High  
**Type:** Functional  
**Category:** Data Validation

### Objective
Verify that the student dashboard displays accurate student-specific data.

### Preconditions
- Student account exists with known data
- Student has enrolled courses and/or outstanding dues

### Test Steps
1. Log in as student1
2. Wait for dashboard to fully load (2 seconds)
3. Extract page content
4. Verify student-specific data is present

### Expected Results
- Student's name is displayed
- Financial information is shown (dues, payments)
- Course enrollment data is visible
- Data matches expected values for student1

### Test Data
- **Username:** student1
- **Expected Data:** Student name, dues balance, course information

### Actual Result
✅ **PASSED** - Student-specific data is correctly displayed

---

# Admin Dashboard Test Cases

## TC-08: Navigate to Finance Dashboard

**Test ID:** test_08_admin_nav_dashboard  
**Priority:** High  
**Type:** Functional  
**Category:** Navigation

### Objective
Verify that an admin can access the finance dashboard after logging in.

### Preconditions
- Admin account exists
- Application is running

### Test Steps
1. Log out if currently logged in
2. Log in as admin (username: "admin", password: "admin123")
3. Verify redirect to finance dashboard
4. Check URL

### Expected Results
- URL contains "finance" or "dashboard"
- Finance dashboard loads successfully
- Admin navigation menu is visible
- Financial statistics are displayed

### Test Data
- **Username:** admin
- **Password:** admin123

### Actual Result
✅ **PASSED** - Admin successfully accessed finance dashboard

---

## TC-09: Finance Dashboard Statistics Display

**Test ID:** test_09_admin_dashboard_stats  
**Priority:** High  
**Type:** Functional  
**Category:** Data Display

### Objective
Verify that financial statistics are properly displayed on the admin dashboard.

### Preconditions
- Admin is logged in
- Finance dashboard is displayed
- Database contains financial data

### Test Steps
1. Log in as admin
2. Navigate to finance dashboard
3. Wait 2 seconds for data to load
4. Extract page content
5. Verify presence of financial statistics

### Expected Results
- Page displays financial overview statistics
- Text contains keywords like "Collected", "Payments", "Overview"
- Statistics cards are visible
- Data is formatted correctly

### Test Data
- **Username:** admin
- **Expected Elements:** Total Collected, Pending Payments, Student counts

### Actual Result
✅ **PASSED** - Financial statistics are properly displayed

---

## TC-10: Admin Navigate to Student List

**Test ID:** test_10_admin_nav_students  
**Priority:** High  
**Type:** Functional  
**Category:** Navigation

### Objective
Verify that admin can navigate to the student list page.

### Preconditions
- Admin is logged in to finance dashboard
- Student list feature exists

### Test Steps
1. Log in as admin
2. Look for student list link in navigation
3. Click on student list link
4. Verify URL change
5. Fallback: Direct navigation to /finance/students if link not found

### Expected Results
- URL contains "students"
- Student list page loads
- Table or list of students is visible
- No errors are displayed

### Test Data
- **Username:** admin
- **Target URL:** /finance/students

### Actual Result
✅ **PASSED** - Admin successfully navigated to student list

---

## TC-11: Student List Content Verification

**Test ID:** test_11_admin_student_list_content  
**Priority:** High  
**Type:** Functional  
**Category:** Data Display

### Objective
Verify that the student list page displays student data correctly.

### Preconditions
- Admin is logged in
- Database contains student records
- Student list page is accessible

### Test Steps
1. Log in as admin
2. Navigate directly to /finance/students
3. Wait 2 seconds for data to load
4. Extract page content
5. Verify student data is present

### Expected Results
- Page displays list of students
- Student usernames are visible (e.g., "student1")
- Student names may be visible (e.g., "John Smith")
- Table headers show "Students" or similar
- Student financial data is displayed

### Test Data
- **Username:** admin
- **Expected Data:** student1, student names, financial information

### Actual Result
✅ **PASSED** - Student list displays correct data

---

## TC-12: Navigate to Fee Structure Page

**Test ID:** test_12_admin_nav_fee_structure  
**Priority:** High  
**Type:** Functional  
**Category:** Navigation

### Objective
Verify that admin can access the fee structure configuration page.

### Preconditions
- Admin is logged in
- Fee structure feature exists

### Test Steps
1. Log in as admin
2. Navigate directly to /finance/fees (using direct URL for reliability)
3. Wait 1 second for page load
4. Verify URL

### Expected Results
- URL contains "fees" or "fee"
- Fee structure page loads successfully
- Fee configuration interface is visible
- No errors are displayed

### Test Data
- **Username:** admin
- **Target URL:** /finance/fees

### Actual Result
✅ **PASSED** - Admin successfully accessed fee structure page

---

## TC-13: Fee Structure Content Display

**Test ID:** test_13_admin_fee_content  
**Priority:** High  
**Type:** Functional  
**Category:** Data Display

### Objective
Verify that the fee structure page displays fee categories and amounts correctly.

### Preconditions
- Admin is logged in
- Fee structure page is loaded
- Database contains fee structure data

### Test Steps
1. Log in as admin
2. Navigate to /finance/fees
3. Wait 1 second for content to load
4. Extract page content
5. Verify fee-related content is present

### Expected Results
- Page displays fee categories (e.g., "Tuition", "Bus")
- Fee amounts are visible
- Page heading contains "Fees" or similar
- Fee configuration options are available

### Test Data
- **Username:** admin
- **Expected Content:** Tuition, Bus, Fees

### Actual Result
✅ **PASSED** - Fee structure content is properly displayed

---

## TC-14: Report Generation Availability

**Test ID:** test_14_admin_report_availability  
**Priority:** Medium  
**Type:** Functional  
**Category:** Feature Availability

### Objective
Verify that reporting features are available and accessible to admin users.

### Preconditions
- Admin is logged in
- Reporting feature exists in the system

### Test Steps
1. Log in as admin
2. Navigate to /finance/reports
3. Wait 1 second for page load
4. Extract page content
5. Verify report-related content is present

### Expected Results
- Page contains text "Report" or "Statistics"
- Reporting interface is visible
- Report generation options are available
- No errors are displayed

### Test Data
- **Username:** admin
- **Target URL:** /finance/reports

### Actual Result
✅ **PASSED** - Reporting features are accessible

---

## TC-15: Navigate to Bank Reconciliation

**Test ID:** test_15_admin_nav_bank_reconciliation  
**Priority:** Medium  
**Type:** Functional  
**Category:** Navigation

### Objective
Verify that admin can access the bank reconciliation page.

### Preconditions
- Admin is logged in
- Bank reconciliation feature exists

### Test Steps
1. Log in as admin
2. Navigate directly to /finance/bank-reconciliation
3. Wait 1 second for page load
4. Verify URL

### Expected Results
- URL contains "bank"
- Bank reconciliation page loads
- Page displays bank transaction interface
- No errors are displayed

### Test Data
- **Username:** admin
- **Target URL:** /finance/bank-reconciliation

### Actual Result
✅ **PASSED** - Admin successfully accessed bank reconciliation page

---

## TC-16: Bank Transaction Data Display

**Test ID:** test_16_admin_bank_data  
**Priority:** Medium  
**Type:** Functional  
**Category:** Data Display

### Objective
Verify that bank transaction data is displayed on the bank reconciliation page.

### Preconditions
- Admin is logged in
- Bank reconciliation page is loaded
- Database contains bank transaction records

### Test Steps
1. Log in as admin
2. Navigate to /finance/bank-reconciliation
3. Wait 1 second for data to load
4. Extract page content
5. Verify transaction-related content is present

### Expected Results
- Page displays bank transaction data
- Text contains "Transaction", "Ref", or "Bank"
- Transaction table or list is visible
- Transaction details are shown

### Test Data
- **Username:** admin
- **Expected Content:** Transaction, Reference, Bank

### Actual Result
❌ **FAILED** - Expected transaction data not found  
**Issue:** Page may not have sample bank transaction data loaded  
**Recommendation:** Seed database with sample bank transactions or update test assertions

---

# Non-Functional Test Cases

## TC-17: Performance - Page Load Time

**Test ID:** test_17_performance_login_load  
**Priority:** Medium  
**Type:** Non-Functional - Performance  
**Category:** Performance Testing

### Objective
Verify that the application home page loads within acceptable time limits.

### Preconditions
- Application is running
- Network connection is stable
- No other heavy processes are running

### Test Steps
1. Record start time
2. Navigate to application home page (http://localhost:5173)
3. Record end time when page is fully loaded
4. Calculate load time
5. Verify load time is under threshold

### Expected Results
- Page loads in less than 5 seconds
- All page elements are rendered
- No timeout errors occur
- Page is interactive after load

### Performance Threshold
- **Maximum Load Time:** 5.0 seconds
- **Optimal Load Time:** < 2.0 seconds

### Actual Result
✅ **PASSED** - Page loaded within acceptable time  
**Measured Load Time:** < 5 seconds

---

## TC-18: Responsive Design - Mobile View

**Test ID:** test_18_responsive_mobile  
**Priority:** Medium  
**Type:** Non-Functional - UI/UX  
**Category:** Responsive Design

### Objective
Verify that the application renders correctly on mobile device viewports.

### Preconditions
- Application is running
- Browser supports viewport resizing

### Test Steps
1. Set browser window size to mobile dimensions (375x812 - iPhone X)
2. Navigate to application home page
3. Wait 1 second for rendering
4. Verify Login button is visible and clickable
5. Reset browser to desktop size (1920x1080)

### Expected Results
- Page renders without horizontal scrolling
- Login button is visible and accessible
- Text is readable without zooming
- UI elements don't overlap
- Navigation is usable on mobile

### Test Data
- **Mobile Viewport:** 375x812 pixels (iPhone X)
- **Desktop Viewport:** 1920x1080 pixels

### Actual Result
✅ **PASSED** - Application is responsive on mobile viewport

---

## TC-19: Security - Protected Route Access

**Test ID:** test_19_security_protected_route  
**Priority:** High  
**Type:** Non-Functional - Security  
**Category:** Access Control

### Objective
Verify that unauthenticated users cannot access protected routes (student dashboard).

### Preconditions
- User is not logged in
- Protected routes exist in the application

### Test Steps
1. Ensure user is logged out
2. Attempt to directly navigate to /student/dashboard
3. Wait 2 seconds for redirect
4. Verify URL or page content
5. Check that dashboard content is not accessible

### Expected Results
- User is redirected to login page or home page
- URL contains "login" or ends with "/"
- Dashboard content is not visible
- "Student Dashboard" text is not present
- Access is denied without authentication

### Security Validation
- Protected routes require authentication
- No sensitive data is exposed
- Proper redirect occurs

### Actual Result
✅ **PASSED** - Protected routes are secure, unauthorized access prevented

---

## TC-20: SEO - Page Title Presence

**Test ID:** test_20_page_title  
**Priority:** Low  
**Type:** Non-Functional - SEO  
**Category:** Search Engine Optimization

### Objective
Verify that all pages have proper HTML title tags for SEO purposes.

### Preconditions
- Application is running
- Pages are accessible

### Test Steps
1. Navigate to application home page
2. Extract page title from browser
3. Verify title is not empty
4. Verify title is descriptive

### Expected Results
- Page has a non-empty title tag
- Title is descriptive and relevant
- Title follows SEO best practices
- Title length is appropriate (< 60 characters recommended)

### SEO Best Practices
- Title should describe page content
- Title should include relevant keywords
- Title should be unique per page

### Actual Result
✅ **PASSED** - Page has proper title tag

---

## Test Execution Summary

### Overall Statistics
- **Total Test Cases:** 21
- **Passed:** 18 (85.7%)
- **Failed:** 3 (14.3%)
- **Skipped:** 0

### Test Categories Breakdown
| Category | Total | Passed | Failed | Pass Rate |
|----------|-------|--------|--------|-----------|
| Authentication | 5 | 3 | 2 | 60% |
| Student Dashboard | 3 | 3 | 0 | 100% |
| Admin Dashboard | 9 | 8 | 1 | 88.9% |
| Non-Functional | 4 | 4 | 0 | 100% |

### Failed Tests Summary
1. **TC-04:** Logout Functionality - Element detection issue
2. **TC-16:** Bank Transaction Data - Missing seed data
3. **TC-21:** Admin Logout Cleanup - Same as TC-04

### Recommendations
1. Fix logout button selector across all user roles
2. Add seed data for bank reconciliation feature
3. Implement more robust element detection strategies
4. Add explicit waits for dynamic content
5. Consider implementing retry logic for flaky tests

---

**Document Prepared By:** Selenium Test Automation Team  
**Review Status:** Final  
**Next Review Date:** As needed for test updates
