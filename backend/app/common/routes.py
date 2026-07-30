from flask import Blueprint, current_app, jsonify, send_from_directory

common_bp = Blueprint("common", __name__)


@common_bp.get("/ping")
def ping():
    return jsonify({"status": "ok", "service": "actibase-api"})


@common_bp.get("/uploads/<path:subpath>")
def serve_upload(subpath):
    return send_from_directory(current_app.config["UPLOAD_FOLDER"], subpath)
