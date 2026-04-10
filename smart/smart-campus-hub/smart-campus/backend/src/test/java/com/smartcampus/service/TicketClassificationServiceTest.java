package com.smartcampus.service;

import com.smartcampus.model.Ticket;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("TicketClassificationService Unit Tests")
class TicketClassificationServiceTest {

    private final TicketClassificationService ticketClassificationService = new TicketClassificationService();

    @Test
    @DisplayName("classify: AUTO values infer IT Equipment and HIGH for projector outage")
    void classify_autoValues_detectsCategoryAndPriority() {
        TicketClassificationService.TicketClassification result = ticketClassificationService.classify(
                "Projector not working",
                "Lecture hall projector has no display and classes are blocked",
                "Engineering Block A",
                "AUTO",
                "AUTO"
        );

        assertThat(result.category()).isEqualTo("IT Equipment");
        assertThat(result.priority()).isEqualTo(Ticket.Priority.HIGH);
    }

    @Test
    @DisplayName("classify: blank values infer Plumbing and CRITICAL for flood issue")
    void classify_blankValues_detectsCriticalPlumbingIssue() {
        TicketClassificationService.TicketClassification result = ticketClassificationService.classify(
                "Water flooding hallway",
                "There is an urgent leak and flood near the washroom",
                "Science Building Level 2",
                "",
                ""
        );

        assertThat(result.category()).isEqualTo("Plumbing");
        assertThat(result.priority()).isEqualTo(Ticket.Priority.CRITICAL);
    }

    @Test
    @DisplayName("classify: explicit values are preserved")
    void classify_explicitValues_preservesUserSelection() {
        TicketClassificationService.TicketClassification result = ticketClassificationService.classify(
                "Minor cleanup request",
                "Please clean a spill near the front desk",
                "Library",
                "Cleaning",
                "LOW"
        );

        assertThat(result.category()).isEqualTo("Cleaning");
        assertThat(result.priority()).isEqualTo(Ticket.Priority.LOW);
    }
}
