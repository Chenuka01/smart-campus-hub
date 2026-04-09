package com.smartcampus.service;

import com.smartcampus.dto.TicketRequest;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.Notification;
import com.smartcampus.model.Ticket;
import com.smartcampus.model.User;
import com.smartcampus.repository.TicketRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
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
        User autoAssignedTechnician = autoAssignTechnician(ticket);

        Ticket savedTicket = ticketRepository.save(ticket);
        sendAutoAssignmentNotifications(savedTicket, autoAssignedTechnician);
        return applySlaState(savedTicket);
    }

    public Ticket assignTicket(String ticketId, String technicianId, String technicianName) {
        Ticket ticket = getTicketById(ticketId);
        ticket.setAssignedTo(technicianId);
        ticket.setAssignedToName(technicianName);
        ticket.setStatus(Ticket.TicketStatus.IN_PROGRESS);
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

    public Ticket updateTicketStatus(String ticketId, String status, String resolutionNotes, String rejectionReason) {
        Ticket ticket = getTicketById(ticketId);
        Ticket.TicketStatus newStatus = Ticket.TicketStatus.valueOf(status);

        ticket.setStatus(newStatus);
        ticket.setUpdatedAt(LocalDateTime.now());

        if (newStatus == Ticket.TicketStatus.RESOLVED) {
            ticket.setResolutionNotes(resolutionNotes);
            ticket.setResolvedAt(LocalDateTime.now());
        } else if (newStatus == Ticket.TicketStatus.CLOSED) {
            ticket.setClosedAt(LocalDateTime.now());
        } else if (newStatus == Ticket.TicketStatus.REJECTED) {
            ticket.setRejectionReason(rejectionReason);
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

    public Ticket getTicketById(String id) {
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
        Ticket ticket = getTicketById(ticketId);

        // Security check: Only reporter or Admin can update.
        // Also only if it's still OPEN (standard policy)
        boolean isAdmin = user.getRoles().stream().anyMatch(r -> r.name().contains("ADMIN"));
        if (!ticket.getReportedBy().equals(user.getId()) && !isAdmin) {
            throw new RuntimeException("Not authorized to edit this ticket");
        }

        if (ticket.getStatus() != Ticket.TicketStatus.OPEN && !isAdmin) {
            throw new RuntimeException("Cannot edit ticket that is already " + ticket.getStatus());
        }

        TicketClassificationService.TicketClassification classification = ticketClassificationService.classify(
                request.getTitle(), request.getDescription(), request.getLocation(),
                request.getCategory(), request.getPriority());

        ticket.setTitle(request.getTitle());
        ticket.setCategory(classification.category());
        ticket.setPriority(classification.priority());
        ticket.setDescription(request.getDescription());
        ticket.setLocation(request.getLocation());
        ticket.setContactEmail(request.getContactEmail());
        ticket.setContactPhone(request.getContactPhone());
        ticket.setUpdatedAt(LocalDateTime.now());
        applySlaPolicy(ticket, ticket.getCreatedAt() != null ? ticket.getCreatedAt() : LocalDateTime.now());
        applySlaState(ticket);

        return ticketRepository.save(ticket);
    }

    public void deleteTicket(String ticketId) {
        if (!ticketRepository.existsById(ticketId)) {
            throw new ResourceNotFoundException("Ticket not found with id: " + ticketId);
        }
        ticketRepository.deleteById(ticketId);
    }

    public void deleteTicketByUser(String ticketId, User user) {
        Ticket ticket = getTicketById(ticketId);

        // Only reporter (if OPEN) or Admin can delete
        boolean isAdmin = user.getRoles().stream().anyMatch(r -> r.name().contains("ADMIN"));
        boolean isOwner = ticket.getReportedBy().equals(user.getId());

        if (isAdmin) {
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
                    ticket.setStatus(Ticket.TicketStatus.IN_PROGRESS);
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
