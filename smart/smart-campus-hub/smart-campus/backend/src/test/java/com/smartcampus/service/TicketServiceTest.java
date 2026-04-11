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
    @Mock private TicketClassificationService ticketClassificationService;
    @Mock private TechnicianAutoAssignmentService technicianAutoAssignmentService;

    @InjectMocks private TicketService ticketService;

    private User testUser;
    private TicketRequest testRequest;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId("user-1");
        testUser.setName("Jane Student");
        testUser.setEmail("user@smartcampus.com");
        testUser.setRoles(Set.of(User.Role.ADMIN));

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
        when(ticketClassificationService.classify(any(), any(), any(), any(), any()))
                .thenReturn(new TicketClassificationService.TicketClassification("EQUIPMENT", Ticket.Priority.HIGH));
        when(technicianAutoAssignmentService.findBestTechnicianForCategory("EQUIPMENT"))
                .thenReturn(Optional.empty());
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(invocation -> {
            Ticket ticket = invocation.getArgument(0);
            ticket.setId("ticket-1");
            return ticket;
        });

        Ticket result = ticketService.createTicket(testRequest, testUser, Collections.emptyList());

        assertThat(result.getStatus()).isEqualTo(Ticket.TicketStatus.OPEN);
        assertThat(result.getReportedBy()).isEqualTo("user-1");
        assertThat(result.getCategory()).isEqualTo("EQUIPMENT");
        assertThat(result.getPriority()).isEqualTo(Ticket.Priority.HIGH);
        verify(ticketRepository).save(any(Ticket.class));
    }

    @Test
    @DisplayName("createTicket: auto-assignment moves ticket to IN_PROGRESS and notifies both parties")
    void createTicket_autoAssignedTechnician_setsInProgressAndNotifies() {
        User technician = new User();
        technician.setId("tech-1");
        technician.setName("John Technician");
        when(ticketClassificationService.classify(any(), any(), any(), any(), any()))
                .thenReturn(new TicketClassificationService.TicketClassification("IT Equipment", Ticket.Priority.HIGH));
        when(technicianAutoAssignmentService.findBestTechnicianForCategory("IT Equipment"))
                .thenReturn(Optional.of(technician));
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(invocation -> {
            Ticket ticket = invocation.getArgument(0);
            ticket.setId("ticket-1");
            return ticket;
        });

        Ticket result = ticketService.createTicket(testRequest, testUser, Collections.emptyList());

        assertThat(result.getStatus()).isEqualTo(Ticket.TicketStatus.IN_PROGRESS);
        assertThat(result.getAssignedTo()).isEqualTo("tech-1");
        assertThat(result.getAssignedToName()).isEqualTo("John Technician");
        verify(notificationService, times(2)).createNotification(any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("createTicket: AUTO category and priority are classified without enum errors")
    void createTicket_autoDetectValues_classifiesSafely() {
        testRequest.setCategory("AUTO");
        testRequest.setPriority("AUTO");

        when(ticketClassificationService.classify(any(), any(), any(), any(), any()))
                .thenReturn(new TicketClassificationService.TicketClassification("IT Equipment", Ticket.Priority.HIGH));
        when(technicianAutoAssignmentService.findBestTechnicianForCategory("IT Equipment"))
                .thenReturn(Optional.empty());
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(invocation -> {
            Ticket ticket = invocation.getArgument(0);
            ticket.setId("ticket-2");
            return ticket;
        });

        Ticket result = ticketService.createTicket(testRequest, testUser, Collections.emptyList());

        assertThat(result.getId()).isEqualTo("ticket-2");
        assertThat(result.getCategory()).isEqualTo("IT Equipment");
        assertThat(result.getPriority()).isEqualTo(Ticket.Priority.HIGH);
        assertThat(result.getStatus()).isEqualTo(Ticket.TicketStatus.OPEN);
        verify(ticketClassificationService).classify(
                testRequest.getTitle(),
                testRequest.getDescription(),
                testRequest.getLocation(),
                "AUTO",
                "AUTO"
        );
    }

    // ─── assignTicket ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("assignTicket: sets assigned technician and notifies both parties")
    void assignTicket_openTicket_setsInProgressAndNotifies() {
        Ticket ticket = new Ticket();
        ticket.setId("ticket-1");
        ticket.setTitle("Projector not working");
        ticket.setStatus(Ticket.TicketStatus.OPEN);
        ticket.setReportedBy("user-1");

        when(ticketRepository.findById("ticket-1")).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(inv -> inv.getArgument(0));

        Ticket result = ticketService.assignTicket("ticket-1", "tech-1", "John Technician", testUser);

        assertThat(result.getStatus()).isEqualTo(Ticket.TicketStatus.OPEN);
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

        Ticket result = ticketService.updateTicketStatus("ticket-1", "RESOLVED", "Replaced lamp unit", null, testUser);

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

        Ticket result = ticketService.updateTicketStatus("ticket-1", "REJECTED", null, "Duplicate ticket", testUser);

        assertThat(result.getStatus()).isEqualTo(Ticket.TicketStatus.REJECTED);
        assertThat(result.getRejectionReason()).isEqualTo("Duplicate ticket");
    }

    @Test
    @DisplayName("updateTicketStatus: throws ResourceNotFoundException for unknown ticket")
    void updateTicketStatus_unknownTicket_throwsResourceNotFoundException() {
        when(ticketRepository.findById("unknown")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> ticketService.updateTicketStatus("unknown", "RESOLVED", null, null, testUser))
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
