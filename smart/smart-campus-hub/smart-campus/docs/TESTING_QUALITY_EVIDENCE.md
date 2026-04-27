# Testing and Quality Evidence

This project includes automated backend tests, a Postman API collection, bean validation, and centralized API error handling.

## Automated Test Coverage

Run from `smart/smart-campus-hub/smart-campus/backend`:

```bash
mvn --batch-mode test
```

Current verified result:

```text
Tests run: 45, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

Key test files:

| Area | Evidence |
| --- | --- |
| Spring application context | `src/test/java/com/smartcampus/SmartCampusApplicationTests.java` |
| Booking API integration tests | `src/test/java/com/smartcampus/BookingControllerIntegrationTest.java` |
| Ticket API integration tests | `src/test/java/com/smartcampus/TicketControllerIntegrationTest.java` |
| Booking business rules | `src/test/java/com/smartcampus/service/BookingServiceTest.java` |
| Facility CRUD and not-found handling | `src/test/java/com/smartcampus/service/FacilityServiceTest.java` |
| Ticket creation, assignment, status transitions, not-found errors | `src/test/java/com/smartcampus/service/TicketServiceTest.java` |
| Ticket auto-classification | `src/test/java/com/smartcampus/service/TicketClassificationServiceTest.java` |
| Comment ownership and notification behavior | `src/test/java/com/smartcampus/service/CommentServiceTest.java` |
| Notification analytics and email behavior | `src/test/java/com/smartcampus/service/NotificationServiceTest.java` |

## Integration Test Evidence

`BookingControllerIntegrationTest` and `TicketControllerIntegrationTest` verify the HTTP layer with `MockMvc`, Spring Security authentication, H2 test databases, JSON request handling, multipart request handling, persistence, and centralized exception responses.

Covered scenarios:

- `POST /api/bookings` creates a pending booking against an active facility.
- `POST /api/bookings` rejects overlapping booking slots with HTTP `409 Conflict`.
- `POST /api/bookings` rejects invalid payloads with HTTP `400 Bad Request` and field-level errors.
- `PUT /api/bookings/{id}/approve` allows admin users to approve pending bookings.
- `POST /api/tickets/simple` creates a ticket and auto-detects category/priority.
- `POST /api/tickets` accepts multipart ticket evidence and stores an attachment URL.
- `POST /api/tickets/simple` auto-assigns a matching technician while keeping the ticket `OPEN` until work starts.
- Invalid ticket payloads return HTTP `400 Bad Request` with field-level validation errors for title, location, description, email, and phone number.

## Unit Test Evidence

The service tests cover business logic without requiring a running server:

- Booking conflicts, cancellation rules, approval/rejection flows, and not-found behavior.
- Ticket creation, classification, auto-assignment notifications, rejection handling, audit-log dependency wiring, and not-found behavior.
- Comment edit authorization, reporter notification behavior, and unknown comment deletion.
- Facility creation/update/delete and not-found behavior.
- Notification analytics aggregation and email preference behavior.

## Postman Collection Evidence

Manual/API exploratory testing is supported by:

```text
SmartCampus-API.postman_collection.json
```

Collection coverage includes:

- Auth and authorization: register, login by role, `/me`, Google OAuth exchange, admin-only users, unauthorized access.
- Facilities: public search/read plus admin create/update/delete.
- Bookings: create, conflict case, user/admin retrieval, approve, cancel, reject.
- Tickets: JSON creation, retrieval, admin/technician views, assignment, status update, comments, deletion.
- Notifications: list, unread list/count, mark read, mark all read, delete.

## Validation Evidence

DTO validation uses Jakarta Bean Validation annotations:

- `RegisterRequest` and `AuthRequest`: required email/password, email format, password length.
- `BookingRequest`: required facility, date, start/end time, and purpose.
- `TicketRequest`: required title/location/description, title and description length limits, email format, and 10-digit phone validation.

Controllers apply validation with `@Valid` on request bodies and multipart JSON parts, so invalid client input is rejected before service logic runs.

## Error Handling Evidence

`GlobalExceptionHandler` centralizes API error responses:

- `ResourceNotFoundException` -> `404 Not Found`
- `BadRequestException` and validation failures -> `400 Bad Request`
- `UnauthorizedException` -> `401 Unauthorized`
- `ConflictException` -> `409 Conflict`
- Upload size violations -> `413 Payload Too Large`
- Unsupported media types -> `415 Unsupported Media Type`
- Unsupported HTTP methods -> `405 Method Not Allowed`
- Unexpected failures -> `500 Internal Server Error`

This gives clients predictable status codes and JSON error bodies instead of raw stack traces.
