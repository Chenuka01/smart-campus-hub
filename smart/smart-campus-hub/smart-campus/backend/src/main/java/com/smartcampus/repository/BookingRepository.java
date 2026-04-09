package com.smartcampus.repository;

import com.smartcampus.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, String> {
    List<Booking> findByUserId(String userId);
    List<Booking> findByFacilityId(String facilityId);
    List<Booking> findByStatus(Booking.BookingStatus status);
    List<Booking> findByFacilityIdAndDate(String facilityId, LocalDate date);

    @Query("SELECT b FROM Booking b WHERE b.facilityId = :facilityId AND b.date = :date " +
           "AND b.status IN (com.smartcampus.model.Booking.BookingStatus.PENDING, com.smartcampus.model.Booking.BookingStatus.APPROVED) " +
           "AND b.startTime < :endTime AND b.endTime > :startTime")
    List<Booking> findConflictingBookings(@Param("facilityId") String facilityId,
                                          @Param("date") LocalDate date,
                                          @Param("startTime") LocalTime startTime,
                                          @Param("endTime") LocalTime endTime);
}
