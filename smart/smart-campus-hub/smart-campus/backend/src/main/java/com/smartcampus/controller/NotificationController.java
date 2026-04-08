package com.smartcampus.controller;

import com.smartcampus.dto.ApiResponse;
import com.smartcampus.model.Notification;
import com.smartcampus.model.User;
import com.smartcampus.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getMyNotifications(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(notificationService.getUserNotifications(user.getId()));
    }

    @GetMapping("/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(notificationService.getUnreadNotifications(user.getId()));
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@AuthenticationPrincipal User user) {
        long count = notificationService.getUnreadCount(user.getId());
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(@PathVariable String id) {
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse> markAllAsRead(@AuthenticationPrincipal User user) {
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteNotification(@PathVariable String id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok(ApiResponse.success("Notification deleted"));
    }

    @GetMapping("/preferences")
    public ResponseEntity<com.smartcampus.dto.NotificationPreferencesRequest> getPreferences(@AuthenticationPrincipal User user) {
        com.smartcampus.dto.NotificationPreferencesRequest prefs = new com.smartcampus.dto.NotificationPreferencesRequest();
        prefs.setBookingAlerts(user.isBookingAlertsEnabled());
        prefs.setTicketUpdates(user.isTicketUpdatesEnabled());
        prefs.setComments(user.isCommentAlertsEnabled());
        prefs.setEmail(user.isEmailNotificationsEnabled());
        prefs.setDndMode(user.isDndEnabled());
        prefs.setDndStart(user.getDndStartTime());
        prefs.setDndEnd(user.getDndEndTime());
        return ResponseEntity.ok(prefs);
    }

    @PutMapping("/preferences")
    public ResponseEntity<ApiResponse> updatePreferences(@AuthenticationPrincipal User user, @RequestBody com.smartcampus.dto.NotificationPreferencesRequest prefs) {
        notificationService.updatePreferences(user.getId(), prefs);

        // Try sending an immediate test email manually bypassing logic, catching exactly why it fails.
        try {
            notificationService.createNotification(
                user.getId(),
                "Preferences Updated!",
                "Your notification settings were successfully updated.\n\nEmail Alerts: " + (prefs.isEmail() ? "ON" : "OFF") + "\nDND Mode: " + (prefs.isDndMode() ? "ON (" + prefs.getDndStart() + " to " + prefs.getDndEnd() + ")" : "OFF"),
                Notification.NotificationType.SYSTEM, null, null
            );
        } catch (Exception e) {
            return ResponseEntity.status(500).body(ApiResponse.error("Failed to send: " + e.getMessage()));
        }

        return ResponseEntity.ok(ApiResponse.success("Preferences updated successfully. Check email Inbox!"));

    }
}
