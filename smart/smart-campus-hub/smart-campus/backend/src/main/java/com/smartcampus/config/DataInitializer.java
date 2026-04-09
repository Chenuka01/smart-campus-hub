package com.smartcampus.config;

import com.smartcampus.model.Facility;
import com.smartcampus.model.Ticket;
import com.smartcampus.model.User;
import com.smartcampus.repository.FacilityRepository;
import com.smartcampus.repository.TicketRepository;
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
    private final TicketRepository ticketRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, FacilityRepository facilityRepository,
                           TicketRepository ticketRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.facilityRepository = facilityRepository;
        this.ticketRepository = ticketRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Ensure Super Admin exists regardless of count (to fix credential issues)
        if (userRepository.findByEmail("superadmin@smartcampus.com").isEmpty()) {
            User superAdmin = new User();
            superAdmin.setName("Super Admin");
            superAdmin.setEmail("superadmin@smartcampus.com");
            superAdmin.setPassword(passwordEncoder.encode("password123"));
            superAdmin.setProvider("LOCAL");
            superAdmin.setRoles(Set.of(User.Role.SUPER_ADMIN, User.Role.ADMIN));
            superAdmin.setEnabled(true);
            superAdmin.setCreatedAt(LocalDateTime.now());
            superAdmin.setUpdatedAt(LocalDateTime.now());
            userRepository.save(superAdmin);
            System.out.println("Super Admin user created: superadmin@smartcampus.com / password123");
        }

        // Ensure Manager exists
        if (userRepository.findByEmail("manager@smartcampus.com").isEmpty()) {
            User manager = new User();
            manager.setName("Manager User");
            manager.setEmail("manager@smartcampus.com");
            manager.setPassword(passwordEncoder.encode("manager123"));
            manager.setProvider("LOCAL");
            manager.setRoles(Set.of(User.Role.MANAGER));
            manager.setEnabled(true);
            manager.setCreatedAt(LocalDateTime.now());
            manager.setUpdatedAt(LocalDateTime.now());
            userRepository.save(manager);
            System.out.println("Manager user created: manager@smartcampus.com / manager123");
        }

        // Ensure Technician exists
        if (userRepository.findByEmail("tech@smartcampus.com").isEmpty()) {
            User tech = new User();
            tech.setName("Technician User");
            tech.setEmail("tech@smartcampus.com");
            tech.setPassword(passwordEncoder.encode("tech123"));
            tech.setProvider("LOCAL");
            tech.setRoles(Set.of(User.Role.TECHNICIAN));
            tech.setTechnicianSpecialties(Set.of("Electrical", "HVAC", "IT Equipment", "Safety"));
            tech.setEnabled(true);
            tech.setCreatedAt(LocalDateTime.now());
            tech.setUpdatedAt(LocalDateTime.now());
            userRepository.save(tech);
            System.out.println("Technician user created: tech@smartcampus.com / tech123");
        } else {
            userRepository.findByEmail("tech@smartcampus.com").ifPresent(tech -> {
                if (tech.getTechnicianSpecialties() == null || tech.getTechnicianSpecialties().isEmpty()) {
                    tech.setTechnicianSpecialties(Set.of("Electrical", "HVAC", "IT Equipment", "Safety"));
                    tech.setUpdatedAt(LocalDateTime.now());
                    userRepository.save(tech);
                }
            });
        }

        if (userRepository.count() <= 1) {
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

            // Create Jane Student user
            User student = new User();
            student.setName("Jane Student");
            student.setEmail("jane@smartcampus.com");
            student.setPassword(passwordEncoder.encode("password123"));
            student.setProvider("LOCAL");
            student.setRoles(Set.of(User.Role.USER));
            student.setEnabled(true);
            student.setCreatedAt(LocalDateTime.now());
            student.setUpdatedAt(LocalDateTime.now());
            userRepository.save(student);
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

        if (ticketRepository.count() == 0) {
            User tech = userRepository.findByEmail("tech@smartcampus.com").orElse(null);
            User student = userRepository.findByEmail("jane@smartcampus.com").orElse(null);
            Facility lab = facilityRepository.findAll().stream()
                .filter(f -> f.getType() == Facility.FacilityType.LAB)
                .findFirst().orElse(null);

            if (tech != null && student != null && lab != null) {
                Ticket t1 = new Ticket();
                t1.setTitle("Projector not working");
                t1.setDescription("The Sony projector in Main Lecture Hall A is flickering and won't display HDMI input.");
                t1.setCategory("Equipment");
                t1.setPriority(Ticket.Priority.HIGH);
                t1.setStatus(Ticket.TicketStatus.OPEN);
                t1.setReportedBy(student.getId());
                t1.setReportedByName(student.getName());
                t1.setFacilityId(lab.getId());
                t1.setFacilityName(lab.getName());
                t1.setLocation(lab.getLocation());
                t1.setCreatedAt(LocalDateTime.now());
                t1.setUpdatedAt(LocalDateTime.now());
                ticketRepository.save(t1);

                Ticket t2 = new Ticket();
                t2.setTitle("AC Maintenance - Room 101");
                t2.setDescription("AC is making a loud noise and not cooling properly.");
                t2.setCategory("Maintenance");
                t2.setPriority(Ticket.Priority.MEDIUM);
                t2.setStatus(Ticket.TicketStatus.IN_PROGRESS);
                t2.setReportedBy(student.getId());
                t2.setReportedByName(student.getName());
                t2.setAssignedTo(tech.getId());
                t2.setAssignedToName(tech.getName());
                t2.setFacilityId(lab.getId());
                t2.setFacilityName(lab.getName());
                t2.setLocation(lab.getLocation());
                t2.setCreatedAt(LocalDateTime.now().minusDays(1));
                t2.setUpdatedAt(LocalDateTime.now());
                ticketRepository.save(t2);

                Ticket t3 = new Ticket();
                t3.setTitle("Broken Chair in Seminar Room");
                t3.setDescription("One of the chairs in the back row is broken.");
                t3.setCategory("Furniture");
                t3.setPriority(Ticket.Priority.LOW);
                t3.setStatus(Ticket.TicketStatus.OPEN);
                t3.setReportedBy(student.getId());
                t3.setReportedByName(student.getName());
                t3.setFacilityId(lab.getId());
                t3.setFacilityName(lab.getName());
                t3.setCreatedAt(LocalDateTime.now().minusHours(5));
                t3.setUpdatedAt(LocalDateTime.now());
                ticketRepository.save(t3);

                System.out.println("Sample tickets seeded.");
            }
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
