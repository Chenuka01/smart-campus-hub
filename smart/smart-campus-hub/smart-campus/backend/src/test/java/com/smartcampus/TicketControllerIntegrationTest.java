package com.smartcampus;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.dto.TicketRequest;
import com.smartcampus.model.User;
import com.smartcampus.repository.TicketRepository;
import com.smartcampus.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:ticket-controller-test;DB_CLOSE_DELAY=-1;MODE=MySQL;NON_KEYWORDS=VALUE",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.sql.init.mode=never",
        "app.upload.dir=target/test-uploads"
})
@DisplayName("Ticket Controller Integration Tests")
class TicketControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TicketRepository ticketRepository;

    private User testUser;
    private User technicianUser;

    @BeforeEach
    void setUp() {
        ticketRepository.deleteAll();
        userRepository.deleteAll();

        testUser = new User();
        testUser.setName("Ticket Tester");
        testUser.setEmail("ticket.tester@smartcampus.com");
        testUser.setPassword("encoded");
        testUser.setProvider("LOCAL");
        testUser.setRoles(Set.of(User.Role.USER));
        testUser.setEnabled(true);
        testUser.setCreatedAt(LocalDateTime.now());
        testUser.setUpdatedAt(LocalDateTime.now());
        testUser = userRepository.save(testUser);

        technicianUser = new User();
        technicianUser.setName("Technician User");
        technicianUser.setEmail("tech@smartcampus.com");
        technicianUser.setPassword("encoded");
        technicianUser.setProvider("LOCAL");
        technicianUser.setRoles(Set.of(User.Role.TECHNICIAN));
        technicianUser.setTechnicianSpecialties(Set.of("Electrical", "HVAC", "IT Equipment", "Safety"));
        technicianUser.setEnabled(true);
        technicianUser.setCreatedAt(LocalDateTime.now());
        technicianUser.setUpdatedAt(LocalDateTime.now());
        technicianUser = userRepository.save(technicianUser);
    }

    @Test
    @DisplayName("POST /api/tickets/simple auto-detects category and priority")
    void createTicketSimple_autoDetectsCategoryAndPriority() throws Exception {
        TicketRequest request = new TicketRequest();
        request.setTitle("Projector not working");
        request.setLocation("Engineering Block A");
        request.setDescription("Lecture hall projector has no display and classes are blocked.");
        request.setCategory("AUTO");
        request.setPriority("AUTO");

        mockMvc.perform(post("/api/tickets/simple")
                        .with(authFor(testUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Projector not working"))
                .andExpect(jsonPath("$.category").value("IT Equipment"))
                .andExpect(jsonPath("$.priority").value("HIGH"))
                .andExpect(jsonPath("$.status").value("OPEN"));
    }

    @Test
    @DisplayName("POST /api/tickets multipart supports auto-detect with image attachment")
    void createTicketMultipart_autoDetectsCategoryAndPriority() throws Exception {
        TicketRequest request = new TicketRequest();
        request.setTitle("Water flooding hallway");
        request.setLocation("Science Building Level 2");
        request.setDescription("There is an urgent leak and flood near the washroom.");
        request.setCategory("AUTO");
        request.setPriority("AUTO");

        MockMultipartFile ticketPart = new MockMultipartFile(
                "ticket",
                "ticket.json",
                MediaType.APPLICATION_JSON_VALUE,
                objectMapper.writeValueAsBytes(request)
        );
        MockMultipartFile filePart = new MockMultipartFile(
                "files",
                "evidence.png",
                MediaType.IMAGE_PNG_VALUE,
                "fake-image-content".getBytes()
        );

        mockMvc.perform(multipart("/api/tickets")
                        .file(ticketPart)
                        .file(filePart)
                        .with(authFor(testUser))
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.category").value("Plumbing"))
                .andExpect(jsonPath("$.priority").value("CRITICAL"))
                .andExpect(jsonPath("$.attachmentUrls[0]").exists());
    }

    @Test
    @DisplayName("POST /api/tickets/simple auto-assigns matching technician and moves ticket to IN_PROGRESS")
    void createTicketSimple_autoAssignsTechnicianByCategory() throws Exception {
        TicketRequest request = new TicketRequest();
        request.setTitle("Lab PC not booting");
        request.setLocation("Computer Lab 101");
        request.setDescription("The computer in the lab is not starting and shows no display.");
        request.setCategory("AUTO");
        request.setPriority("AUTO");

        mockMvc.perform(post("/api/tickets/simple")
                        .with(authFor(testUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.category").value("IT Equipment"))
                .andExpect(jsonPath("$.assignedTo").value(technicianUser.getId()))
                .andExpect(jsonPath("$.assignedToName").value("Technician User"))
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
    }

    private RequestPostProcessor authFor(User user) {
        return authentication(new UsernamePasswordAuthenticationToken(
                user,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        ));
    }
}
