from sqlalchemy import inspect, text


def sync_schema(app, db):
    """Create any brand-new tables and add any columns that exist on the model
    but not yet in the database, without touching existing data. This project
    has no migration tool, so a new column on a model would otherwise 500 on
    every request that touches it until someone manually re-seeds (which wipes
    all data) — this keeps that in sync automatically on startup instead."""
    with app.app_context():
        db.create_all()
        inspector = inspect(db.engine)
        for table in db.metadata.sorted_tables:
            existing_columns = {c["name"] for c in inspector.get_columns(table.name)}
            for column in table.columns:
                if column.name in existing_columns:
                    continue
                col_type_sql = column.type.compile(dialect=db.engine.dialect)
                default_clause = ""
                default = column.default
                if default is not None and getattr(default, "is_scalar", False):
                    value = default.arg
                    if isinstance(value, bool):
                        default_clause = f" DEFAULT {1 if value else 0}"
                    elif isinstance(value, (int, float)):
                        default_clause = f" DEFAULT {value}"
                    elif isinstance(value, str):
                        default_clause = f" DEFAULT '{value}'"
                # Added as nullable regardless of the model's own nullable=False —
                # existing rows have no value yet, and strict-mode MySQL refuses a
                # NOT NULL column add without one. The app already fills real values
                # on write; this is just a safety net for the one-time backfill.
                ddl = f"ALTER TABLE {table.name} ADD COLUMN {column.name} {col_type_sql}{default_clause}"
                with db.engine.begin() as conn:
                    conn.execute(text(ddl))
