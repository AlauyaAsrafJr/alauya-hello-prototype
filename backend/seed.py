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
    PlayerHealthRecord,
    Sport,
    FeedbackCategory,
)

app = create_app()

DEFAULT_SPORTS = [
    "Basketball",
    "Volleyball",
    "Track & Field",
    "Swimming",
    "Soccer",
    "Baseball",
    "Softball",
    "Tennis",
]

DEFAULT_FEEDBACK_CATEGORIES = {
    "Basketball": ["Shooting", "Defense", "Ball Handling", "Teamwork"],
    "Volleyball": ["Serving", "Blocking", "Passing", "Teamwork"],
}


def hash_pw(pw):
    return bcrypt.generate_password_hash(pw).decode("utf-8")


def make_user(username, password, role):
    user = SystemUser(username=username, password_hash=hash_pw(password), role=role)
    db.session.add(user)
    db.session.flush()
    return user


def seed_team(coach, players, activity_prefix):
    """Creates activities, attendance, participation, and feedback for one coach's team only."""
    activities = []
    for w in range(4):
        act = TrainingActivity(
            coach_id=coach.coach_id,
            activity_name=f"{activity_prefix} — Week {w + 1} Practice Session",
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


with app.app_context():
    db.drop_all()
    db.create_all()

    for name in DEFAULT_SPORTS:
        db.session.add(Sport(name=name))

    for sport_name, categories in DEFAULT_FEEDBACK_CATEGORIES.items():
        for category_name in categories:
            db.session.add(FeedbackCategory(sport_name=sport_name, name=category_name))

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
    # Player.team must match a coach's specialization exactly (e.g. "Basketball", not
    # "Varsity Basketball") — this is how a coach's roster is scoped to their own team.
    basketball_players = []
    volleyball_players = []
    for i, (first, last) in enumerate(player_names, start=1):
        u = make_user(f"player{i}", "Player@123", "player")
        team = "Basketball" if i % 2 else "Volleyball"
        p = Player(
            user_id=u.user_id,
            first_name=first,
            last_name=last,
            email=f"player{i}@students.msu.edu.ph",
            contact_number=f"0917-100-000{i}",
            date_of_birth=date(2003, (i % 12) + 1, 10),
            team=team,
            membership_status="active",
        )
        db.session.add(p)
        (basketball_players if team == "Basketball" else volleyball_players).append(p)
    db.session.flush()

    seed_team(coach, basketball_players, "Basketball")
    seed_team(coach2, volleyball_players, "Volleyball")

    # Demo: one basketball player with an ankle sprain, one volleyball player recovering.
    injured_player = basketball_players[0]
    injured_player.health_status = "injured"
    db.session.add(
        PlayerHealthRecord(
            player_id=injured_player.player_id,
            coach_id=coach.coach_id,
            status="injured",
            injury_type="Ankle sprain",
            notes="Rolled ankle during Week 4 scrimmage. Advised rest and ice.",
            reported_date=date.today() - timedelta(days=3),
            expected_return_date=date.today() + timedelta(days=11),
        )
    )

    recovering_player = volleyball_players[0]
    recovering_player.health_status = "recovering"
    db.session.add(
        PlayerHealthRecord(
            player_id=recovering_player.player_id,
            coach_id=coach2.coach_id,
            status="recovering",
            injury_type="Shoulder strain",
            notes="Cleared for light training, no overhead serves yet.",
            reported_date=date.today() - timedelta(days=10),
            expected_return_date=date.today() + timedelta(days=4),
        )
    )

    # Every other player gets a baseline "healthy" record so their history
    # isn't empty, matching what happens automatically when an admin creates
    # a new player account.
    already_logged = {injured_player.player_id, recovering_player.player_id}
    for p in basketball_players + volleyball_players:
        if p.player_id not in already_logged:
            db.session.add(
                PlayerHealthRecord(
                    player_id=p.player_id,
                    status="healthy",
                    notes="Baseline record created when the player account was set up.",
                )
            )

    db.session.commit()

    print("Seed complete.")
    print("Admin login:  admin / Admin@123")
    print("Coach login:  coach.vistal / Coach@123 (Basketball team)")
    print("Coach login:  coach.reyes / Coach@123 (Volleyball team)")
    print("Player login: player1 / Player@123 (through player6)")
