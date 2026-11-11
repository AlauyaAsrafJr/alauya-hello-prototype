from sqlalchemy import Enum, inspect, text


def sync_schema(app, db):
    """Create any brand-new tables, add any columns that exist on the model but
    not yet in the database, and widen MySQL ENUM columns that gained new
    allowed values — all without touching existing data. This project has no
    migration tool, so a model change would otherwise 500 on every request
    that touches it until someone manually re-seeds (which wipes all data) —
    this keeps that in sync automatically on startup instead."""
    with app.app_context():
        db.create_all()
        inspector = inspect(db.engine)
        dialect_name = db.engine.dialect.name
        for table in db.metadata.sorted_tables:
            existing_columns = {c["name"]: c for c in inspector.get_columns(table.name)}
            for column in table.columns:
                if column.name not in existing_columns:
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
                    continue

                # MySQL stores Enum as a native ENUM(...) column, so a new allowed
                # value (e.g. adding "other" to report_type) needs the column
                # widened in place — reflecting existing rows is unaffected since
                # their current value is always a subset of the new allowed set.
                if dialect_name == "mysql" and isinstance(column.type, Enum):
                    reflected_type = existing_columns[column.name]["type"]
                    reflected_values = set(getattr(reflected_type, "enums", []) or [])
                    model_values = set(column.type.enums)
                    if model_values - reflected_values:
                        col_type_sql = column.type.compile(dialect=db.engine.dialect)
                        null_clause = "NULL" if column.nullable else "NOT NULL"
                        ddl = f"ALTER TABLE {table.name} MODIFY COLUMN {column.name} {col_type_sql} {null_clause}"
                        with db.engine.begin() as conn:
                            conn.execute(text(ddl))
