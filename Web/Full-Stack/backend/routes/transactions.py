from flask import Blueprint, request, jsonify
from models import db, Transaction, StudentProfile
from flask_jwt_extended import jwt_required, get_jwt_identity

transactions_bp = Blueprint("transactions", __name__)

@transactions_bp.route("/", methods=["GET"])
@jwt_required()
def list_tx():
    txs = Transaction.query.order_by(Transaction.date.desc()).all()
    return jsonify([{"id":t.id,"student_id":t.student_id,"amount":t.amount,"type":t.type,"status":t.status,"date":t.date.isoformat()} for t in txs])

@transactions_bp.route("/", methods=["POST"])
@jwt_required()
def create_tx():
    data = request.get_json()
    t = Transaction(student_id=data["student_id"], amount=data["amount"], type=data["type"], recorded_by=data.get("recorded_by"))
    db.session.add(t); db.session.commit()
    # optionally update student fees_status here
    return jsonify({"msg":"created","id":t.id}), 201

@transactions_bp.route("/student/<int:student_id>", methods=["GET"])
@jwt_required()
def tx_by_student(student_id):
    txs = Transaction.query.filter_by(student_id=student_id).order_by(Transaction.date.desc()).all()
    return jsonify([{"id":t.id,"amount":t.amount,"type":t.type,"status":t.status,"date":t.date.isoformat()} for t in txs])
