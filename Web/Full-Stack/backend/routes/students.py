from flask import Blueprint, request, jsonify
from models import db, StudentProfile, User
from flask_jwt_extended import jwt_required, get_jwt_identity

students_bp = Blueprint("students", __name__)

@students_bp.route("/", methods=["GET"])
@jwt_required()
def list_students():
    # role checking omitted for brevity, but add in production
    students = StudentProfile.query.all()
    out = [{"id":s.id,"student_id":s.student_id,"name":s.name,"fees_status":s.fees_status} for s in students]
    return jsonify(out)

@students_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    identity = get_jwt_identity()
    user_id = identity['id']
    user = User.query.get(user_id)
    sp = user.profile
    if not sp:
        return jsonify({"msg":"No profile"}), 404
    return jsonify({"id":sp.id,"student_id":sp.student_id,"name":sp.name,"fees_status":sp.fees_status})
