from datetime import date

from app.extensions import db
from app.models import Player, PlayerHealthRecord


def auto_recover_players():
    """Flip a player back to healthy once their latest injury/recovery record's
    expected return date has passed, logging it as a new health record."""
    today = date.today()
    candidates = Player.query.filter(Player.health_status.in_(["injured", "recovering"])).all()
    changed = False
    for player in candidates:
        latest = (
            PlayerHealthRecord.query.filter_by(player_id=player.player_id)
            .order_by(PlayerHealthRecord.reported_date.desc(), PlayerHealthRecord.health_record_id.desc())
            .first()
        )
        if not latest or not latest.expected_return_date or latest.expected_return_date > today:
            continue
        player.health_status = "healthy"
        db.session.add(
            PlayerHealthRecord(
                player_id=player.player_id,
                coach_id=latest.coach_id,
                status="healthy",
                notes="Automatically marked healthy — expected return date reached.",
                reported_date=today,
            )
        )
        changed = True
    if changed:
        db.session.commit()
