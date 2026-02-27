package com.smartcampus.service;

import com.smartcampus.dto.BookingRequest;
import com.smartcampus.exception.BadRequestException;
import com.smartcampus.exception.ConflictException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.Booking;
import com.smartcampus.model.Facility;
import com.smartcampus.model.User;
import com.smartcampus.repository.BookingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BookingService Unit Tests")
class BookingServiceTest {

    @Mock private BookingRepository bookingRepository;
    @Mock private FacilityService facilityService;
    @Mock private NotificationService notificationService;

    @InjectMocks private BookingService bookingService;

    private User testUser;
    private Facility testFacility;
    private BookingRequest testRequest;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId("user-1");
        testUser.setName("Jane Student");
        testUser.setEmail("user@smartcampus.com");
        testUser.setRoles(Set.of(User.Role.USER));

        testFacility = new Facility();
        testFacility.setId("facility-1");
        testFacility.setName("Main Lecture Hall A");
        testFacility.setStatus(Facility.Status.ACTIVE);

        testRequest = new BookingRequest();
        testRequest.setFacilityId("facility-1");
        testRequest.setDate(LocalDate.of(2026, 3, 10));
        testRequest.setStartTime(LocalTime.of(9, 0));
        testRequest.setEndTime(LocalTime.of(11, 0));
        testRequest.setPurpose("Lecture session");
        testRequest.setExpectedAttendees(50);
    }

    // ─── createBooking ────────────────────────────────────────────────────────

    @Test
    @DisplayName("createBooking: succeeds when no conflicts exist")
    void createBooking_noConflicts_returnsPersistedBooking() {
        when(facilityService.getFacilityById("facility-1")).thenReturn(testFacility);
        when(bookingRepository.findConflictingBookings(any(), any(), any(), any()))
                .thenReturn(Collections.emptyList());

        Booking saved = new Booking();
        saved.setId("booking-1");
        saved.setStatus(Booking.BookingStatus.PENDING);
        when(bookingRepository.save(any(Booking.class))).thenReturn(saved);

        Booking result = bookingService.createBooking(testRequest, testUser);

        assertThat(result.getId()).isEqualTo("booking-1");
        assertThat(result.getStatus()).isEqualTo(Booking.BookingStatus.PENDING);
        verify(bookingRepository).save(any(Booking.class));
    }

    @Test
    @DisplayName("createBooking: throws ConflictException when time slot is taken")
    void createBooking_conflictingBooking_throwsConflictException() {
        when(facilityService.getFacilityById("facility-1")).thenReturn(testFacility);

        Booking existing = new Booking();
        existing.setId("existing-1");
        existing.setStatus(Booking.BookingStatus.APPROVED);
        when(bookingRepository.findConflictingBookings(any(), any(), any(), any()))
                .thenReturn(List.of(existing));

        assertThatThrownBy(() -> bookingService.createBooking(testRequest, testUser))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("conflicts");

        verify(bookingRepository, never()).save(any());
    }

    @Test
    @DisplayName("createBooking: throws BadRequestException when facility is not ACTIVE")
    void createBooking_facilityNotActive_throwsBadRequestException() {
        testFacility.setStatus(Facility.Status.OUT_OF_SERVICE);
        when(facilityService.getFacilityById("facility-1")).thenReturn(testFacility);

        assertThatThrownBy(() -> bookingService.createBooking(testRequest, testUser))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("not available");

        verify(bookingRepository, never()).save(any());
    }

    @Test
    @DisplayName("createBooking: throws BadRequestException when start time equals end time")
    void createBooking_startEqualsEnd_throwsBadRequestException() {
        testRequest.setStartTime(LocalTime.of(10, 0));
        testRequest.setEndTime(LocalTime.of(10, 0));
        when(facilityService.getFacilityById("facility-1")).thenReturn(testFacility);

        assertThatThrownBy(() -> bookingService.createBooking(testRequest, testUser))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("before end time");
    }

    @Test
    @DisplayName("createBooking: throws BadRequestException when start time is after end time")
    void createBooking_startAfterEnd_throwsBadRequestException() {
        testRequest.setStartTime(LocalTime.of(12, 0));
        testRequest.setEndTime(LocalTime.of(9, 0));
        when(facilityService.getFacilityById("facility-1")).thenReturn(testFacility);

        assertThatThrownBy(() -> bookingService.createBooking(testRequest, testUser))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("before end time");
    }

    // ─── approveBooking ───────────────────────────────────────────────────────

    @Test
    @DisplayName("approveBooking: transitions PENDING booking to APPROVED")
    void approveBooking_pendingBooking_setsStatusApproved() {
        Booking pending = new Booking();
        pending.setId("booking-1");
        pending.setStatus(Booking.BookingStatus.PENDING);
        pending.setUserId("user-1");
        pending.setFacilityName("Main Lecture Hall A");
        pending.setDate(LocalDate.of(2026, 3, 10));

        when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(pending));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        Booking result = bookingService.approveBooking("booking-1", "admin-1");

        assertThat(result.getStatus()).isEqualTo(Booking.BookingStatus.APPROVED);
        assertThat(result.getReviewedBy()).isEqualTo("admin-1");
        verify(notificationService).createNotification(eq("user-1"), eq("Booking Approved"), any(), any(), any(), any());
    }

    @Test
    @DisplayName("approveBooking: throws BadRequestException when booking is not PENDING")
    void approveBooking_nonPendingBooking_throwsBadRequestException() {
        Booking approved = new Booking();
        approved.setId("booking-1");
        approved.setStatus(Booking.BookingStatus.APPROVED);
        when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(approved));

        assertThatThrownBy(() -> bookingService.approveBooking("booking-1", "admin-1"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("pending bookings");
    }

    // ─── rejectBooking ────────────────────────────────────────────────────────

    @Test
    @DisplayName("rejectBooking: transitions PENDING booking to REJECTED with reason")
    void rejectBooking_pendingBooking_setsStatusRejected() {
        Booking pending = new Booking();
        pending.setId("booking-1");
        pending.setStatus(Booking.BookingStatus.PENDING);
        pending.setUserId("user-1");
        pending.setFacilityName("Main Lecture Hall A");

        when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(pending));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        Booking result = bookingService.rejectBooking("booking-1", "admin-1", "Already booked");

        assertThat(result.getStatus()).isEqualTo(Booking.BookingStatus.REJECTED);
        assertThat(result.getRejectionReason()).isEqualTo("Already booked");
        verify(notificationService).createNotification(eq("user-1"), eq("Booking Rejected"), any(), any(), any(), any());
    }

    // ─── cancelBooking ────────────────────────────────────────────────────────

    @Test
    @DisplayName("cancelBooking: transitions APPROVED booking to CANCELLED")
    void cancelBooking_approvedBooking_setsStatusCancelled() {
        Booking approved = new Booking();
        approved.setId("booking-1");
        approved.setStatus(Booking.BookingStatus.APPROVED);

        when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(approved));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        Booking result = bookingService.cancelBooking("booking-1", "user-1", "Change of plans");

        assertThat(result.getStatus()).isEqualTo(Booking.BookingStatus.CANCELLED);
        assertThat(result.getCancellationReason()).isEqualTo("Change of plans");
    }

    @Test
    @DisplayName("cancelBooking: throws BadRequestException when already CANCELLED")
    void cancelBooking_alreadyCancelled_throwsBadRequestException() {
        Booking cancelled = new Booking();
        cancelled.setId("booking-1");
        cancelled.setStatus(Booking.BookingStatus.CANCELLED);

        when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(cancelled));

        assertThatThrownBy(() -> bookingService.cancelBooking("booking-1", "user-1", null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already cancelled");
    }

    @Test
    @DisplayName("cancelBooking: throws BadRequestException when booking is REJECTED")
    void cancelBooking_rejectedBooking_throwsBadRequestException() {
        Booking rejected = new Booking();
        rejected.setId("booking-1");
        rejected.setStatus(Booking.BookingStatus.REJECTED);

        when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(rejected));

        assertThatThrownBy(() -> bookingService.cancelBooking("booking-1", "user-1", null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("rejected");
    }

    // ─── getBookingById ───────────────────────────────────────────────────────

    @Test
    @DisplayName("getBookingById: throws ResourceNotFoundException for unknown id")
    void getBookingById_unknownId_throwsResourceNotFoundException() {
        when(bookingRepository.findById("unknown")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookingService.getBookingById("unknown"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Booking not found");
    }
}
