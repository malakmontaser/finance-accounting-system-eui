from flask_jwt_extended import get_jwt_identity
from functools import wraps
from flask import jsonify


def role_required(*roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            identity = get_jwt_identity()
            if not identity:
                return jsonify({"msg": "Missing or invalid token"}), 401

            user_role = identity.get("role")
            if user_role not in roles:
                return jsonify({"msg": "Permission denied"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator
