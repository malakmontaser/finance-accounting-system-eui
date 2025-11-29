from flask import Blueprint, request, jsonify
from models import db, User, StudentProfile
from flask_jwt_extended import create_access_token
from datetime import datetime

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    user = User.query.filter_by(username=username).first()
    if not user or not User.verify_hash(password, user.password_hash):
        return jsonify({"msg":"Invalid credentials"}), 401
    token = create_access_token(identity={"id": user.id, "role": user.role})
    return jsonify({"access_token": token, "role": user.role})

@auth_bp.route("/register-student", methods=["POST"])
def register_student():
    data = request.get_json()
    username = data.get("username"); password = data.get("password"); student_id = data.get("student_id")
    if User.query.filter_by(username=username).first():
        return jsonify({"msg":"User exists"}), 400
    u = User(username=username, password_hash=User.generate_hash(password), role="STUDENT")
    db.session.add(u); db.session.commit()
    sp = StudentProfile(user_id=u.id, student_id=student_id, name=data.get("name"))
    db.session.add(sp); db.session.commit()
    return jsonify({"msg":"registered"}), 201
