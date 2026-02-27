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

@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final NotificationService notificationService;

    public TicketService(TicketRepository ticketRepository, NotificationService notificationService) {
        this.ticketRepository = ticketRepository;
        this.notificationService = notificationService;
    }

    public Ticket createTicket(TicketRequest request, User user, List<String> attachmentUrls) {
        Ticket ticket = new Ticket();
        ticket.setTitle(request.getTitle());
        ticket.setFacilityId(request.getFacilityId());
        ticket.setLocation(request.getLocation());
        ticket.setCategory(request.getCategory());
        ticket.setDescription(request.getDescription());
        ticket.setPriority(Ticket.Priority.valueOf(request.getPriority()));
        ticket.setStatus(Ticket.TicketStatus.OPEN);
        ticket.setReportedBy(user.getId());
        ticket.setReportedByName(user.getName());
        ticket.setContactEmail(request.getContactEmail());
        ticket.setContactPhone(request.getContactPhone());
        ticket.setAttachmentUrls(attachmentUrls);
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setUpdatedAt(LocalDateTime.now());

        return ticketRepository.save(ticket);
    }

    public Ticket assignTicket(String ticketId, String technicianId, String technicianName) {
        Ticket ticket = getTicketById(ticketId);
        ticket.setAssignedTo(technicianId);
        ticket.setAssignedToName(technicianName);
        ticket.setStatus(Ticket.TicketStatus.IN_PROGRESS);
        ticket.setUpdatedAt(LocalDateTime.now());
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
        return ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + id));
    }

    public List<Ticket> getAllTickets() {
        return ticketRepository.findAll();
    }

    public List<Ticket> getUserTickets(String userId) {
        return ticketRepository.findByReportedBy(userId);
    }

    public List<Ticket> getAssignedTickets(String technicianId) {
        return ticketRepository.findByAssignedTo(technicianId);
    }

    public List<Ticket> getTicketsByStatus(Ticket.TicketStatus status) {
        return ticketRepository.findByStatus(status);
    }

    public void deleteTicket(String ticketId) {
        if (!ticketRepository.existsById(ticketId)) {
            throw new ResourceNotFoundException("Ticket not found with id: " + ticketId);
        }
        ticketRepository.deleteById(ticketId);
    }
}
