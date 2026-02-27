package com.smartcampus.controller;

import com.smartcampus.dto.ApiResponse;
import com.smartcampus.dto.TicketRequest;
import com.smartcampus.model.Ticket;
import com.smartcampus.model.User;
import com.smartcampus.service.FileStorageService;
import com.smartcampus.service.TicketService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;
    private final FileStorageService fileStorageService;

    public TicketController(TicketService ticketService, FileStorageService fileStorageService) {
        this.ticketService = ticketService;
        this.fileStorageService = fileStorageService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Ticket> createTicket(
            @RequestPart("ticket") TicketRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @AuthenticationPrincipal User user) throws IOException {

        List<String> attachmentUrls = new ArrayList<>();
        if (files != null) {
            int maxFiles = Math.min(files.size(), 3);
            for (int i = 0; i < maxFiles; i++) {
                attachmentUrls.add(fileStorageService.storeFile(files.get(i)));
            }
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketService.createTicket(request, user, attachmentUrls));
    }

    @PostMapping("/simple")
    public ResponseEntity<Ticket> createTicketSimple(
            @RequestBody TicketRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketService.createTicket(request, user, new ArrayList<>()));
    }

    @GetMapping("/my")
    public ResponseEntity<List<Ticket>> getMyTickets(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.getUserTickets(user.getId()));
    }

    @GetMapping("/assigned")
    public ResponseEntity<List<Ticket>> getAssignedTickets(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.getAssignedTickets(user.getId()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<List<Ticket>> getAllTickets(
            @RequestParam(required = false) String status) {
        if (status != null) {
            return ResponseEntity.ok(ticketService.getTicketsByStatus(Ticket.TicketStatus.valueOf(status)));
        }
        return ResponseEntity.ok(ticketService.getAllTickets());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ticket> getTicketById(@PathVariable String id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Ticket> assignTicket(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        return ResponseEntity.ok(ticketService.assignTicket(
                id, request.get("technicianId"), request.get("technicianName")));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<Ticket> updateTicketStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        return ResponseEntity.ok(ticketService.updateTicketStatus(
                id, request.get("status"),
                request.get("resolutionNotes"),
                request.get("rejectionReason")));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> deleteTicket(@PathVariable String id) {
        ticketService.deleteTicket(id);
        return ResponseEntity.ok(ApiResponse.success("Ticket deleted successfully"));
    }
}
