import pytest
from app import create_app, db


@pytest.fixture
def app():
    test_config = {
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "JWT_SECRET_KEY": "test-jwt-secret"
    }
    app = create_app(test_config)

    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def test_register_student(client):
    """Test student registration."""
    data = {
        "username": "teststudent",
        "email": "test@student.com",
        "password": "testpassword123",
        "first_name": "Test",
        "last_name": "Student"
    }
    response = client.post('/api/auth/register', json=data)
    assert response.status_code == 201
    assert response.get_json()['username'] == "teststudent"


def test_login_student(client):
    """Test student login."""
    # First register
    register_data = {
        "username": "loginstudent",
        "email": "login@student.com",
        "password": "password123",
        "first_name": "Login",
        "last_name": "Student"
    }
    client.post('/api/auth/register', json=register_data)

    # Then login
    login_data = {
        "username": "loginstudent",
        "password": "password123"
    }
    response = client.post('/api/auth/login', json=login_data)
    assert response.status_code == 200
    assert 'access_token' in response.get_json()
