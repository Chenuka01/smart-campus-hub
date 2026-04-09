package com.smartcampus.repository;

import com.smartcampus.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, String> {
    List<Comment> findByTicketIdOrderByCreatedAtDesc(String ticketId);
    List<Comment> findByAuthorId(String authorId);
}
