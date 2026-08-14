# E-HRMS — Employee Human Resource Management System

A full-featured, production-deployed HR management system built with the MERN stack, supporting the complete employee lifecycle from recruitment through payroll with role-based access control across four permission tiers.

 Live demo: https://e-hrms.duckdns.org

Demo credentials (Super Admin)
```
Email:    admin@hrms.com
Password: ChangeMe123!
```

 Stacks
Frontend: React · Vite · Tailwind CSS · React Router · Axios · Recharts
Backend: Node.js · Express · MongoDB · Mongoose · JWT (access + refresh tokens) · bcrypt · Multer · Nodemailer · node-cron
Reporting: ExcelJS · PDFKit
DevOps: Docker · Docker Compose · Nginx (reverse proxy + static hosting) · AWS EC2 · MongoDB Atlas · Let's Encrypt (Certbot) · GitHub Actions (CI/CD)

---
Architecture

```
                        ┌─────────────────────┐
   git push  ────────▶  │   GitHub Actions     │
                        │   (CI/CD pipeline)   │
                        └──────────┬───────────┘
                                   │ SSH deploy
                                   ▼
                        ┌─────────────────────────────┐
                        │      AWS EC2 (Ubuntu)        │
                        │                              │
   HTTPS  ────────────▶ │  Host Nginx (SSL termination)│
                        │        │                     │
                        │        ▼                     │
                        │  Docker container: client     │
                        │  (React build, served by      │
                        │   containerized Nginx)         │
                        │        │  /api, /uploads       │
                        │        ▼                     │
                        │  Docker container: server     │
                        │  (Express API)                │
                        └────────┬─────────────────────┘
                                 │
                                 ▼
                       MongoDB Atlas (cloud DB)
```

Two separate Nginx layers by design: the host-level Nginx terminates HTTPS (via a free Let's Encrypt certificate) and reverse-proxies to the app; the containerized Nginx (built in a multi-stage Docker image) serves the compiled React static files and proxies `/api` and `/uploads` requests to the Express container over Docker's internal network, the Express server itself is never directly exposed to the internet.

---

 Features

- Authentication — JWT access/refresh tokens, silent token refresh, forgot/reset password flow (with hashed, time-limited reset tokens and protection against user enumeration)
- Role-based access control — 4 tiers (Super Admin, HR Manager, Department Manager, Employee), enforced consistently on every route
- Employee Management — full CRUD, auto-generated employee IDs, self-service profile with picture upload
- Department Management — with live employee counts and manager assignment
- Attendance — HR-entered records (designed to mirror data imported from a physical thumbprint device), auto-computed working hours
- Leave Management — apply/approve/reject workflow, live leave balance calculated per type per year
- Payroll — bulk generation, draft → finalized → paid status lifecycle, auto-calculated tax/pension from configurable company settings, itemized payslips
- Performance Reviews — KPIs, goals, manager feedback, employee acknowledgment
- Recruitment — public job listings, resume upload (Multer), applicant tracking through interview scheduling and offers
- Reports — Excel and PDF export for Employees, Departments, Attendance, Leave, and Payroll
- Notifications — in-app notification center, triggered by leave decisions, payroll, new hires, and a scheduled daily birthday check (node-cron)
- Dashboard — live summary cards and charts (attendance trend, department distribution, leave statistics)
- Org Chart — interactive, expandable hierarchy built from manager relationships in the data
- Settings — admin-configurable work schedule, tax/pension rates, leave allocations, and holidays (replacing what would otherwise be hardcoded business logic)

---

 Notable Decisions

A few things worth highlighting:

- Snapshotted, not live, payroll data.** `Payroll` records store the employee's salary and computed totals at the moment payroll is generated, rather than referencing the live `Employee.salary` field. If someone's salary changes next month, previously generated payslips stay historically accurate instead of silently changing.
- Separated `User` (credentials) from `Employee` (HR data). Keeps the authentication layer focused and reusable, while HR-specific fields never leak into login logic. A conscious tradeoff elsewhere: `Employee.department` is stored as a string rather than a reference to `Department`, which keeps the model simple but requires a cascading update when a department is renamed — a known simplification, not an oversight.
- Race-condition-safe token refresh. The Axios interceptor queues concurrent requests during a token refresh rather than firing parallel refresh calls, and explicitly excludes the refresh/login endpoints from its own retry logic an earlier version without that exclusion created a self-referential deadlock where a failed refresh call tried to refresh itself.
- Security-conscious password reset. The forgot-password endpoint always returns an identical response regardless of whether the email exists, preventing account enumeration. Reset tokens are stored as SHA-256 hashes (never raw) with a 15-minute expiry.
- Uploaded files never touch the database. Profile pictures are written to disk (via Multer) and referenced by path not stored as binary blobs in MongoDB with a Docker named volume ensuring they persist across container rebuilds.
- Full containerization with production-appropriate Dockerfiles. The client uses a multi-stage build a Node stage compiles the Vite app, and only the static output is copied into a separate, minimal Nginx image; the Node toolchain never ships in the final image.

---
 Project Structure

```
E-HRMS/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── api/             # One file per resource, wraps axios calls
│   │   ├── components/       # Shared UI (Layout, ProtectedRoute, NotificationBell)
│   │   ├── context/          # AuthContext (global auth state)
│   │   └── pages/            # Route-level components
│   ├── Dockerfile           # Multi-stage: Vite build → Nginx
│   └── nginx.conf
│
├── server/                 # Express backend
│   ├── src/
│   │   ├── controllers/      # Route handler logic
│   │   ├── models/           # Mongoose schemas
│   │   ├── routes/           # Express routers
│   │   ├── middleware/       # protect, authorize
│   │   ├── validators/       # express-validator rules
│   │   └── utils/            # Shared helpers (notifications, tokens, cron jobs)
│   └── Dockerfile
│
├── docker-compose.yml
└── .github/workflows/
    └── deploy.yml           # CI/CD: auto-deploys to EC2 on push to main
```

---
 Running Locally

```bash
# Backend
cd server
npm install
cp .env.example .env    # fill in MONGO_URI, JWT secrets, etc.
npm run dev

# Frontend (separate terminal)
cd client
npm install
npm run dev
```

Or, with Docker:

```bash
docker-compose up --build
```

---

 Roadmap / Build Phases

This project was built in six deliberate phases, from foundation through deployment:

- Phase 1 — Auth, JWT, role-based routing
- Phase 2 — Employee & Department management, Dashboard
- Phase 3 — Attendance, Leave, Notifications
- Phase 4 — Payroll, Reports
- Phase 5 — Settings, Performance Management, Recruitment
- Phase 6 — Dockerization, AWS EC2 deployment, HTTPS, CI/CD
