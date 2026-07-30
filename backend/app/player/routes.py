import os
import uuid

from flask import Blueprint, current_app, request, jsonify
from flask_jwt_extended import get_jwt_identity

from app.decorators import roles_required
from app.extensions import db
from app.models import (
    Player,
    Attendance,
    Participation,
    PerformanceFeedback,
    PlayerNote,
    PlayerHealthRecord,
    TrainingActivity,
)

player_bp = Blueprint("player", __name__)

ALLOWED_PHOTO_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def _current_player():
    user_id = int(get_jwt_identity())
    return Player.query.filter_by(user_id=user_id).first()


@player_bp.get("/profile")
@roles_required("player")
def get_profile():
    player = _current_player()
    if not player:
        return jsonify({"error": "Player profile not found"}), 404
    return jsonify(player.to_dict())


@player_bp.patch("/profile")
@roles_required("player")
def update_profile():
    player = _current_player()
    if not player:
        return jsonify({"error": "Player profile not found"}), 404
    data = request.get_json(force=True) or {}
    # Players may only update limited, non-sensitive fields of their profile.
    editable_fields = ["contact_number", "profile_photo"]
    for field in editable_fields:
        if field in data:
            setattr(player, field, data[field])
    db.session.commit()
    return jsonify(player.to_dict())


@player_bp.post("/profile/photo")
@roles_required("player")
def upload_profile_photo():
    player = _current_player()
    if not player:
        return jsonify({"error": "Player profile not found"}), 404
    file = request.files.get("photo")
    if not file or not file.filename:
        return jsonify({"error": "No photo file provided"}), 400
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_PHOTO_EXTENSIONS:
        return jsonify({"error": "Unsupported image type. Use JPG, PNG, WEBP, or GIF."}), 400

    upload_dir = os.path.join(current_app.config["UPLOAD_FOLDER"], "players")
    os.makedirs(upload_dir, exist_ok=True)
    filename = f"player_{player.player_id}_{uuid.uuid4().hex[:8]}{ext}"
    file.save(os.path.join(upload_dir, filename))

    player.profile_photo = f"/api/uploads/players/{filename}"
    db.session.commit()
    return jsonify(player.to_dict())


@player_bp.get("/attendance")
@roles_required("player")
def get_attendance():
    player = _current_player()
    if not player:
        return jsonify({"error": "Player profile not found"}), 404
    records = (
        Attendance.query.filter_by(player_id=player.player_id)
        .order_by(Attendance.date.desc())
        .all()
    )
    return jsonify([r.to_dict() for r in records])


@player_bp.get("/participation")
@roles_required("player")
def get_participation():
    player = _current_player()
    if not player:
        return jsonify({"error": "Player profile not found"}), 404
    records = (
        Participation.query.filter_by(player_id=player.player_id)
        .join(TrainingActivity)
        .order_by(TrainingActivity.activity_date.desc())
        .all()
    )
    return jsonify([r.to_dict() for r in records])


@player_bp.get("/training-activities")
@roles_required("player")
def get_training_activities():
    player = _current_player()
    if not player:
        return jsonify({"error": "Player profile not found"}), 404
    activities = (
        TrainingActivity.query.join(Participation)
        .filter(Participation.player_id == player.player_id)
        .order_by(TrainingActivity.activity_date.desc())
        .all()
    )
    return jsonify([a.to_dict() for a in activities])


@player_bp.get("/performance-feedback")
@roles_required("player")
def get_performance_feedback():
    player = _current_player()
    if not player:
        return jsonify({"error": "Player profile not found"}), 404
    records = (
        PerformanceFeedback.query.filter_by(player_id=player.player_id)
        .order_by(PerformanceFeedback.feedback_date.desc())
        .all()
    )
    return jsonify([r.to_dict() for r in records])


@player_bp.get("/health")
@roles_required("player")
def get_health():
    player = _current_player()
    if not player:
        return jsonify({"error": "Player profile not found"}), 404
    records = (
        PlayerHealthRecord.query.filter_by(player_id=player.player_id)
        .order_by(PlayerHealthRecord.reported_date.desc())
        .all()
    )
    return jsonify([r.to_dict() for r in records])


@player_bp.get("/notes")
@roles_required("player")
def list_notes():
    player = _current_player()
    if not player:
        return jsonify({"error": "Player profile not found"}), 404
    notes = PlayerNote.query.filter_by(player_id=player.player_id).order_by(PlayerNote.note_date.desc()).all()
    return jsonify([n.to_dict() for n in notes])


@player_bp.post("/notes")
@roles_required("player")
def submit_note():
    player = _current_player()
    if not player:
        return jsonify({"error": "Player profile not found"}), 404
    data = request.get_json(force=True) or {}
    content = (data.get("content") or "").strip()
    if not content:
        return jsonify({"error": "Note content is required"}), 400
    note = PlayerNote(player_id=player.player_id, content=content)
    db.session.add(note)
    db.session.commit()
    return jsonify(note.to_dict()), 201


@player_bp.get("/statistics")
@roles_required("player")
def get_statistics():
    player = _current_player()
    if not player:
        return jsonify({"error": "Player profile not found"}), 404

    attendance = Attendance.query.filter_by(player_id=player.player_id).all()
    total_sessions = len(attendance)
    present_count = sum(1 for a in attendance if a.status == "present")
    late_count = sum(1 for a in attendance if a.status == "late")
    attendance_rate = round((present_count + late_count) / total_sessions * 100, 1) if total_sessions else 0

    participation_count = Participation.query.filter_by(player_id=player.player_id).count()

    feedback = PerformanceFeedback.query.filter_by(player_id=player.player_id).all()
    avg_rating = round(sum(f.rating for f in feedback) / len(feedback), 2) if feedback else None

    return jsonify(
        {
            "total_sessions": total_sessions,
            "present_count": present_count,
            "late_count": late_count,
            "attendance_rate": attendance_rate,
            "participation_count": participation_count,
            "average_rating": avg_rating,
            "feedback_count": len(feedback),
        }
    )
