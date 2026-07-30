from flask import Blueprint, jsonify

common_bp = Blueprint("common", __name__)


@common_bp.get("/ping")
def ping():
    return jsonify({"status": "ok", "service": "actibase-api"})
