from datetime import datetime, date

from app.extensions import db


class SystemUser(db.Model):
    __tablename__ = "system_users"

    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum("player", "coach", "admin", name="user_role"), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    last_login = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    player = db.relationship("Player", back_populates="user", uselist=False, cascade="all, delete-orphan")
    coach = db.relationship("Coach", back_populates="user", uselist=False, cascade="all, delete-orphan")
    admin = db.relationship("Admin", back_populates="user", uselist=False, cascade="all, delete-orphan")
    login_history = db.relationship("LoginHistory", back_populates="user", cascade="all, delete-orphan")

    def profile(self):
        return self.player or self.coach or self.admin

    def display_name(self):
        p = self.profile()
        if not p:
            return self.username
        middle = f"{p.middle_name}." if p.middle_name else None
        return " ".join(part for part in (p.first_name, middle, p.last_name) if part)


class Player(db.Model):
    __tablename__ = "players"

    player_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("system_users.user_id"), unique=True, nullable=False)
    first_name = db.Column(db.String(80), nullable=False)
    middle_name = db.Column(db.String(80), nullable=True)
    last_name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    contact_number = db.Column(db.String(30))
    date_of_birth = db.Column(db.Date)
    team = db.Column(db.String(80))
    year_level = db.Column(db.Integer)  # 1-5+, a student's current year level
    profile_photo = db.Column(db.String(255))
    membership_status = db.Column(
        db.Enum("active", "inactive", "suspended", name="membership_status"), default="active"
    )
    health_status = db.Column(
        db.Enum("healthy", "injured", "recovering", name="player_health_status"),
        default="healthy",
        nullable=False,
    )

    user = db.relationship("SystemUser", back_populates="player")
    attendances = db.relationship("Attendance", back_populates="player", cascade="all, delete-orphan")
    participations = db.relationship("Participation", back_populates="player", cascade="all, delete-orphan")
    feedback = db.relationship("PerformanceFeedback", back_populates="player", cascade="all, delete-orphan")
    notes = db.relationship("PlayerNote", back_populates="player", cascade="all, delete-orphan")
    health_records = db.relationship(
        "PlayerHealthRecord", back_populates="player", cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "player_id": self.player_id,
            "user_id": self.user_id,
            "username": self.user.username if self.user else None,
            "first_name": self.first_name,
            "middle_name": self.middle_name,
            "last_name": self.last_name,
            "email": self.email,
            "contact_number": self.contact_number,
            "date_of_birth": self.date_of_birth.isoformat() if self.date_of_birth else None,
            "team": self.team,
            "year_level": self.year_level,
            "profile_photo": self.profile_photo,
            "membership_status": self.membership_status,
            "health_status": self.health_status,
            "is_active": self.user.is_active if self.user else True,
        }


class Coach(db.Model):
    __tablename__ = "coaches"

    coach_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("system_users.user_id"), unique=True, nullable=False)
    first_name = db.Column(db.String(80), nullable=False)
    middle_name = db.Column(db.String(80), nullable=True)
    last_name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    contact_number = db.Column(db.String(30))
    specialization = db.Column(db.String(120))
    profile_photo = db.Column(db.String(255))

    user = db.relationship("SystemUser", back_populates="coach")
    attendances_recorded = db.relationship("Attendance", back_populates="coach")
    activities = db.relationship("TrainingActivity", back_populates="coach")
    feedback_given = db.relationship("PerformanceFeedback", back_populates="coach")
    health_records_logged = db.relationship("PlayerHealthRecord", back_populates="coach")

    def to_dict(self):
        return {
            "coach_id": self.coach_id,
            "user_id": self.user_id,
            "username": self.user.username if self.user else None,
            "first_name": self.first_name,
            "middle_name": self.middle_name,
            "last_name": self.last_name,
            "email": self.email,
            "contact_number": self.contact_number,
            "specialization": self.specialization,
            "profile_photo": self.profile_photo,
            "is_active": self.user.is_active if self.user else True,
        }


class Admin(db.Model):
    __tablename__ = "admins"

    admin_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("system_users.user_id"), unique=True, nullable=False)
    first_name = db.Column(db.String(80), nullable=False)
    middle_name = db.Column(db.String(80), nullable=True)
    last_name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)

    user = db.relationship("SystemUser", back_populates="admin")

    def to_dict(self):
        return {
            "admin_id": self.admin_id,
            "user_id": self.user_id,
            "username": self.user.username if self.user else None,
            "first_name": self.first_name,
            "middle_name": self.middle_name,
            "last_name": self.last_name,
            "email": self.email,
            "is_active": self.user.is_active if self.user else True,
        }


class TrainingActivity(db.Model):
    __tablename__ = "training_activities"

    activity_id = db.Column(db.Integer, primary_key=True)
    coach_id = db.Column(db.Integer, db.ForeignKey("coaches.coach_id"), nullable=False)
    activity_name = db.Column(db.String(120), nullable=False)
    activity_date = db.Column(db.Date, nullable=False)
    duration = db.Column(db.Integer)  # minutes
    notes = db.Column(db.Text)
    activity_type = db.Column(db.String(80), nullable=True)  # e.g. "Scrimmage", "Conditioning" — sport-specific
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    coach = db.relationship("Coach", back_populates="activities")
    participations = db.relationship("Participation", back_populates="activity", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "activity_id": self.activity_id,
            "coach_id": self.coach_id,
            "coach_name": f"{self.coach.first_name} {self.coach.last_name}" if self.coach else None,
            "activity_name": self.activity_name,
            "activity_date": self.activity_date.isoformat() if self.activity_date else None,
            "duration": self.duration,
            "notes": self.notes,
            "activity_type": self.activity_type,
        }


class Attendance(db.Model):
    __tablename__ = "attendance"

    attendance_id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey("players.player_id"), nullable=False)
    coach_id = db.Column(db.Integer, db.ForeignKey("coaches.coach_id"), nullable=False)
    date = db.Column(db.Date, nullable=False, default=date.today)
    status = db.Column(db.Enum("present", "absent", "late", name="attendance_status"), nullable=False)

    player = db.relationship("Player", back_populates="attendances")
    coach = db.relationship("Coach", back_populates="attendances_recorded")

    def to_dict(self):
        return {
            "attendance_id": self.attendance_id,
            "player_id": self.player_id,
            "player_name": f"{self.player.first_name} {self.player.last_name}" if self.player else None,
            "team": self.player.team if self.player else None,
            "coach_id": self.coach_id,
            "coach_name": f"{self.coach.first_name} {self.coach.last_name}" if self.coach else None,
            "date": self.date.isoformat() if self.date else None,
            "status": self.status,
        }


class Participation(db.Model):
    __tablename__ = "participation"

    participation_id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey("players.player_id"), nullable=False)
    activity_id = db.Column(db.Integer, db.ForeignKey("training_activities.activity_id"), nullable=False)
    participation_status = db.Column(
        db.Enum("joined", "excused", "no_show", name="participation_status"), default="joined"
    )

    player = db.relationship("Player", back_populates="participations")
    activity = db.relationship("TrainingActivity", back_populates="participations")

    def to_dict(self):
        return {
            "participation_id": self.participation_id,
            "player_id": self.player_id,
            "player_name": f"{self.player.first_name} {self.player.last_name}" if self.player else None,
            "activity_id": self.activity_id,
            "activity_name": self.activity.activity_name if self.activity else None,
            "activity_date": self.activity.activity_date.isoformat() if self.activity and self.activity.activity_date else None,
            "participation_status": self.participation_status,
        }


class PerformanceFeedback(db.Model):
    __tablename__ = "performance_feedback"

    feedback_id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey("players.player_id"), nullable=False)
    coach_id = db.Column(db.Integer, db.ForeignKey("coaches.coach_id"), nullable=False)
    feedback_date = db.Column(db.Date, default=date.today)
    comments = db.Column(db.Text, nullable=False)
    rating = db.Column(db.Integer, nullable=False)  # 1-5
    category = db.Column(db.String(80), nullable=True)  # e.g. "Shooting", "Serving" — sport-specific skill

    player = db.relationship("Player", back_populates="feedback")
    coach = db.relationship("Coach", back_populates="feedback_given")

    def to_dict(self):
        return {
            "feedback_id": self.feedback_id,
            "player_id": self.player_id,
            "player_name": f"{self.player.first_name} {self.player.last_name}" if self.player else None,
            "coach_id": self.coach_id,
            "coach_name": f"{self.coach.first_name} {self.coach.last_name}" if self.coach else None,
            "feedback_date": self.feedback_date.isoformat() if self.feedback_date else None,
            "comments": self.comments,
            "rating": self.rating,
            "category": self.category,
        }


class PlayerNote(db.Model):
    """Personal notes a player submits about themselves (self-reflection / concerns)."""

    __tablename__ = "player_notes"

    note_id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey("players.player_id"), nullable=False)
    note_date = db.Column(db.DateTime, default=datetime.utcnow)
    content = db.Column(db.Text, nullable=False)

    player = db.relationship("Player", back_populates="notes")

    def to_dict(self):
        return {
            "note_id": self.note_id,
            "player_id": self.player_id,
            "note_date": self.note_date.isoformat() if self.note_date else None,
            "content": self.content,
        }


class PlayerHealthRecord(db.Model):
    """History of a player's injury/health status, logged by their coach."""

    __tablename__ = "player_health_records"

    health_record_id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey("players.player_id"), nullable=False)
    coach_id = db.Column(db.Integer, db.ForeignKey("coaches.coach_id"), nullable=True)
    status = db.Column(
        db.Enum("healthy", "injured", "recovering", name="health_record_status"), nullable=False
    )
    injury_type = db.Column(db.String(120))
    notes = db.Column(db.Text)
    reported_date = db.Column(db.Date, default=date.today)
    expected_return_date = db.Column(db.Date, nullable=True)

    player = db.relationship("Player", back_populates="health_records")
    coach = db.relationship("Coach", back_populates="health_records_logged")

    def to_dict(self):
        return {
            "health_record_id": self.health_record_id,
            "player_id": self.player_id,
            "player_name": f"{self.player.first_name} {self.player.last_name}" if self.player else None,
            "coach_id": self.coach_id,
            "coach_name": f"{self.coach.first_name} {self.coach.last_name}" if self.coach else None,
            "status": self.status,
            "injury_type": self.injury_type,
            "notes": self.notes,
            "reported_date": self.reported_date.isoformat() if self.reported_date else None,
            "expected_return_date": self.expected_return_date.isoformat() if self.expected_return_date else None,
        }


class LoginHistory(db.Model):
    __tablename__ = "login_history"

    log_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("system_users.user_id"), nullable=False)
    login_time = db.Column(db.DateTime, default=datetime.utcnow)
    logout_time = db.Column(db.DateTime, nullable=True)
    ip_address = db.Column(db.String(45))
    device_info = db.Column(db.String(255))

    user = db.relationship("SystemUser", back_populates="login_history")

    def to_dict(self):
        return {
            "log_id": self.log_id,
            "user_id": self.user_id,
            "username": self.user.username if self.user else None,
            "role": self.user.role if self.user else None,
            "login_time": self.login_time.isoformat() if self.login_time else None,
            "logout_time": self.logout_time.isoformat() if self.logout_time else None,
            "ip_address": self.ip_address,
            "device_info": self.device_info,
        }


class ArchivedRecord(db.Model):
    __tablename__ = "archived_records"

    archive_id = db.Column(db.Integer, primary_key=True)
    record_type = db.Column(db.String(80), nullable=False)
    record_id = db.Column(db.Integer, nullable=False)
    archive_data = db.Column(db.JSON, nullable=False)
    archived_at = db.Column(db.DateTime, default=datetime.utcnow)
    archived_by = db.Column(db.Integer, db.ForeignKey("system_users.user_id"), nullable=False)

    archiver = db.relationship("SystemUser")

    def to_dict(self):
        return {
            "archive_id": self.archive_id,
            "record_type": self.record_type,
            "record_id": self.record_id,
            "archive_data": self.archive_data,
            "archived_at": self.archived_at.isoformat() if self.archived_at else None,
            "archived_by": self.archived_by,
            "archived_by_name": self.archiver.display_name() if self.archiver else None,
        }


class Report(db.Model):
    __tablename__ = "reports"

    report_id = db.Column(db.Integer, primary_key=True)
    report_type = db.Column(
        db.Enum("attendance", "performance", "training", name="report_type"), nullable=False
    )
    generated_by = db.Column(db.Integer, db.ForeignKey("system_users.user_id"), nullable=False)
    generated_date = db.Column(db.DateTime, default=datetime.utcnow)
    details = db.Column(db.Text)
    status = db.Column(db.Enum("pending", "approved", name="report_status"), default="pending")
    approved_by = db.Column(db.Integer, db.ForeignKey("system_users.user_id"), nullable=True)
    approved_date = db.Column(db.DateTime, nullable=True)

    generator = db.relationship("SystemUser", foreign_keys=[generated_by])
    approver = db.relationship("SystemUser", foreign_keys=[approved_by])

    def to_dict(self):
        return {
            "report_id": self.report_id,
            "report_type": self.report_type,
            "generated_by": self.generated_by,
            "generated_by_name": self.generator.display_name() if self.generator else None,
            "generated_date": self.generated_date.isoformat() if self.generated_date else None,
            "details": self.details,
            "status": self.status,
            "approved_by": self.approved_by,
            "approved_by_name": self.approver.display_name() if self.approver else None,
            "approved_date": self.approved_date.isoformat() if self.approved_date else None,
        }


class Statistic(db.Model):
    __tablename__ = "statistics"

    stats_id = db.Column(db.Integer, primary_key=True)
    stats_type = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    data_payload = db.Column(db.JSON)
    generated_by = db.Column(db.Integer, db.ForeignKey("system_users.user_id"), nullable=True)
    generated_date = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "stats_id": self.stats_id,
            "stats_type": self.stats_type,
            "description": self.description,
            "data_payload": self.data_payload,
            "generated_date": self.generated_date.isoformat() if self.generated_date else None,
        }


class Sport(db.Model):
    """The list of teams/sports a player can join or a coach can specialize in.

    Kept as an admin-managed table (rather than a hardcoded list) so a new
    sport can be added from the UI without a code change.
    """

    __tablename__ = "sports"

    sport_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {"sport_id": self.sport_id, "name": self.name}


class FeedbackCategory(db.Model):
    """Sport-specific skill categories a coach can rate a player on
    (e.g. "Shooting"/"Defense" for Basketball, "Serving"/"Blocking" for
    Volleyball), managed by admins so feedback stays sport-appropriate
    without hardcoding categories per sport in code.
    """

    __tablename__ = "feedback_categories"

    category_id = db.Column(db.Integer, primary_key=True)
    sport_name = db.Column(db.String(80), nullable=False)
    name = db.Column(db.String(80), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint("sport_name", "name", name="uq_feedback_category_sport_name"),)

    def to_dict(self):
        return {"category_id": self.category_id, "sport_name": self.sport_name, "name": self.name}


class ActivityType(db.Model):
    """Sport-specific training activity types (e.g. "Scrimmage"/"Conditioning"
    for Basketball, "Serve Practice"/"Endurance" for Swimming), managed by
    admins the same way as feedback categories so training logs stay
    consistent and reportable across every sport.
    """

    __tablename__ = "activity_types"

    activity_type_id = db.Column(db.Integer, primary_key=True)
    sport_name = db.Column(db.String(80), nullable=False)
    name = db.Column(db.String(80), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint("sport_name", "name", name="uq_activity_type_sport_name"),)

    def to_dict(self):
        return {"activity_type_id": self.activity_type_id, "sport_name": self.sport_name, "name": self.name}
