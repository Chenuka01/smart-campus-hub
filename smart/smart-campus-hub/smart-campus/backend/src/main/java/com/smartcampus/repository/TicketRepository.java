package com.smartcampus.repository;

import com.smartcampus.model.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, String> {
    List<Ticket> findByReportedBy(String userId);
    List<Ticket> findByAssignedTo(String technicianId);
    List<Ticket> findByStatus(Ticket.TicketStatus status);
    List<Ticket> findByPriority(Ticket.Priority priority);
    List<Ticket> findByFacilityId(String facilityId);
    List<Ticket> findByCategory(String category);
}
