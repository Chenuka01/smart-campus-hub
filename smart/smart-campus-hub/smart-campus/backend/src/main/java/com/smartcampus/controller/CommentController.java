package com.smartcampus.controller;

import com.smartcampus.dto.ApiResponse;
import com.smartcampus.model.Comment;
import com.smartcampus.model.User;
import com.smartcampus.service.CommentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @PostMapping("/ticket/{ticketId}")
    public ResponseEntity<Comment> addComment(
            @PathVariable String ticketId,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commentService.addComment(ticketId, request.get("content"), user));
    }

    @GetMapping("/ticket/{ticketId}")
    public ResponseEntity<List<Comment>> getTicketComments(@PathVariable String ticketId) {
        return ResponseEntity.ok(commentService.getTicketComments(ticketId));
    }

    @PutMapping("/{commentId}")
    public ResponseEntity<Comment> updateComment(
            @PathVariable String commentId,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(commentService.updateComment(commentId, request.get("content"), user));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<ApiResponse> deleteComment(
            @PathVariable String commentId,
            @AuthenticationPrincipal User user) {
        commentService.deleteComment(commentId, user);
        return ResponseEntity.ok(ApiResponse.success("Comment deleted successfully"));
    }
}
