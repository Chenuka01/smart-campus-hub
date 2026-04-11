package com.smartcampus.repository;

import com.smartcampus.model.TicketAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketAuditLogRepository extends JpaRepository<TicketAuditLog, String> {
    List<TicketAuditLog> findByTicketIdOrderByTimestampDesc(String ticketId);
}
