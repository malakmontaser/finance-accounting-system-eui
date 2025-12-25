import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import os

@pytest.fixture(scope="session")
def browser():
    """ Setup browser fixture """
    chrome_options = Options()
    # chrome_options.add_argument("--headless")  # Uncomment for headless run
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")
    
    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()),
        options=chrome_options
    )
    
    yield driver
    
    driver.quit()

@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """ Custom report hook to take screenshots on failure """
    outcome = yield
    rep = outcome.get_result()
    if rep.when == "call" and rep.failed:
        try:
            if "browser" in item.fixturenames:
                browser = item.funcargs["browser"]
                screenshot_path = f"screenshots/{item.name}.png"
                if not os.path.exists("screenshots"):
                    os.makedirs("screenshots")
                browser.save_screenshot(screenshot_path)
        except Exception as e:
            print(f"Failed to take screenshot: {e}")
