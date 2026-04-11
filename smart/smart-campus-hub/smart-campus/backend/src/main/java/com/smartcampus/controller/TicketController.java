package com.smartcampus.controller;

import com.smartcampus.dto.ApiResponse;
import com.smartcampus.dto.TicketRequest;
import com.smartcampus.exception.BadRequestException;
import com.smartcampus.model.Ticket;
import com.smartcampus.model.User;
import com.smartcampus.service.FileStorageService;
import com.smartcampus.service.TicketService;
import jakarta.validation.Valid;
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
            @Valid @RequestPart("ticket") TicketRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @AuthenticationPrincipal User user) throws IOException {

        List<String> attachmentUrls = new ArrayList<>();
        if (files != null) {
            // Strictly follow requirement: up to 3 image attachments
            if (files.size() > 3) {
                throw new BadRequestException("You can upload up to 3 image attachments per ticket");
            }
            for (int i = 0; i < files.size(); i++) {
                attachmentUrls.add(fileStorageService.storeFile(files.get(i)));
            }
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketService.createTicket(request, user, attachmentUrls));
    }

    @PostMapping("/simple")
    public ResponseEntity<Ticket> createTicketSimple(
            @Valid @RequestBody TicketRequest request,
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
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN', 'SUPER_ADMIN', 'MANAGER')")
    public ResponseEntity<List<Ticket>> getAllTickets(
            @RequestParam(required = false) String status) {
        if (status != null) {
            return ResponseEntity.ok(ticketService.getTicketsByStatus(Ticket.TicketStatus.valueOf(status)));
        }
        return ResponseEntity.ok(ticketService.getAllTickets());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ticket> getTicketById(
            @PathVariable String id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.getTicketById(id, user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Ticket> updateTicket(
            @PathVariable String id,
            @Valid @RequestBody TicketRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.updateTicket(id, request, user));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Ticket> updateTicketWithFiles(
            @PathVariable String id,
            @Valid @RequestPart("ticket") TicketRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @AuthenticationPrincipal User user) throws IOException {

        Ticket existingTicket = ticketService.getTicketById(id, user);
        List<String> retainedAttachmentUrls = request.getRetainedAttachmentUrls() != null
                ? new ArrayList<>(request.getRetainedAttachmentUrls())
                : new ArrayList<>(existingTicket.getAttachmentUrls() != null ? existingTicket.getAttachmentUrls() : List.of());

        List<String> attachmentUrls = new ArrayList<>(retainedAttachmentUrls);
        if (files != null) {
            if (attachmentUrls.size() + files.size() > 3) {
                throw new BadRequestException("You can upload up to 3 image attachments per ticket");
            }
            for (MultipartFile file : files) {
                attachmentUrls.add(fileStorageService.storeFile(file));
            }
        }

        Ticket updatedTicket = ticketService.updateTicket(id, request, user, attachmentUrls);

        List<String> existingUrls = existingTicket.getAttachmentUrls() != null
                ? existingTicket.getAttachmentUrls()
                : List.of();
        for (String url : existingUrls) {
            if (!attachmentUrls.contains(url)) {
                fileStorageService.deleteFile(url);
            }
        }

        return ResponseEntity.ok(updatedTicket);
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'MANAGER', 'TECHNICIAN')")
    public ResponseEntity<Ticket> assignTicket(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        return ResponseEntity.ok(ticketService.assignTicket(
                id, request.get("technicianId"), request.get("technicianName")));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN', 'SUPER_ADMIN', 'MANAGER')")
    public ResponseEntity<Ticket> updateTicketStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.updateTicketStatus(
                id, request.get("status"),
                request.get("resolutionNotes"),
                request.get("rejectionReason"),
                user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteTicket(
            @PathVariable String id,
            @AuthenticationPrincipal User user) {
        ticketService.deleteTicketByUser(id, user);
        return ResponseEntity.ok(ApiResponse.success("Ticket deleted successfully"));
    }

    @DeleteMapping("/bulk-delete")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse> bulkDeleteTickets(
            @RequestBody List<String> ids) {
        ticketService.bulkDeleteTickets(ids);
        return ResponseEntity.ok(ApiResponse.success("Tickets deleted successfully"));
    }

    @DeleteMapping("/clear-history")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse> clearTicketHistory() {
        ticketService.clearAllClosedResolvedTickets();
        return ResponseEntity.ok(ApiResponse.success("Ticket history cleared successfully"));
    }
}
