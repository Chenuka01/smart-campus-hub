package com.smartcampus.repository;

import com.smartcampus.model.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, String> {
    List<Ticket> findByReportedBy(String userId);
    List<Ticket> findByAssignedTo(String technicianId);
    List<Ticket> findByStatus(Ticket.TicketStatus status);
    List<Ticket> findByPriority(Ticket.Priority priority);
    List<Ticket> findByFacilityId(String facilityId);
    List<Ticket> findByCategory(String category);

    @Modifying
    @Transactional
    @Query("UPDATE Ticket t SET t.status = :targetStatus WHERE t.status = :sourceStatus")
    int updateStatusByStatus(@Param("sourceStatus") Ticket.TicketStatus sourceStatus, @Param("targetStatus") Ticket.TicketStatus targetStatus);
}
