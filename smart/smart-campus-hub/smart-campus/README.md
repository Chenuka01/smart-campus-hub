# Smart Campus Operations Hub

A full-stack web platform for university facility booking and maintenance ticketing.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 21, Spring Boot 3.4.3, Spring Security (JWT), Spring Data JPA |
| Database | MySQL 8+ |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| CI/CD | GitHub Actions |

## Prerequisites

- Java 21 (Temurin recommended)
- Maven 3.9+
- Node.js 20+
- MySQL 8+

## Setup

### 1. Database

Create the database (auto-created on first run if using `createDatabaseIfNotExist=true`):

```sql
CREATE DATABASE studenthub;
```

### 2. Backend

```bash
cd backend
./mvnw spring-boot:run
```

Runs on **http://localhost:8084**

Default seed accounts (created automatically on first run):

| Email | Password | Role |
|---|---|---|
| admin@smartcampus.com | password123 | ADMIN |
| tech@smartcampus.com | password123 | TECHNICIAN |
| user@smartcampus.com | password123 | USER |

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on **http://localhost:5173** (or 5174 if port is busy)

### 4. Configuration

Backend config is in `backend/src/main/resources/application.properties`.
Update `spring.datasource.username` / `spring.datasource.password` to match your MySQL credentials.

Frontend API URL is in `frontend/.env`:
```
VITE_API_URL=http://localhost:8084/api
```

## API Documentation

Swagger UI available at: **http://localhost:8084/swagger-ui/index.html**

## Core Features

- **Module A** – Facilities & Assets Catalogue (lecture halls, labs, equipment)
- **Module B** – Booking Management (PENDING → APPROVED/REJECTED → CANCELLED, conflict detection)
- **Module C** – Maintenance & Incident Ticketing (AI category/priority suggestion, SLA timer, technician assignment, file attachments, comments)
- **Module D** – Notifications (booking/ticket/comment events)
- **Module E** – Authentication & Authorization (JWT, Google OAuth, RBAC: USER / ADMIN / TECHNICIAN)

## Ticket SLA Example

Tickets now carry an SLA timer based on priority:

| Priority | SLA Target |
|---|---|
| CRITICAL | 4 hours |
| HIGH | 8 hours |
| MEDIUM | 24 hours |
| LOW | 72 hours |

Example:

- A ticket reported at `2026-04-07 09:00` with priority `HIGH` gets an SLA due time of `2026-04-07 17:00`.
- If it is resolved before `17:00`, the UI shows `Resolved within SLA`.
- If it is still open after `17:00`, the UI shows `Overdue by ...`.

## UI Testing Guide

Use this guide to test the ticketing features directly from the UI.

### Start the App

Backend:

```bash
cd backend
./mvnw spring-boot:run
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Open:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8084`
- Swagger: `http://localhost:8084/swagger-ui/index.html`

### Suggested Test Accounts

These are the most useful local accounts for UI testing:

| Email | Password | Role | Use |
|---|---|---|---|
| `jane@smartcampus.com` | `password123` | USER | Create tickets |
| `tech@smartcampus.com` | `tech123` | TECHNICIAN | Check auto-assignment |
| `manager@smartcampus.com` | `manager123` | MANAGER | View all tickets / manage status |
| `superadmin@smartcampus.com` | `password123` | SUPER_ADMIN | Full access |

### Feature 1: AI Issue Categorization and Auto Priority

Goal:

- Confirm category and priority can be left on `Auto-detect`
- Confirm the system fills them based on title + description

Steps:

1. Sign in as `jane@smartcampus.com`
2. Open `Tickets` -> `New Ticket`
3. Leave `Category` as `Auto-detect`
4. Leave `Priority` as `Auto-detect`
5. Try one of these examples:

Example A:

- Title: `Projector not working in Lecture Hall`
- Location: `Block A, Ground Floor`
- Description: `The projector is flickering and HDMI input is not detected.`

Expected:

- Category becomes `IT Equipment`
- Priority becomes `HIGH`

Example B:

- Title: `Water leak near washroom`
- Location: `Block B, 1st Floor`
- Description: `Water is leaking from the pipe and the floor is getting flooded.`

Expected:

- Category becomes `Plumbing`
- Priority becomes `HIGH` or `CRITICAL` depending on wording

### Feature 2: SLA Timer

Goal:

- Confirm each ticket shows an SLA state
- Confirm SLA is based on priority

SLA policy:

- `CRITICAL` -> 4 hours
- `HIGH` -> 8 hours
- `MEDIUM` -> 24 hours
- `LOW` -> 72 hours

Steps:

1. Create a ticket from the new ticket form
2. After submit, open `Tickets`
3. Open the created ticket
4. Check the SLA block in the ticket detail page

Expected:

- Ticket list shows `SLA: ... left` or `SLA: Overdue by ...`
- Ticket detail page shows:
- `SLA Target`
- `Due By`
- `Current SLA State`

Easy test:

- Create one `HIGH` ticket and confirm the due time is roughly 8 hours from creation

### Feature 3: Image Preview and Annotation

Goal:

- Confirm evidence photos can be previewed before submitting
- Confirm annotations can be drawn and saved

Steps:

1. Open `Tickets` -> `New Ticket`
2. Upload 1 to 3 images in `Evidence Photos`
3. In the image grid:
- click the `eye` button to preview
- click the `pencil` button to annotate
4. In annotation mode:
- choose a color
- choose brush size
- draw on the image
- click `Save`
5. Submit the ticket

Expected:

- Preview modal opens correctly
- Annotation canvas loads the image
- Saved annotation replaces the original preview in the form
- The annotated image is uploaded with the ticket

### Feature 4: Auto Assign Technician Based on Category

Goal:

- Confirm ticket assignment happens automatically after creation
- Confirm the matching technician is selected using category specialties

Current seeded technician specialties:

- `tech@smartcampus.com`
- `Electrical`
- `HVAC`
- `IT Equipment`
- `Safety`

Steps:

1. Sign in as `jane@smartcampus.com`
2. Create a ticket with a matching category, for example:

Example A:

- Category: `Auto-detect`
- Title: `Lab PC not booting`
- Description: `The computer in the lab is not starting and shows no display.`

Expected:

- Category resolves to `IT Equipment`
- Ticket is auto-assigned to `tech@smartcampus.com`
- Status changes to `IN_PROGRESS`

Example B:

- Category: `Electrical`
- Title: `Socket sparks when plugged in`
- Description: `The power outlet in Room 101 gives sparks and smells burnt.`

Expected:

- Ticket is auto-assigned to `tech@smartcampus.com`

Verification:

1. Open the ticket detail page as the user
2. Confirm `Assigned To` shows the technician name
3. Sign out and log in as `tech@smartcampus.com`
4. Open `Tickets` or technician views
5. Confirm the ticket appears in the technician workflow

### Recommended End-to-End Demo Flow

If you want to demo all four features quickly:

1. Log in as `jane@smartcampus.com`
2. Create a new ticket with:
- auto category
- auto priority
- one uploaded image
- one saved annotation
3. Submit the ticket
4. Open the ticket detail page
5. Confirm:
- category was inferred
- priority was inferred
- SLA timer is visible
- technician was auto-assigned
6. Log in as `tech@smartcampus.com`
7. Confirm the assigned ticket is visible to the technician

### Troubleshooting

- If the frontend cannot talk to the backend, confirm `frontend/.env` contains:

```env
VITE_API_URL=http://localhost:8084/api
```

- If Google sign-in is being tested too, make sure your Google OAuth authorized origin includes:

```text
http://localhost:5173
```

- If seeded users are missing, restart the backend and check the startup logs for user creation messages.

## Running Tests

```bash
cd backend
./mvnw test
```

Tests use an in-memory H2 database — no MySQL required for testing.

## Viva Guide

For Member 3 ticketing system viva preparation, see:

- [MEMBER3_TICKETING_VIVA_GUIDE.md](/Users/dularadilmikaaluthge/Documents/Y3S1/PAF3030/smart-campus-hub/smart/smart-campus-hub/smart-campus/MEMBER3_TICKETING_VIVA_GUIDE.md)

## Project Structure

```
smart-campus/
├── backend/          # Spring Boot REST API
│   └── src/main/java/com/smartcampus/
│       ├── controller/   # REST endpoints
│       ├── service/      # Business logic
│       ├── model/        # JPA entities
│       ├── repository/   # Spring Data JPA
│       ├── dto/          # Request/response objects
│       ├── security/     # JWT filter & provider
│       ├── exception/    # Global error handling
│       └── config/       # Security, data seeding
└── frontend/         # React + TypeScript SPA
    └── src/
        ├── pages/        # Route-level components
        ├── components/   # Shared UI components
        ├── context/      # Auth context
        └── lib/          # API client, types, utils
```
