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
}
