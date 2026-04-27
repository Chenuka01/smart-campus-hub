package com.smartcampus;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.dto.BookingRequest;
import com.smartcampus.model.Booking;
import com.smartcampus.model.Facility;
import com.smartcampus.model.User;
import com.smartcampus.repository.BookingRepository;
import com.smartcampus.repository.FacilityRepository;
import com.smartcampus.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:booking-controller-test;DB_CLOSE_DELAY=-1;MODE=MySQL;NON_KEYWORDS=VALUE",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.sql.init.mode=never",
        "app.data-initializer.enabled=false"
})
@DisplayName("Booking Controller Integration Tests")
class BookingControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private FacilityRepository facilityRepository;

    @Autowired
    private UserRepository userRepository;

    private User testUser;
    private User adminUser;
    private Facility facility;

    @BeforeEach
    void setUp() {
        bookingRepository.deleteAll();
        facilityRepository.deleteAll();
        userRepository.deleteAll();

        testUser = userRepository.save(user("Booking Tester", "booking.tester@smartcampus.com", User.Role.USER));
        adminUser = userRepository.save(user("Admin Tester", "admin.tester@smartcampus.com", User.Role.ADMIN));

        facility = new Facility();
        facility.setName("Main Lecture Hall");
        facility.setType(Facility.FacilityType.LECTURE_HALL);
        facility.setCapacity(120);
        facility.setLocation("Block A");
        facility.setStatus(Facility.Status.ACTIVE);
        facility.setCreatedAt(LocalDateTime.now());
        facility.setUpdatedAt(LocalDateTime.now());
        facility = facilityRepository.save(facility);
    }

    @Test
    @DisplayName("POST /api/bookings creates a pending booking")
    void createBooking_validRequest_returnsCreatedPendingBooking() throws Exception {
        BookingRequest request = bookingRequest(LocalDate.now().plusDays(1), LocalTime.of(9, 0), LocalTime.of(10, 0));

        mockMvc.perform(post("/api/bookings")
                        .with(authFor(testUser, "ROLE_USER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.facilityId").value(facility.getId()))
                .andExpect(jsonPath("$.facilityName").value("Main Lecture Hall"))
                .andExpect(jsonPath("$.userId").value(testUser.getId()))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    @DisplayName("POST /api/bookings rejects conflicting bookings")
    void createBooking_conflictingSlot_returnsConflict() throws Exception {
        BookingRequest firstRequest = bookingRequest(LocalDate.now().plusDays(2), LocalTime.of(11, 0), LocalTime.of(12, 0));
        mockMvc.perform(post("/api/bookings")
                        .with(authFor(testUser, "ROLE_USER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(firstRequest)))
                .andExpect(status().isCreated());

        BookingRequest conflictingRequest = bookingRequest(LocalDate.now().plusDays(2), LocalTime.of(11, 30), LocalTime.of(12, 30));
        mockMvc.perform(post("/api/bookings")
                        .with(authFor(testUser, "ROLE_USER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(conflictingRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Time slot conflicts with existing booking(s)"));
    }

    @Test
    @DisplayName("POST /api/bookings rejects invalid payload with field errors")
    void createBooking_invalidPayload_returnsValidationErrors() throws Exception {
        BookingRequest request = new BookingRequest();
        request.setFacilityId("");
        request.setExpectedAttendees(0);

        mockMvc.perform(post("/api/bookings")
                        .with(authFor(testUser, "ROLE_USER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.facilityId").value("Facility ID is required"))
                .andExpect(jsonPath("$.date").value("Date is required"))
                .andExpect(jsonPath("$.startTime").value("Start time is required"))
                .andExpect(jsonPath("$.endTime").value("End time is required"))
                .andExpect(jsonPath("$.purpose").value("Purpose is required"))
                .andExpect(jsonPath("$.expectedAttendees").value("Expected attendees must be positive"));
    }

    @Test
    @DisplayName("PUT /api/bookings/{id}/approve allows admin approval")
    void approveBooking_adminUser_returnsApprovedBooking() throws Exception {
        Booking booking = bookingRepository.save(booking(LocalDate.now().plusDays(3), LocalTime.of(14, 0), LocalTime.of(15, 0)));

        mockMvc.perform(put("/api/bookings/{id}/approve", booking.getId())
                        .with(authFor(adminUser, "ROLE_ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(booking.getId()))
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.reviewedBy").value(adminUser.getId()));
    }

    private BookingRequest bookingRequest(LocalDate date, LocalTime startTime, LocalTime endTime) {
        BookingRequest request = new BookingRequest();
        request.setFacilityId(facility.getId());
        request.setDate(date);
        request.setStartTime(startTime);
        request.setEndTime(endTime);
        request.setPurpose("Project presentation");
        request.setExpectedAttendees(30);
        return request;
    }

    private Booking booking(LocalDate date, LocalTime startTime, LocalTime endTime) {
        Booking booking = new Booking();
        booking.setFacilityId(facility.getId());
        booking.setFacilityName(facility.getName());
        booking.setUserId(testUser.getId());
        booking.setUserName(testUser.getName());
        booking.setDate(date);
        booking.setStartTime(startTime);
        booking.setEndTime(endTime);
        booking.setPurpose("Project presentation");
        booking.setExpectedAttendees(30);
        booking.setStatus(Booking.BookingStatus.PENDING);
        booking.setCreatedAt(LocalDateTime.now());
        booking.setUpdatedAt(LocalDateTime.now());
        return booking;
    }

    private User user(String name, String email, User.Role role) {
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword("encoded");
        user.setProvider("LOCAL");
        user.setRoles(Set.of(role));
        user.setEnabled(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        return user;
    }

    private RequestPostProcessor authFor(User user, String authority) {
        return authentication(new UsernamePasswordAuthenticationToken(
                user,
                null,
                List.of(new SimpleGrantedAuthority(authority))
        ));
    }
}
