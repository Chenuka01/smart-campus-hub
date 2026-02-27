package com.smartcampus.service;

import com.smartcampus.dto.BookingRequest;
import com.smartcampus.exception.BadRequestException;
import com.smartcampus.exception.ConflictException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.Booking;
import com.smartcampus.model.Facility;
import com.smartcampus.model.Notification;
import com.smartcampus.model.User;
import com.smartcampus.repository.BookingRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final FacilityService facilityService;
    private final NotificationService notificationService;

    public BookingService(BookingRepository bookingRepository, FacilityService facilityService,
                          NotificationService notificationService) {
        this.bookingRepository = bookingRepository;
        this.facilityService = facilityService;
        this.notificationService = notificationService;
    }

    public Booking createBooking(BookingRequest request, User user) {
        Facility facility = facilityService.getFacilityById(request.getFacilityId());

        if (facility.getStatus() != Facility.Status.ACTIVE) {
            throw new BadRequestException("Facility is not available for booking");
        }

        if (request.getStartTime().isAfter(request.getEndTime()) || request.getStartTime().equals(request.getEndTime())) {
            throw new BadRequestException("Start time must be before end time");
        }

        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                request.getFacilityId(), request.getDate(),
                request.getStartTime(), request.getEndTime());

        if (!conflicts.isEmpty()) {
            throw new ConflictException("Time slot conflicts with existing booking(s)");
        }

        Booking booking = new Booking();
        booking.setFacilityId(request.getFacilityId());
        booking.setFacilityName(facility.getName());
        booking.setUserId(user.getId());
        booking.setUserName(user.getName());
        booking.setDate(request.getDate());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setPurpose(request.getPurpose());
        booking.setExpectedAttendees(request.getExpectedAttendees());
        booking.setStatus(Booking.BookingStatus.PENDING);
        booking.setCreatedAt(LocalDateTime.now());
        booking.setUpdatedAt(LocalDateTime.now());

        return bookingRepository.save(booking);
    }

    public Booking approveBooking(String bookingId, String adminId) {
        Booking booking = getBookingById(bookingId);
        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new BadRequestException("Only pending bookings can be approved");
        }
        booking.setStatus(Booking.BookingStatus.APPROVED);
        booking.setReviewedBy(adminId);
        booking.setUpdatedAt(LocalDateTime.now());
        Booking saved = bookingRepository.save(booking);

        notificationService.createNotification(
                booking.getUserId(),
                "Booking Approved",
                "Your booking for " + booking.getFacilityName() + " on " + booking.getDate() + " has been approved.",
                Notification.NotificationType.BOOKING_APPROVED,
                booking.getId(), "BOOKING");

        return saved;
    }

    public Booking rejectBooking(String bookingId, String adminId, String reason) {
        Booking booking = getBookingById(bookingId);
        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new BadRequestException("Only pending bookings can be rejected");
        }
        booking.setStatus(Booking.BookingStatus.REJECTED);
        booking.setReviewedBy(adminId);
        booking.setRejectionReason(reason);
        booking.setUpdatedAt(LocalDateTime.now());
        Booking saved = bookingRepository.save(booking);

        notificationService.createNotification(
                booking.getUserId(),
                "Booking Rejected",
                "Your booking for " + booking.getFacilityName() + " has been rejected. Reason: " + reason,
                Notification.NotificationType.BOOKING_REJECTED,
                booking.getId(), "BOOKING");

        return saved;
    }

    public Booking cancelBooking(String bookingId, String userId, String reason) {
        Booking booking = getBookingById(bookingId);
        if (booking.getStatus() == Booking.BookingStatus.CANCELLED) {
            throw new BadRequestException("Booking is already cancelled");
        }
        if (booking.getStatus() == Booking.BookingStatus.REJECTED) {
            throw new BadRequestException("Cannot cancel a rejected booking");
        }
        booking.setStatus(Booking.BookingStatus.CANCELLED);
        booking.setCancellationReason(reason);
        booking.setUpdatedAt(LocalDateTime.now());
        return bookingRepository.save(booking);
    }

    public Booking getBookingById(String id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
    }

    public List<Booking> getUserBookings(String userId) {
        return bookingRepository.findByUserId(userId);
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public List<Booking> getBookingsByStatus(Booking.BookingStatus status) {
        return bookingRepository.findByStatus(status);
    }

    public List<Booking> getBookingsByFacility(String facilityId) {
        return bookingRepository.findByFacilityId(facilityId);
    }
}
