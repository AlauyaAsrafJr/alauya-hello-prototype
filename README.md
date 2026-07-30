# ACTIBASE

Varsity Player Engagement and Activity Tracking System with Data Analytics —
a capstone project for Mindanao State University Main Campus. ACTIBASE
replaces manual, paper-based attendance and performance tracking with a
centralized, role-based web system for **Players**, **Coaches**, and
**Administrators**.

## Stack

- **Backend**: Python (Flask), SQLAlchemy, JWT authentication
- **Database**: MySQL
- **Frontend**: React + TypeScript + Vite

## Project structure

```
backend/            Flask API (auth, player, coach, admin blueprints)
  app/
    models.py        SQLAlchemy models matching the system ERD
    auth/             Login / logout / me
    player/           Player-facing endpoints
    coach/            Coach-facing endpoints
    admin/            Admin-facing endpoints
  seed.py             Creates tables and seeds demo accounts + sample data
  wsgi.py             Dev server entrypoint

src/                 React frontend
  api/                Fetch client + shared domain types
  auth/               Auth context, Login page
  player/ coach/ admin/  Per-role dashboards and pages
  components/         Shared UI (Sidebar, Topbar, modals, design tokens)
```

## Backend setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env   # adjust DATABASE_URL / JWT_SECRET_KEY as needed

# Create the MySQL database first, e.g.:
#   CREATE DATABASE actibase CHARACTER SET utf8mb4;
#   CREATE USER 'actibase'@'localhost' IDENTIFIED BY 'actibase_dev_pw';
#   GRANT ALL PRIVILEGES ON actibase.* TO 'actibase'@'localhost';

python seed.py     # creates tables and seeds demo accounts
python wsgi.py     # runs on http://localhost:5000
```

Demo accounts created by `seed.py`:

| Role  | Username       | Password    |
|-------|----------------|-------------|
| Admin | admin          | Admin@123   |
| Coach | coach.vistal   | Coach@123   |
| Player| player1 … player6 | Player@123 |

## Frontend setup

```bash
npm install
cp .env.example .env   # VITE_API_URL defaults to http://localhost:5000/api
npm run dev             # start dev server
npm run build           # typecheck + production build
npm run lint             # oxlint
```

## Roles & features

- **Player**: view profile, attendance, participation history, training
  activity, performance feedback; submit personal notes.
- **Coach**: manage player profiles, record attendance, log/edit training
  activities, track participation, submit/review performance feedback,
  view analytics, generate reports.
- **Admin**: manage system users (create, deactivate, reset password,
  archive), access all player data, generate/approve reports, view system
  statistics (login history, health monitoring), retrieve archived records.

There is no public self-registration. Every account — player, coach, or
admin — is created by an administrator from the Manage Users page, so only
people the sports office has vetted can access the system.
