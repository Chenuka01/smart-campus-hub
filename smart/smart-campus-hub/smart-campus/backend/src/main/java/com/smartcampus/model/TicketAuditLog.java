package com.smartcampus.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ticket_audit_logs")
public class TicketAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String ticketId;

    @Column(nullable = false)
    private String changedByUserId;

    @Column(nullable = false)
    private String changedByUserName;

    @Enumerated(EnumType.STRING)
    private Ticket.TicketStatus oldStatus;

    @Enumerated(EnumType.STRING)
    private Ticket.TicketStatus newStatus;

    private LocalDateTime timestamp;

    @Column(columnDefinition = "TEXT")
    private String note;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTicketId() {
        return ticketId;
    }

    public void setTicketId(String ticketId) {
        this.ticketId = ticketId;
    }

    public String getChangedByUserId() {
        return changedByUserId;
    }

    public void setChangedByUserId(String changedByUserId) {
        this.changedByUserId = changedByUserId;
    }

    public String getChangedByUserName() {
        return changedByUserName;
    }

    public void setChangedByUserName(String changedByUserName) {
        this.changedByUserName = changedByUserName;
    }

    public Ticket.TicketStatus getOldStatus() {
        return oldStatus;
    }

    public void setOldStatus(Ticket.TicketStatus oldStatus) {
        this.oldStatus = oldStatus;
    }

    public Ticket.TicketStatus getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(Ticket.TicketStatus newStatus) {
        this.newStatus = newStatus;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
