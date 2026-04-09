package com.smartcampus.service;

import com.smartcampus.exception.BadRequestException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.Comment;
import com.smartcampus.model.Ticket;
import com.smartcampus.model.User;
import com.smartcampus.repository.CommentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CommentService Unit Tests")
class CommentServiceTest {

    @Mock private CommentRepository commentRepository;
    @Mock private TicketService ticketService;
    @Mock private NotificationService notificationService;

    @InjectMocks private CommentService commentService;

    private User author;
    private User otherUser;
    private Ticket ticket;

    @BeforeEach
    void setUp() {
        author = new User();
        author.setId("user-1");
        author.setName("Jane Student");
        author.setRoles(Set.of(User.Role.USER));

        otherUser = new User();
        otherUser.setId("user-2");
        otherUser.setName("Admin User");
        otherUser.setRoles(Set.of(User.Role.ADMIN));

        ticket = new Ticket();
        ticket.setId("ticket-1");
        ticket.setTitle("Broken projector");
        ticket.setReportedBy("user-1");
        ticket.setStatus(Ticket.TicketStatus.OPEN);
    }

    // ─── addComment ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("addComment: persists comment with correct author details")
    void addComment_validInput_persistsCorrectAuthor() {
        when(ticketService.getTicketById("ticket-1")).thenReturn(ticket);

        Comment saved = new Comment();
        saved.setId("comment-1");
        saved.setAuthorId("user-1");
        saved.setContent("I can reproduce this issue");
        when(commentRepository.save(any(Comment.class))).thenReturn(saved);

        Comment result = commentService.addComment("ticket-1", "I can reproduce this issue", author);

        assertThat(result.getAuthorId()).isEqualTo("user-1");
        verify(commentRepository).save(any(Comment.class));
    }

    @Test
    @DisplayName("addComment: sends notification when commenter is NOT the ticket reporter")
    void addComment_differentUser_sendsNotification() {
        ticket.setReportedBy("user-1"); // reporter
        when(ticketService.getTicketById("ticket-1")).thenReturn(ticket);
        when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> inv.getArgument(0));

        // otherUser (admin) comments — should notify user-1
        commentService.addComment("ticket-1", "Looking into this", otherUser);

        verify(notificationService).createNotification(eq("user-1"), eq("New Comment"), any(), any(), any(), any());
    }

    @Test
    @DisplayName("addComment: does NOT send notification when reporter comments on own ticket")
    void addComment_sameUser_doesNotSendNotification() {
        ticket.setReportedBy("user-1");
        ticket.setAssignedTo(null);
        when(ticketService.getTicketById("ticket-1")).thenReturn(ticket);
        when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> inv.getArgument(0));

        commentService.addComment("ticket-1", "Adding more details", author);

        verify(notificationService, never()).createNotification(any(), any(), any(), any(), any(), any());
    }

    // ─── updateComment ────────────────────────────────────────────────────────

    @Test
    @DisplayName("updateComment: owner can edit their own comment")
    void updateComment_byOwner_updatesContentAndSetsEdited() {
        Comment existing = new Comment();
        existing.setId("comment-1");
        existing.setAuthorId("user-1");
        existing.setContent("Old content");
        existing.setEdited(false);

        when(commentRepository.findById("comment-1")).thenReturn(Optional.of(existing));
        when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> inv.getArgument(0));

        Comment result = commentService.updateComment("comment-1", "Updated content", author);

        assertThat(result.getContent()).isEqualTo("Updated content");
        assertThat(result.isEdited()).isTrue();
    }

    @Test
    @DisplayName("updateComment: non-owner cannot edit the comment")
    void updateComment_byNonOwner_throwsBadRequestException() {
        Comment existing = new Comment();
        existing.setId("comment-1");
        existing.setAuthorId("user-1");

        when(commentRepository.findById("comment-1")).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> commentService.updateComment("comment-1", "Hijacked", otherUser))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("own comments");
    }

    // ─── deleteComment ────────────────────────────────────────────────────────

    @Test
    @DisplayName("deleteComment: throws ResourceNotFoundException for unknown comment")
    void deleteComment_unknownId_throwsResourceNotFoundException() {
        when(commentRepository.findById("unknown")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> commentService.deleteComment("unknown", author))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
