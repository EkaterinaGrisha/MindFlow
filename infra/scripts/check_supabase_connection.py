"""Simple connectivity check for Supabase Postgres using DATABASE_URL."""

from __future__ import annotations

import os
import sys

from dotenv import load_dotenv
from sqlalchemy import create_engine, text


def main() -> int:
    load_dotenv()
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        print("DATABASE_URL is not set. Add it to .env first.")
        return 1

    engine = create_engine(database_url, pool_pre_ping=True)

    with engine.connect() as connection:
        db_name = connection.execute(text("select current_database();")).scalar_one()
        db_user = connection.execute(text("select current_user;")).scalar_one()

    print(f"Database connection is OK. db={db_name}, user={db_user}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
