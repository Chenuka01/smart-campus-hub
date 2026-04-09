package com.smartcampus.service;

import com.smartcampus.exception.BadRequestException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.Comment;
import com.smartcampus.model.Notification;
import com.smartcampus.model.Ticket;
import com.smartcampus.model.User;
import com.smartcampus.repository.CommentRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final TicketService ticketService;
    private final NotificationService notificationService;

    public CommentService(CommentRepository commentRepository, TicketService ticketService,
                          NotificationService notificationService) {
        this.commentRepository = commentRepository;
        this.ticketService = ticketService;
        this.notificationService = notificationService;
    }

    public Comment addComment(String ticketId, String content, User user) {
        Ticket ticket = ticketService.getTicketById(ticketId);

        Comment comment = new Comment();
        comment.setTicketId(ticketId);
        comment.setContent(content);
        comment.setAuthorId(user.getId());
        comment.setAuthorName(user.getName());
        comment.setAuthorRole(user.getRoles().iterator().next().name());
        comment.setCreatedAt(LocalDateTime.now());
        comment.setUpdatedAt(LocalDateTime.now());
        comment.setEdited(false);

        Comment saved = commentRepository.save(comment);

        // Notify ticket reporter if comment is from someone else
        if (!ticket.getReportedBy().equals(user.getId())) {
            notificationService.createNotification(
                    ticket.getReportedBy(),
                    "New Comment",
                    user.getName() + " commented on your ticket: " + ticket.getTitle(),
                    Notification.NotificationType.COMMENT_ADDED,
                    ticket.getId(), "TICKET");
        }

        // Notify assigned technician if comment is from someone else
        if (ticket.getAssignedTo() != null && !ticket.getAssignedTo().equals(user.getId())) {
            notificationService.createNotification(
                    ticket.getAssignedTo(),
                    "New Comment",
                    user.getName() + " commented on ticket: " + ticket.getTitle(),
                    Notification.NotificationType.COMMENT_ADDED,
                    ticket.getId(), "TICKET");
        }

        return saved;
    }

    public Comment updateComment(String commentId, String content, User user) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        if (!comment.getAuthorId().equals(user.getId())) {
            throw new BadRequestException("You can only edit your own comments");
        }

        comment.setContent(content);
        comment.setUpdatedAt(LocalDateTime.now());
        comment.setEdited(true);

        return commentRepository.save(comment);
    }

    public void deleteComment(String commentId, User user) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        boolean isAdmin = user.getRoles().stream().anyMatch(r -> r == User.Role.ADMIN);

        if (!comment.getAuthorId().equals(user.getId()) && !isAdmin) {
            throw new BadRequestException("You can only delete your own comments");
        }

        commentRepository.deleteById(commentId);
    }

    public List<Comment> getTicketComments(String ticketId) {
        return commentRepository.findByTicketIdOrderByCreatedAtDesc(ticketId);
    }
}
