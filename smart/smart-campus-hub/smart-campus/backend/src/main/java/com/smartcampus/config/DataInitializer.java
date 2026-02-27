package com.smartcampus.config;

import com.smartcampus.model.Facility;
import com.smartcampus.model.User;
import com.smartcampus.repository.FacilityRepository;
import com.smartcampus.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final FacilityRepository facilityRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, FacilityRepository facilityRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.facilityRepository = facilityRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            // Create admin user
            User admin = new User();
            admin.setName("Admin User");
            admin.setEmail("admin@smartcampus.com");
            admin.setPassword(passwordEncoder.encode("password123"));
            admin.setProvider("LOCAL");
            admin.setRoles(Set.of(User.Role.ADMIN));
            admin.setEnabled(true);
            admin.setCreatedAt(LocalDateTime.now());
            admin.setUpdatedAt(LocalDateTime.now());
            userRepository.save(admin);

            // Create technician user
            User tech = new User();
            tech.setName("John Technician");
            tech.setEmail("tech@smartcampus.com");
            tech.setPassword(passwordEncoder.encode("password123"));
            tech.setProvider("LOCAL");
            tech.setRoles(Set.of(User.Role.TECHNICIAN));
            tech.setEnabled(true);
            tech.setCreatedAt(LocalDateTime.now());
            tech.setUpdatedAt(LocalDateTime.now());
            userRepository.save(tech);

            // Create regular user
            User user = new User();
            user.setName("Jane Student");
            user.setEmail("user@smartcampus.com");
            user.setPassword(passwordEncoder.encode("password123"));
            user.setProvider("LOCAL");
            user.setRoles(Set.of(User.Role.USER));
            user.setEnabled(true);
            user.setCreatedAt(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
        }

        if (facilityRepository.count() == 0) {
            List<Facility> facilities = List.of(
                createFacility("Main Lecture Hall A", Facility.FacilityType.LECTURE_HALL, 200,
                    "Block A, Ground Floor", "Block A", "Ground", "Large lecture hall with tiered seating and AV system",
                    List.of("Projector", "Microphone", "Air Conditioning", "Whiteboard")),
                createFacility("Computer Lab 101", Facility.FacilityType.LAB, 50,
                    "Block B, 1st Floor", "Block B", "1st", "Modern computer lab with high-spec workstations",
                    List.of("Computers", "Projector", "Air Conditioning", "Printer")),
                createFacility("Board Meeting Room", Facility.FacilityType.MEETING_ROOM, 20,
                    "Admin Block, 3rd Floor", "Admin Block", "3rd", "Executive meeting room with video conferencing",
                    List.of("Video Conferencing", "Whiteboard", "Projector", "Coffee Machine")),
                createFacility("Science Lab 201", Facility.FacilityType.LAB, 40,
                    "Block C, 2nd Floor", "Block C", "2nd", "Fully equipped science laboratory",
                    List.of("Lab Equipment", "Safety Gear", "Ventilation", "Emergency Shower")),
                createFacility("Seminar Room B2", Facility.FacilityType.MEETING_ROOM, 30,
                    "Block B, 2nd Floor", "Block B", "2nd", "Seminar room suitable for workshops",
                    List.of("Projector", "Whiteboard", "Air Conditioning")),
                createFacility("Sony Projector #1", Facility.FacilityType.PROJECTOR, 0,
                    "Equipment Store, Block A", "Block A", "Ground", "Portable Sony VPL-FHZ75 projector",
                    List.of("4K Resolution", "Wireless Connectivity")),
                createFacility("Canon Camera #1", Facility.FacilityType.CAMERA, 0,
                    "Media Room, Block D", "Block D", "1st", "Canon EOS R5 camera for event photography",
                    List.of("4K Video", "Extra Batteries", "Tripod")),
                createFacility("Auditorium", Facility.FacilityType.AUDITORIUM, 500,
                    "Main Building, Ground Floor", "Main Building", "Ground", "Main university auditorium for large events",
                    List.of("Stage", "Sound System", "Lighting", "Air Conditioning", "Backstage"))
            );
            facilityRepository.saveAll(facilities);
        }
    }

    private Facility createFacility(String name, Facility.FacilityType type, int capacity,
                                     String location, String building, String floor, String description,
                                     List<String> amenities) {
        Facility facility = new Facility();
        facility.setName(name);
        facility.setType(type);
        facility.setCapacity(capacity);
        facility.setLocation(location);
        facility.setBuilding(building);
        facility.setFloor(floor);
        facility.setDescription(description);
        facility.setAmenities(amenities);
        facility.setStatus(Facility.Status.ACTIVE);
        facility.setAvailabilityWindows(List.of(
            new Facility.AvailabilityWindow("MONDAY", "08:00", "18:00"),
            new Facility.AvailabilityWindow("TUESDAY", "08:00", "18:00"),
            new Facility.AvailabilityWindow("WEDNESDAY", "08:00", "18:00"),
            new Facility.AvailabilityWindow("THURSDAY", "08:00", "18:00"),
            new Facility.AvailabilityWindow("FRIDAY", "08:00", "18:00")
        ));
        facility.setCreatedAt(LocalDateTime.now());
        facility.setUpdatedAt(LocalDateTime.now());
        return facility;
    }
}
