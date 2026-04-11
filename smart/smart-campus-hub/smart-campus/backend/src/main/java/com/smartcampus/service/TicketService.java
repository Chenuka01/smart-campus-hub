package com.smartcampus.service;

import com.smartcampus.dto.TicketRequest;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.Notification;
import com.smartcampus.model.Ticket;
import com.smartcampus.model.User;
import com.smartcampus.repository.TicketRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final NotificationService notificationService;
    private final TicketClassificationService ticketClassificationService;
    private final TechnicianAutoAssignmentService technicianAutoAssignmentService;

    public TicketService(TicketRepository ticketRepository, NotificationService notificationService,
                         TicketClassificationService ticketClassificationService,
                         TechnicianAutoAssignmentService technicianAutoAssignmentService) {
        this.ticketRepository = ticketRepository;
        this.notificationService = notificationService;
        this.ticketClassificationService = ticketClassificationService;
        this.technicianAutoAssignmentService = technicianAutoAssignmentService;
    }

    public Ticket createTicket(TicketRequest request, User user, List<String> attachmentUrls) {
        TicketClassificationService.TicketClassification classification = ticketClassificationService.classify(
                request.getTitle(), request.getDescription(), request.getLocation(),
                request.getCategory(), request.getPriority());
        LocalDateTime now = LocalDateTime.now();

        Ticket ticket = new Ticket();
        ticket.setTitle(request.getTitle());
        ticket.setFacilityId(request.getFacilityId());
        ticket.setLocation(request.getLocation());
        ticket.setCategory(classification.category());
        ticket.setDescription(request.getDescription());
        ticket.setPriority(classification.priority());
        ticket.setStatus(Ticket.TicketStatus.OPEN);
        ticket.setReportedBy(user.getId());
        ticket.setReportedByName(user.getName());
        ticket.setContactEmail(request.getContactEmail());
        ticket.setContactPhone(request.getContactPhone());
        ticket.setAttachmentUrls(attachmentUrls);
        ticket.setCreatedAt(now);
        ticket.setUpdatedAt(now);
        applySlaPolicy(ticket, now);

        User assignedTechnician = null;
        if (request.getAssignedTo() != null && !request.getAssignedTo().isEmpty()) {
            ticket.setAssignedTo(request.getAssignedTo());
            ticket.setAssignedToName(request.getAssignedToName());
        } else {
            assignedTechnician = autoAssignTechnician(ticket);
        }

        Ticket savedTicket = ticketRepository.save(ticket);
        if (assignedTechnician != null || ticket.getAssignedTo() != null) {
            sendAutoAssignmentNotifications(savedTicket, assignedTechnician);
        }
        return applySlaState(savedTicket);
    }

    public Ticket assignTicket(String ticketId, String technicianId, String technicianName) {
        Ticket ticket = getTicketById(ticketId);
        ticket.setAssignedTo(technicianId);
        ticket.setAssignedToName(technicianName);
        // Do not change status to IN_PROGRESS automatically; keep it OPEN until technician starts work
        ticket.setUpdatedAt(LocalDateTime.now());
        applySlaState(ticket);
        Ticket saved = ticketRepository.save(ticket);

        notificationService.createNotification(
                ticket.getReportedBy(),
                "Ticket Assigned",
                "Your ticket '" + ticket.getTitle() + "' has been assigned to " + technicianName,
                Notification.NotificationType.TICKET_ASSIGNED,
                ticket.getId(), "TICKET");

        notificationService.createNotification(
                technicianId,
                "New Ticket Assignment",
                "You have been assigned to ticket: " + ticket.getTitle(),
                Notification.NotificationType.TICKET_ASSIGNED,
                ticket.getId(), "TICKET");

        return saved;
    }

    public Ticket updateTicketStatus(String ticketId, String status, String resolutionNotes, String rejectionReason, User user) {
        Ticket ticket = getTicketById(ticketId);
        Ticket.TicketStatus newStatus = Ticket.TicketStatus.valueOf(status);
        Ticket.TicketStatus oldStatus = ticket.getStatus();

        // 1. Same status is always allowed (no-op)
        if (newStatus == oldStatus) {
            return ticket;
        }

        // 2. Allow transitions from REJECTED back to OPEN if Admin wants to re-process (Optional but helpful)
        if (newStatus == Ticket.TicketStatus.OPEN && oldStatus == Ticket.TicketStatus.REJECTED) {
            ticket.setRejectionReason(null);
        }

        // 3. Main Workflow Validation: OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED
        if (newStatus == Ticket.TicketStatus.IN_PROGRESS && (oldStatus != Ticket.TicketStatus.OPEN)) {
            throw new RuntimeException("Can only move to IN_PROGRESS from OPEN (currently: " + oldStatus + ")");
        }
        if (newStatus == Ticket.TicketStatus.RESOLVED && oldStatus != Ticket.TicketStatus.IN_PROGRESS) {
            throw new RuntimeException("Can only move to RESOLVED from IN_PROGRESS (currently: " + oldStatus + ")");
        }
        if (newStatus == Ticket.TicketStatus.CLOSED && (oldStatus != Ticket.TicketStatus.RESOLVED && oldStatus != Ticket.TicketStatus.OPEN && oldStatus != Ticket.TicketStatus.IN_PROGRESS && oldStatus != Ticket.TicketStatus.REJECTED)) {
            // Allow Admin to close from any state, but user usually resolves first
            throw new RuntimeException("Invalid closing state (currently: " + oldStatus + ")");
        }

        // 4. Rejected or Cancelled: ONLY allowed for ADMIN or SUPER_ADMIN
        boolean isPrivileged = user.getRoles().stream().anyMatch(r -> r == User.Role.ADMIN || r == User.Role.SUPER_ADMIN);
        if (newStatus == Ticket.TicketStatus.REJECTED && !isPrivileged) {
            throw new RuntimeException("Only Administrators can reject tickets.");
        }

        ticket.setStatus(newStatus);
        ticket.setUpdatedAt(LocalDateTime.now());

        if (newStatus == Ticket.TicketStatus.RESOLVED) {
            ticket.setResolutionNotes(resolutionNotes);
            ticket.setResolvedAt(LocalDateTime.now());
        } else if (newStatus == Ticket.TicketStatus.CLOSED) {
            ticket.setClosedAt(LocalDateTime.now());
        } else if (newStatus == Ticket.TicketStatus.REJECTED) {
            ticket.setRejectionReason(rejectionReason);
        } else if (newStatus == Ticket.TicketStatus.IN_PROGRESS) {
            // Clear any previous rejection reason if moved back to progress
            ticket.setRejectionReason(null);
        }

        applySlaState(ticket);
        Ticket saved = ticketRepository.save(ticket);

        Notification.NotificationType notifType;
        String message;
        switch (newStatus) {
            case RESOLVED:
                notifType = Notification.NotificationType.TICKET_RESOLVED;
                message = "Your ticket '" + ticket.getTitle() + "' has been resolved.";
                break;
            case CLOSED:
                notifType = Notification.NotificationType.TICKET_CLOSED;
                message = "Your ticket '" + ticket.getTitle() + "' has been closed.";
                break;
            case REJECTED:
                notifType = Notification.NotificationType.TICKET_REJECTED;
                message = "Your ticket '" + ticket.getTitle() + "' has been rejected. Reason: " + rejectionReason;
                break;
            default:
                notifType = Notification.NotificationType.TICKET_STATUS_CHANGED;
                message = "Your ticket '" + ticket.getTitle() + "' status changed to " + status;
        }

        notificationService.createNotification(
                ticket.getReportedBy(), "Ticket Update", message,
                notifType, ticket.getId(), "TICKET");

        return saved;
    }

    public Ticket getTicketById(String id, User user) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + id));

        boolean isStaff = user.getRoles().stream()
                .anyMatch(r -> List.of("ADMIN", "SUPER_ADMIN", "MANAGER", "TECHNICIAN").contains(r.name()));
        boolean isOwner = ticket.getReportedBy().equals(user.getId());

        if (!isStaff && !isOwner) {
            throw new RuntimeException("Not authorized to view this ticket");
        }

        return applySlaState(ticket);
    }

    private Ticket getTicketById(String id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + id));
        return applySlaState(ticket);
    }

    public List<Ticket> getAllTickets() {
        return ticketRepository.findAll().stream()
                .map(this::applySlaState)
                .toList();
    }

    public List<Ticket> getUserTickets(String userId) {
        return ticketRepository.findByReportedBy(userId).stream()
                .map(this::applySlaState)
                .toList();
    }

    public List<Ticket> getAssignedTickets(String technicianId) {
        return ticketRepository.findByAssignedTo(technicianId).stream()
                .map(this::applySlaState)
                .toList();
    }

    public List<Ticket> getTicketsByStatus(Ticket.TicketStatus status) {
        return ticketRepository.findByStatus(status).stream()
                .map(this::applySlaState)
                .toList();
    }

    public Ticket updateTicket(String ticketId, TicketRequest request, User user) {
        return updateTicket(ticketId, request, user, null);
    }

    public Ticket updateTicket(String ticketId, TicketRequest request, User user, List<String> attachmentUrls) {
        Ticket ticket = getTicketById(ticketId);

        // Security check: Only reporter or staff can update.
        // Also only if it's still OPEN (standard policy)
        boolean isStaff = user.getRoles().stream()
                .anyMatch(r -> List.of("ADMIN", "SUPER_ADMIN", "MANAGER", "TECHNICIAN").contains(r.name()));
        if (!ticket.getReportedBy().equals(user.getId()) && !isStaff) {
            throw new RuntimeException("Not authorized to edit this ticket");
        }

        if (ticket.getStatus() != Ticket.TicketStatus.OPEN && !isStaff) {
            throw new RuntimeException("Cannot edit ticket that is already " + ticket.getStatus());
        }

        String category = isBlank(request.getCategory()) ? ticket.getCategory() : request.getCategory();
        String priority = isBlank(request.getPriority()) ? ticket.getPriority().name() : request.getPriority();
        TicketClassificationService.TicketClassification classification = ticketClassificationService.classify(
                request.getTitle(), request.getDescription(), request.getLocation(),
                category, priority);

        ticket.setTitle(request.getTitle());
        ticket.setCategory(classification.category());
        ticket.setPriority(classification.priority());
        ticket.setDescription(request.getDescription());
        ticket.setLocation(request.getLocation());
        ticket.setContactEmail(request.getContactEmail());
        ticket.setContactPhone(request.getContactPhone());
        if (attachmentUrls != null) {
            ticket.setAttachmentUrls(new ArrayList<>(attachmentUrls));
        }
        ticket.setUpdatedAt(LocalDateTime.now());
        applySlaPolicy(ticket, ticket.getCreatedAt() != null ? ticket.getCreatedAt() : LocalDateTime.now());
        applySlaState(ticket);

        return ticketRepository.save(ticket);
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    public void deleteTicket(String ticketId) {
        if (!ticketRepository.existsById(ticketId)) {
            throw new ResourceNotFoundException("Ticket not found with id: " + ticketId);
        }
        ticketRepository.deleteById(ticketId);
    }

    public void deleteTicketByUser(String ticketId, User user) {
        Ticket ticket = getTicketById(ticketId);

        // Only reporter (if OPEN) or staff can delete
        boolean isStaff = user.getRoles().stream()
                .anyMatch(r -> List.of("ADMIN", "SUPER_ADMIN", "MANAGER", "TECHNICIAN").contains(r.name()));
        boolean isOwner = ticket.getReportedBy().equals(user.getId());

        if (isStaff) {
            ticketRepository.deleteById(ticketId);
            return;
        }

        if (isOwner) {
            if (ticket.getStatus() == Ticket.TicketStatus.OPEN) {
                ticketRepository.deleteById(ticketId);
            } else {
                throw new RuntimeException("Cannot delete a ticket that is " + ticket.getStatus());
            }
        } else {
            throw new RuntimeException("Not authorized to delete this ticket");
        }
    }

    public void bulkDeleteTickets(List<String> ids) {
        ticketRepository.deleteAllById(ids);
    }

    public int resetStaleInProgressToOpen() {
        return ticketRepository.updateStatusByStatus(Ticket.TicketStatus.IN_PROGRESS, Ticket.TicketStatus.OPEN);
    }

    public void clearAllClosedResolvedTickets() {
        List<Ticket> toDelete = ticketRepository.findAll().stream()
                .filter(t -> t.getStatus() == Ticket.TicketStatus.CLOSED || t.getStatus() == Ticket.TicketStatus.RESOLVED)
                .toList();
        ticketRepository.deleteAll(toDelete);
    }

    private void applySlaPolicy(Ticket ticket, LocalDateTime baseTime) {
        int slaTargetMinutes = getSlaTargetMinutes(ticket.getPriority());
        ticket.setSlaTargetMinutes(slaTargetMinutes);
        ticket.setSlaDueAt(baseTime.plusMinutes(slaTargetMinutes));
        ticket.setSlaMet(null);
    }

    private User autoAssignTechnician(Ticket ticket) {
        return technicianAutoAssignmentService.findBestTechnicianForCategory(ticket.getCategory())
                .map(technician -> {
                    ticket.setAssignedTo(technician.getId());
                    ticket.setAssignedToName(technician.getName());
                    // Keep status as OPEN; technician must manually start it
                    return technician;
                })
                .orElse(null);
    }

    private void sendAutoAssignmentNotifications(Ticket ticket, User technician) {
        if (technician == null) {
            return;
        }

        notificationService.createNotification(
                ticket.getReportedBy(),
                "Ticket Auto-Assigned",
                "Your ticket '" + ticket.getTitle() + "' was automatically assigned to " + technician.getName(),
                Notification.NotificationType.TICKET_ASSIGNED,
                ticket.getId(), "TICKET");

        notificationService.createNotification(
                technician.getId(),
                "New Auto-Assigned Ticket",
                "A " + ticket.getCategory() + " ticket has been automatically assigned to you: " + ticket.getTitle(),
                Notification.NotificationType.TICKET_ASSIGNED,
                ticket.getId(), "TICKET");
    }

    private Ticket applySlaState(Ticket ticket) {
        if (ticket.getSlaDueAt() == null) {
            return ticket;
        }

        boolean terminal = ticket.getStatus() == Ticket.TicketStatus.RESOLVED
                || ticket.getStatus() == Ticket.TicketStatus.CLOSED
                || ticket.getStatus() == Ticket.TicketStatus.REJECTED;
        boolean breached = LocalDateTime.now().isAfter(ticket.getSlaDueAt());
        ticket.setSlaBreached(breached);

        if (terminal) {
            LocalDateTime completedAt = ticket.getResolvedAt() != null
                    ? ticket.getResolvedAt()
                    : ticket.getClosedAt() != null ? ticket.getClosedAt() : ticket.getUpdatedAt();
            ticket.setSlaMet(completedAt != null && !completedAt.isAfter(ticket.getSlaDueAt()));
        }

        return ticket;
    }

    private int getSlaTargetMinutes(Ticket.Priority priority) {
        Map<Ticket.Priority, Integer> priorityToMinutes = Map.of(
                Ticket.Priority.CRITICAL, 4 * 60,
                Ticket.Priority.HIGH, 8 * 60,
                Ticket.Priority.MEDIUM, 24 * 60,
                Ticket.Priority.LOW, 72 * 60
        );
        return priorityToMinutes.getOrDefault(priority, 24 * 60);
    }
}
