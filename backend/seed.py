"""Creates tables and seeds demo accounts + sample data for local development.

Usage: python seed.py
"""

import random
from datetime import date, timedelta

from dotenv import load_dotenv

load_dotenv()

from app import create_app
from app.extensions import db, bcrypt
from app.models import (
    SystemUser,
    Player,
    Coach,
    Admin,
    TrainingActivity,
    Attendance,
    Participation,
    PerformanceFeedback,
)

app = create_app()


def hash_pw(pw):
    return bcrypt.generate_password_hash(pw).decode("utf-8")


def make_user(username, password, role):
    user = SystemUser(username=username, password_hash=hash_pw(password), role=role)
    db.session.add(user)
    db.session.flush()
    return user


with app.app_context():
    db.drop_all()
    db.create_all()

    admin_user = make_user("admin", "Admin@123", "admin")
    admin = Admin(user_id=admin_user.user_id, first_name="Ilham", last_name="Gamal", email="admin@actibase.msu.edu.ph")
    db.session.add(admin)

    coach_user = make_user("coach.vistal", "Coach@123", "coach")
    coach = Coach(
        user_id=coach_user.user_id,
        first_name="Jogie",
        last_name="Vistal",
        email="jvistal@actibase.msu.edu.ph",
        contact_number="0917-000-0001",
        specialization="Basketball",
    )
    db.session.add(coach)
    db.session.flush()

    coach_user2 = make_user("coach.reyes", "Coach@123", "coach")
    coach2 = Coach(
        user_id=coach_user2.user_id,
        first_name="Mara",
        last_name="Reyes",
        email="mreyes@actibase.msu.edu.ph",
        contact_number="0917-000-0002",
        specialization="Volleyball",
    )
    db.session.add(coach2)
    db.session.flush()

    player_names = [
        ("Asraf", "Alauya Jr."),
        ("Ken Philip", "Tiu"),
        ("Nadia", "Cassim"),
        ("Amiroh", "Dimao"),
        ("Bantas", "Macabantog"),
        ("Sittie", "Radiamoda"),
    ]
    players = []
    for i, (first, last) in enumerate(player_names, start=1):
        u = make_user(f"player{i}", "Player@123", "player")
        p = Player(
            user_id=u.user_id,
            first_name=first,
            last_name=last,
            email=f"player{i}@students.msu.edu.ph",
            contact_number=f"0917-100-000{i}",
            date_of_birth=date(2003, (i % 12) + 1, 10),
            team="Varsity Basketball" if i % 2 else "Varsity Volleyball",
            membership_status="active",
        )
        db.session.add(p)
        players.append(p)
    db.session.flush()

    activities = []
    for w in range(4):
        act = TrainingActivity(
            coach_id=coach.coach_id,
            activity_name=f"Week {w + 1} Practice Session",
            activity_date=date.today() - timedelta(days=(4 - w) * 7),
            duration=120,
            notes="Standard conditioning and drills.",
        )
        db.session.add(act)
        activities.append(act)
    db.session.flush()

    statuses = ["present", "present", "present", "late", "absent"]
    for act in activities:
        for p in players:
            db.session.add(
                Attendance(
                    player_id=p.player_id,
                    coach_id=coach.coach_id,
                    date=act.activity_date,
                    status=random.choice(statuses),
                )
            )
            db.session.add(
                Participation(
                    player_id=p.player_id,
                    activity_id=act.activity_id,
                    participation_status="joined",
                )
            )

    feedback_comments = [
        "Great improvement in stamina and footwork.",
        "Needs to work on communication during drills.",
        "Excellent leadership shown during scrimmage.",
        "Consistent performance, keep up the discipline.",
    ]
    for p in players:
        db.session.add(
            PerformanceFeedback(
                player_id=p.player_id,
                coach_id=coach.coach_id,
                comments=random.choice(feedback_comments),
                rating=random.randint(3, 5),
            )
        )

    db.session.commit()

    print("Seed complete.")
    print("Admin login:  admin / Admin@123")
    print("Coach login:  coach.vistal / Coach@123")
    print("Player login: player1 / Player@123 (through player6)")
