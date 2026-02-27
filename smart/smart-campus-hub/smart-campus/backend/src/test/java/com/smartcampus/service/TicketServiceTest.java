package com.smartcampus.service;

import com.smartcampus.dto.TicketRequest;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.Ticket;
import com.smartcampus.model.User;
import com.smartcampus.repository.TicketRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TicketService Unit Tests")
class TicketServiceTest {

    @Mock private TicketRepository ticketRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks private TicketService ticketService;

    private User testUser;
    private TicketRequest testRequest;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId("user-1");
        testUser.setName("Jane Student");
        testUser.setEmail("user@smartcampus.com");
        testUser.setRoles(Set.of(User.Role.USER));

        testRequest = new TicketRequest();
        testRequest.setTitle("Projector not working");
        testRequest.setLocation("Block A, Room 101");
        testRequest.setCategory("EQUIPMENT");
        testRequest.setDescription("The ceiling projector has no display output");
        testRequest.setPriority("HIGH");
        testRequest.setContactEmail("user@smartcampus.com");
    }

    // ─── createTicket ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("createTicket: new ticket has OPEN status and correct reporter")
    void createTicket_validRequest_createsOpenTicket() {
        Ticket saved = new Ticket();
        saved.setId("ticket-1");
        saved.setStatus(Ticket.TicketStatus.OPEN);
        saved.setReportedBy("user-1");
        when(ticketRepository.save(any(Ticket.class))).thenReturn(saved);

        Ticket result = ticketService.createTicket(testRequest, testUser, Collections.emptyList());

        assertThat(result.getStatus()).isEqualTo(Ticket.TicketStatus.OPEN);
        assertThat(result.getReportedBy()).isEqualTo("user-1");
        verify(ticketRepository).save(any(Ticket.class));
    }

    @Test
    @DisplayName("createTicket: throws IllegalArgumentException for unknown priority")
    void createTicket_invalidPriority_throwsIllegalArgumentException() {
        testRequest.setPriority("URGENT"); // not a valid enum value

        assertThatThrownBy(() -> ticketService.createTicket(testRequest, testUser, Collections.emptyList()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ─── assignTicket ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("assignTicket: sets IN_PROGRESS and notifies both parties")
    void assignTicket_openTicket_setsInProgressAndNotifies() {
        Ticket ticket = new Ticket();
        ticket.setId("ticket-1");
        ticket.setTitle("Projector not working");
        ticket.setStatus(Ticket.TicketStatus.OPEN);
        ticket.setReportedBy("user-1");

        when(ticketRepository.findById("ticket-1")).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(inv -> inv.getArgument(0));

        Ticket result = ticketService.assignTicket("ticket-1", "tech-1", "John Technician");

        assertThat(result.getStatus()).isEqualTo(Ticket.TicketStatus.IN_PROGRESS);
        assertThat(result.getAssignedTo()).isEqualTo("tech-1");
        assertThat(result.getAssignedToName()).isEqualTo("John Technician");
        // notifies the reporter AND the technician
        verify(notificationService, times(2)).createNotification(any(), any(), any(), any(), any(), any());
    }

    // ─── updateTicketStatus ───────────────────────────────────────────────────

    @Test
    @DisplayName("updateTicketStatus: RESOLVED sets resolutionNotes and resolvedAt")
    void updateTicketStatus_resolved_setsResolutionDetails() {
        Ticket ticket = new Ticket();
        ticket.setId("ticket-1");
        ticket.setTitle("Projector not working");
        ticket.setStatus(Ticket.TicketStatus.IN_PROGRESS);
        ticket.setReportedBy("user-1");

        when(ticketRepository.findById("ticket-1")).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(inv -> inv.getArgument(0));

        Ticket result = ticketService.updateTicketStatus("ticket-1", "RESOLVED", "Replaced lamp unit", null);

        assertThat(result.getStatus()).isEqualTo(Ticket.TicketStatus.RESOLVED);
        assertThat(result.getResolutionNotes()).isEqualTo("Replaced lamp unit");
        assertThat(result.getResolvedAt()).isNotNull();
    }

    @Test
    @DisplayName("updateTicketStatus: REJECTED sets rejectionReason")
    void updateTicketStatus_rejected_setsRejectionReason() {
        Ticket ticket = new Ticket();
        ticket.setId("ticket-1");
        ticket.setTitle("Projector not working");
        ticket.setStatus(Ticket.TicketStatus.OPEN);
        ticket.setReportedBy("user-1");

        when(ticketRepository.findById("ticket-1")).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(inv -> inv.getArgument(0));

        Ticket result = ticketService.updateTicketStatus("ticket-1", "REJECTED", null, "Duplicate ticket");

        assertThat(result.getStatus()).isEqualTo(Ticket.TicketStatus.REJECTED);
        assertThat(result.getRejectionReason()).isEqualTo("Duplicate ticket");
    }

    @Test
    @DisplayName("updateTicketStatus: throws ResourceNotFoundException for unknown ticket")
    void updateTicketStatus_unknownTicket_throwsResourceNotFoundException() {
        when(ticketRepository.findById("unknown")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> ticketService.updateTicketStatus("unknown", "RESOLVED", null, null))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ─── deleteTicket ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("deleteTicket: throws ResourceNotFoundException for unknown ticket")
    void deleteTicket_unknownTicket_throwsResourceNotFoundException() {
        when(ticketRepository.existsById("unknown")).thenReturn(false);

        assertThatThrownBy(() -> ticketService.deleteTicket("unknown"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Ticket not found");
    }
}
