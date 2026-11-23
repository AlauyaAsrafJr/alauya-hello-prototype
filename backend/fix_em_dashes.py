"""One-time cleanup for existing rows that still have an em dash ("-") in
text that the app now generates with a plain hyphen instead (the
auto-recovery health note and seeded training activity names).

Usage: python fix_em_dashes.py
"""

from dotenv import load_dotenv

load_dotenv()

from app import create_app
from app.extensions import db
from app.models import TrainingActivity, PlayerHealthRecord

app = create_app()

with app.app_context():
    updated = 0

    activities = TrainingActivity.query.filter(TrainingActivity.activity_name.contains("—")).all()
    for activity in activities:
        activity.activity_name = activity.activity_name.replace("—", "-")
        updated += 1

    records = PlayerHealthRecord.query.filter(PlayerHealthRecord.notes.contains("—")).all()
    for record in records:
        record.notes = record.notes.replace("—", "-")
        updated += 1

    if updated:
        db.session.commit()

    print(f"Updated {updated} row(s).")
