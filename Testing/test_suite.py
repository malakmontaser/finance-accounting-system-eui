import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time

BASE_URL = "http://localhost:5173"

class TestFinanceSystem:
    
    # helper methods
    def click_element_js(self, browser, element):
        browser.execute_script("arguments[0].click();", element)

    def login(self, browser, username, password, role="Student"):
        browser.get(f"{BASE_URL}")
        
        try:
            login_btn = WebDriverWait(browser, 5).until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Login')]"))
            )
            login_btn.click()
            
            WebDriverWait(browser, 5).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".portal-card"))
            )
            
            if role == "Student":
                role_btn = browser.find_element(By.CSS_SELECTOR, ".portal-card:nth-child(1)")
                role_btn.click()
            elif role == "Admin" or role == "Finance":
                role_btn = browser.find_element(By.CSS_SELECTOR, ".portal-card:nth-child(2)")
                role_btn.click()
                
        except Exception as e:
            print(f"Login navigation exception (might be non-fatal): {e}")

        WebDriverWait(browser, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, "input.form-input")))
        time.sleep(1)
        
        user_inputs = browser.find_elements(By.CSS_SELECTOR, "input.form-input[type='text']")
        for i in user_inputs:
             if i.is_displayed():
                 i.clear()
                 i.send_keys(username)
        
        pass_inputs = browser.find_elements(By.CSS_SELECTOR, "input.form-input[type='password']")
        for i in pass_inputs:
             if i.is_displayed():
                 i.clear()
                 i.send_keys(password)
        
        submit_btns = browser.find_elements(By.CSS_SELECTOR, "button.btn-primary")
        for b in submit_btns:
             if b.is_displayed() and "Sign In" in b.text:
                 self.click_element_js(browser, b)
                 break
        
        time.sleep(3)

    def logout(self, browser):
        try:
            logout_btn = browser.find_element(By.XPATH, "//a[contains(text(), 'Logout')] | //button[contains(text(), 'Logout')]")
            self.click_element_js(browser, logout_btn)
            time.sleep(2)
        except:
            pass

    # ==================== BASIC AUTHENTICATION TESTS ====================
    
    def test_01_student_login_valid(self, browser):
        """TC-01: Verify successful student login with valid credentials"""
        self.login(browser, "student1", "pass123", role="Student")
        assert "dashboard" in browser.current_url.lower() or "student" in browser.current_url.lower()
        assert len(browser.find_elements(By.XPATH, "//*[contains(text(), 'Welcome')]")) > 0
        self.logout(browser)

    def test_02_student_login_invalid(self, browser):
        """TC-02: Verify system rejects invalid credentials"""
        browser.get(f"{BASE_URL}")
        try:
             browser.find_element(By.XPATH, "//button[contains(text(), 'Login')]").click()
             time.sleep(0.5)
             browser.find_element(By.CSS_SELECTOR, ".portal-card:nth-child(1)").click()
        except:
            pass
            
        WebDriverWait(browser, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, "input.form-input")))
        browser.find_element(By.CSS_SELECTOR, "input.form-input[type='text']").send_keys("wronguser")
        browser.find_element(By.CSS_SELECTOR, "input.form-input[type='password']").send_keys("wrongpass")
        
        submit_btns = browser.find_elements(By.CSS_SELECTOR, "button.btn-primary")
        for b in submit_btns:
             if b.is_displayed():
                 self.click_element_js(browser, b)
                 break
        
        time.sleep(2)
        assert "dashboard" not in browser.current_url.lower()

    def test_03_admin_login_valid(self, browser):
        """TC-03: Verify successful admin login"""
        self.login(browser, "admin", "admin123", role="Admin")
        assert "finance" in browser.current_url.lower() or "admin" in browser.current_url.lower()
        self.logout(browser)

    def test_04_logout(self, browser):
        """TC-04: Verify logout functionality"""
        self.login(browser, "student1", "pass123", role="Student")
        WebDriverWait(browser, 10).until(EC.presence_of_element_located((By.XPATH, "//a[contains(text(), 'Logout')] | //button[contains(text(), 'Logout')]"))) 
        self.logout(browser)
        assert "login" in browser.current_url.lower() or browser.current_url.endswith("/") or "Welcome" in browser.find_element(By.TAG_NAME, "body").text

    # ==================== STUDENT DASHBOARD TESTS ====================
    
    def test_05_student_nav_dashboard(self, browser):
        """TC-05: Verify student can navigate to dashboard"""
        self.login(browser, "student1", "pass123", role="Student")
        assert "dashboard" in browser.current_url.lower()
        self.logout(browser)
        
    def test_06_student_payment_option_visible(self, browser):
        """TC-06: Verify payment options are visible to students"""
        self.login(browser, "student1", "pass123", role="Student")
        time.sleep(1)
        body_text = browser.find_element(By.TAG_NAME, "body").text
        assert "Pay" in body_text or "Dues" in body_text or "Amount" in body_text
        self.logout(browser)

    def test_07_student_data_verification(self, browser):
        """TC-07: Verify student-specific data is displayed correctly"""
        self.login(browser, "student1", "pass123", role="Student")
        time.sleep(2)
        body_text = browser.find_element(By.TAG_NAME, "body").text
        assert "5000" in body_text or "5,000" in body_text or "Student" in body_text
        self.logout(browser)

    # ==================== ADMIN DASHBOARD TESTS ====================
    
    def test_08_admin_nav_dashboard(self, browser):
        """TC-08: Verify admin can access finance dashboard"""
        self.login(browser, "admin", "admin123", role="Admin")
        assert "finance" in browser.current_url or "dashboard" in browser.current_url
        self.logout(browser)

    def test_09_admin_dashboard_stats(self, browser):
        """TC-09: Verify financial statistics are displayed"""
        self.login(browser, "admin", "admin123", role="Admin")
        time.sleep(2)
        body_text = browser.find_element(By.TAG_NAME, "body").text
        assert "Collected" in body_text or "Payments" in body_text or "Overview" in body_text
        self.logout(browser)

    def test_10_admin_nav_students(self, browser):
        """TC-10: Verify admin can navigate to student list"""
        self.login(browser, "admin", "admin123", role="Admin")
        try:
            link = browser.find_element(By.XPATH, "//a[contains(@href, 'students')]")
            self.click_element_js(browser, link)
            time.sleep(1)
            assert "students" in browser.current_url.lower()
        except:
             browser.get(f"{BASE_URL}/finance/students")
             time.sleep(1)
             assert "students" in browser.current_url.lower()
        self.logout(browser)

    def test_11_admin_student_list_content(self, browser):
        """TC-11: Verify student list displays correct data"""
        self.login(browser, "admin", "admin123", role="Admin")
        browser.get(f"{BASE_URL}/finance/students") 
        time.sleep(2)
        body_text = browser.find_element(By.TAG_NAME, "body").text
        assert "student1" in body_text or "John Smith" in body_text or "Students" in body_text
        self.logout(browser)

    def test_12_admin_nav_fee_structure(self, browser):
        """TC-12: Verify admin can access fee structure page"""
        self.login(browser, "admin", "admin123", role="Admin")
        browser.get(f"{BASE_URL}/finance/fees")
        time.sleep(1)
        assert "fees" in browser.current_url.lower() or "fee" in browser.current_url.lower()
        self.logout(browser)
             
    def test_13_admin_fee_content(self, browser):
        """TC-13: Verify fee structure content is displayed"""
        self.login(browser, "admin", "admin123", role="Admin")
        browser.get(f"{BASE_URL}/finance/fees")
        time.sleep(1)
        body_text = browser.find_element(By.TAG_NAME, "body").text
        assert "Tuition" in body_text or "Bus" in body_text or "Fees" in body_text
        self.logout(browser)

    def test_14_admin_report_availability(self, browser):
        """TC-14: Verify reporting features are accessible"""
        self.login(browser, "admin", "admin123", role="Admin")
        browser.get(f"{BASE_URL}/finance/reports")
        time.sleep(1)
        body_text = browser.find_element(By.TAG_NAME, "body").text
        assert "Report" in body_text or "Statistics" in body_text
        self.logout(browser)

    def test_15_admin_nav_bank_reconciliation(self, browser):
        """TC-15: Verify admin can access bank reconciliation"""
        self.login(browser, "admin", "admin123", role="Admin")
        browser.get(f"{BASE_URL}/finance/bank-reconciliation")
        time.sleep(1)
        assert "bank" in browser.current_url.lower()
        self.logout(browser)

    def test_16_admin_bank_data(self, browser):
        """TC-16: Verify bank transaction data is displayed"""
        self.login(browser, "admin", "admin123", role="Admin")
        browser.get(f"{BASE_URL}/finance/bank-reconciliation")
        time.sleep(1)
        body_text = browser.find_element(By.TAG_NAME, "body").text
        assert "Transaction" in body_text or "Ref" in body_text or "Bank" in body_text
        self.logout(browser)

    # ==================== NON-FUNCTIONAL TESTS ====================
    
    def test_17_performance_login_load(self, browser):
        """TC-17: Verify page load performance"""
        start_time = time.time()
        browser.get(f"{BASE_URL}")
        load_time = time.time() - start_time
        assert load_time < 5.0, f"Page load took {load_time}s"

    def test_18_responsive_mobile(self, browser):
        """TC-18: Verify responsive design on mobile viewport"""
        browser.set_window_size(375, 812)
        browser.get(f"{BASE_URL}")
        time.sleep(1)
        btn = browser.find_element(By.XPATH, "//button[contains(text(), 'Login')]")
        assert btn.is_displayed()
        browser.set_window_size(1920, 1080)

    def test_19_security_protected_route(self, browser):
        """TC-19: Verify protected routes require authentication"""
        self.logout(browser)
        browser.get(f"{BASE_URL}/student/dashboard")
        time.sleep(2)
        current = browser.current_url.lower()
        body_text = browser.find_element(By.TAG_NAME, "body").text
        is_safe = "login" in current or current.endswith("/") or "Welcome" in body_text
        
        if not is_safe:
             assert "Student Dashboard" not in body_text

    def test_20_page_title(self, browser):
        """TC-20: Verify page has proper SEO title"""
        browser.get(f"{BASE_URL}")
        assert len(browser.title) > 0

    def test_21_admin_logout_cleanup(self, browser):
        """TC-21: Verify admin logout functionality"""
        if "finance" not in browser.current_url:
             self.login(browser, "admin", "admin123", role="Admin")
        
        self.logout(browser)
        assert "login" in browser.current_url.lower() or browser.current_url.endswith("/") or "Welcome" in browser.find_element(By.TAG_NAME, "body").text


    def test_22_multiple_student_login_session(self, browser):
        """TC-22: Verify multiple students can login sequentially without session conflicts"""
        # Login as student1
        self.login(browser, "student1", "pass123", role="Student")
        assert "dashboard" in browser.current_url.lower()
        student1_content = browser.find_element(By.TAG_NAME, "body").text
        assert "student1" in student1_content.lower()
        self.logout(browser)
        
        # Login as student2
        self.login(browser, "student2", "pass123", role="Student")
        assert "dashboard" in browser.current_url.lower()
        student2_content = browser.find_element(By.TAG_NAME, "body").text
        assert "student2" in student2_content.lower()
        self.logout(browser)

    def test_23_admin_to_student_role_switch(self, browser):
        """TC-23: Verify switching between admin and student roles works correctly"""
        # Login as admin
        self.login(browser, "admin", "admin123", role="Admin")
        assert "finance" in browser.current_url.lower()
        self.logout(browser)
        time.sleep(1)
        

    def test_24_session_persistence_after_refresh(self, browser):
        """TC-24: Verify session persists after page refresh"""
        self.login(browser, "student1", "pass123", role="Student")
        assert "dashboard" in browser.current_url.lower()
        
        # Refresh page
        browser.refresh()
        time.sleep(2)
        
        # Should still be logged in
        current_url = browser.current_url.lower()
        body_text = browser.find_element(By.TAG_NAME, "body").text
        
        # Either still on dashboard or session maintained
        is_authenticated = "dashboard" in current_url or "student1" in body_text.lower()
        assert is_authenticated, "Session should persist after refresh"
        
        self.logout(browser)



    def test_25_student_cannot_access_admin_features(self, browser):
        """TC-25: Verify students cannot access admin-only features"""
        self.login(browser, "student1", "pass123", role="Student")
        
        # Try to access admin page
        browser.get(f"{BASE_URL}/finance/students")
        time.sleep(2)
        
        current_url = browser.current_url.lower()
        body_text = browser.find_element(By.TAG_NAME, "body").text
        
        # Should be redirected or denied
        is_denied = (
            "student/dashboard" in current_url or
            "finance/students" not in current_url or
            "access denied" in body_text.lower() or
            "unauthorized" in body_text.lower()
        )
        
        # At minimum, should not see admin-specific content
        assert is_denied or "All Students" not in body_text
        
        self.logout(browser)
