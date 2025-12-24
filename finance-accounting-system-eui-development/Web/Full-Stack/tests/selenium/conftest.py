import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import os
import datetime

@pytest.fixture(scope="session")
def browser():
    options = Options()
    # options.add_argument("--headless")  # Run properly without headless for screenshot visibility if needed, but headless is faster
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1920,1080")
    
    # Try to initialize Chrome
    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
    except Exception as e:
        print(f"Failed to initialize Chrome Driver: {e}")
        # Fallback to Edge if Chrome fails (often happens in some envs)
        try:
            from selenium.webdriver.edge.service import Service as EdgeService
            from webdriver_manager.microsoft import EdgeChromiumDriverManager
            edge_options = webdriver.EdgeOptions()
            edge_options.add_argument("--headless") 
            service = EdgeService(EdgeChromiumDriverManager().install())
            driver = webdriver.Edge(service=service, options=edge_options)
        except Exception as e2:
            raise Exception(f"Could not initialize any browser: {e2}")

    driver.implicitly_wait(10)
    yield driver
    driver.quit()

@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    pytest_html = item.config.pluginmanager.getplugin("html")
    outcome = yield
    report = outcome.get_result()
    extra = getattr(report, "extra", [])
    if report.when == "call":
        full_name = os.environ.get('PYTEST_CURRENT_TEST').split(' (')[0].split('::')[-1]
        if report.failed:
             # Logic to attach screenshot on failure if needed
             pass
        report.extra = extra
