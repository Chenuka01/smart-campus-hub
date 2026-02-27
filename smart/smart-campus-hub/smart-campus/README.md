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

Runs on **http://localhost:8083**

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
VITE_API_URL=http://localhost:8083/api
```

## API Documentation

Swagger UI available at: **http://localhost:8083/swagger-ui/index.html**

## Core Features

- **Module A** – Facilities & Assets Catalogue (lecture halls, labs, equipment)
- **Module B** – Booking Management (PENDING → APPROVED/REJECTED → CANCELLED, conflict detection)
- **Module C** – Maintenance & Incident Ticketing (priorities, technician assignment, file attachments, comments)
- **Module D** – Notifications (booking/ticket/comment events)
- **Module E** – Authentication & Authorization (JWT, Google OAuth, RBAC: USER / ADMIN / TECHNICIAN)

## Running Tests

```bash
cd backend
./mvnw test
```

Tests use an in-memory H2 database — no MySQL required for testing.

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
