# 🎓 Smart Campus Operations Hub (Smart-Campus-HUB)

A next-generation university ecosystem for facility management, AI-driven maintenance ticketing, and seamless student-staff operations.

---

## 🌟 Overview
**Smart Campus HUB** is a comprehensive multi-tenant platform designed to modernize university operations. It bridges the gap between infrastructure management and user experience by providing an intuitive interface for booking facilities, reporting issues, and tracking campus health in real-time.

---

## 🚀 Core Features

### 🏛️ Facility & Asset Management
*   **Smart Catalog:** Browse university lecture halls, laboratories, and sports facilities with real-time availability.
*   **Categorization:** Facilities organized by type (Study, Lab, Sport, Event) with capacity and equipment details.
*   **Favorites & Quick-Access:** Save frequently used rooms for rapid booking.

### 📅 Advanced Booking System
*   **Conflict Detection:** Real-time validation to prevent overlapping bookings for the same time slot.
*   **Approval Workflow:** PENDING → APPROVED/REJECTED status tracking with admin review capabilities.
*   **Smart Timers:** Active booking counting and duration tracking.
*   **Purpose Tracking:** Log reason for use and expected attendees for resource planning.

### 🛠️ AI-Powered Maintenance Ticketing
*   **Auto-Classification:** The system uses NLP-inspired keyword analysis to automatically categorize tickets (IT, Electrical, Plumbing, HVAC, etc.) based on user descriptions.
*   **AI Priority Suggestion:** Automatically determines urgency (CRITICAL, HIGH, MEDIUM, LOW) based on safety hazards and impact.
*   **Technician Auto-Assignment:** Intelligent routing of tickets to technicians based on their specific specialties and workload.
*   **SLA Tracking:** Real-time Service Level Agreement (SLA) monitoring with visual indicators for "Resolved within SLA" or "Overdue" status.
*   **Collaborative Fixes:** Internal comment threads for technicians and users, with file attachments support.

### 🔔 Smart Notification Engine
*   **Real-time Alerts:** Instant WebSocket-driven in-app notifications for booking approvals, ticket updates, and comments.
*   **Preference Management:** Granular controls for users to toggle Booking, Ticket, or Comment alerts.
*   **DND (Do Not Disturb) Mode:** Scheduled windows to silence notifications during study or sleep hours.
*   **Email Integration:** Automated SMTP email alerts for critical system events.

### 📊 Admin & Analytics Dashboard
*   **Operational Insights:** Visual charts for ticket distribution, facility usage rates, and SLA performance.
*   **User Management:** Role-Based Access Control (RBAC) with USER, TECHNICIAN, and ADMIN tiers.
*   **Resource Monitoring:** Real-time view of all active campus operations.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend** | Java 21, Spring Boot 3.4.3, Spring Security (JWT) |
| **Persistence** | MySQL 8+, Spring Data JPA |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Styling** | Glassmorphism UI, Framer Motion, Shadcn/UI |
| **Messaging** | Spring WebSocket (STOMP), JavaMail |
| **Security** | JWT, Google OAuth 2.0 Integration |

---

## 🚦 Getting Started

### 1. Prerequisites
*   **Java:** JDK 21+
*   **Database:** MySQL 8.0+
*   **Node.js:** v20+
*   **Tooling:** Maven 3.9+

### 2. Backend Setup
1.  Navigate to `smart/smart-campus-hub/smart-campus/backend`.
2.  Configure `src/main/resources/application.properties` with your MySQL credentials.
3.  Run the application:
    ```bash
    ./mvnw spring-boot:run
    ```
    *Server runs on:* `http://localhost:8084`

### 3. Frontend Setup
1.  Navigate to `smart/smart-campus-hub/smart-campus/frontend`.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Launch the dev server:
    ```bash
    npm run dev
    ```
    *Client runs on:* `http://localhost:5173`

---

## 🔒 Security & Roles

*   **ADMIN:** Full system control, analytics access, facility management, and user oversight.
*   **TECHNICIAN:** Specialty-based ticket assignment, maintenance logging, and SLA compliance.
*   **USER:** Facility discovery, booking requests, and issue reporting.

---

## 📄 API Documentation
Documentation is auto-generated via **Swagger/OpenAPI**: 
`http://localhost:8084/swagger-ui/index.html`

---

## 🤝 Contributing
For major changes, please open an issue first to discuss what you would like to change. 

**Happy Managing!** 🚀
