package com.smartcampus.service;

import com.smartcampus.model.Notification;
import com.smartcampus.model.NotificationPreferences;
import com.smartcampus.model.User;
import com.smartcampus.repository.NotificationRepository;
import com.smartcampus.repository.UserRepository;
import org.springframework.lang.NonNull;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(NotificationRepository notificationRepository, 
                               UserRepository userRepository,
                               SimpMessagingTemplate messagingTemplate) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public Notification createNotification(@NonNull String userId, String title, String message,
                                            Notification.NotificationType type,
                                            String referenceId, String referenceType) {
        
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            NotificationPreferences prefs = user.getNotificationPreferences();
            if (prefs != null) {
                // Check general enablement by type
                if (isBookingType(type) && !prefs.isBookingAlertsEnabled()) return null;
                if (isTicketType(type) && !prefs.isTicketUpdatesEnabled()) return null;
                if (type == Notification.NotificationType.COMMENT_ADDED && !prefs.isCommentsEnabled()) return null;

                // Check Do Not Disturb
                if (prefs.isDndEnabled() && isCurrentlyInDnd(prefs)) {
                    // Still create the database record but skip the real-time push?
                    // Or skip altogether? Usually DND means silence.
                    // For now, let's just create it in DB so they see it later, but skip push.
                    return saveToDbOnly(userId, title, message, type, referenceId, referenceType);
                }
            }
        }

        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setReferenceId(referenceId);
        notification.setReferenceType(referenceType);
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        
        Notification saved = notificationRepository.save(notification);
        
        // send live push notification via WebSocket
        messagingTemplate.convertAndSendToUser(userId, "/queue/notifications", saved);
        
        // TODO: Handle Email/SMS toggle logic if integrated
        if (user != null && user.getNotificationPreferences().isEmailEnabled()) {
             // emailService.send(...)
        }

        return saved;
    }

    private boolean isBookingType(Notification.NotificationType type) {
        return type == Notification.NotificationType.BOOKING_APPROVED ||
               type == Notification.NotificationType.BOOKING_REJECTED ||
               type == Notification.NotificationType.BOOKING_CANCELLED;
    }

    private boolean isTicketType(Notification.NotificationType type) {
        return type == Notification.NotificationType.TICKET_CREATED ||
               type == Notification.NotificationType.TICKET_ASSIGNED ||
               type == Notification.NotificationType.TICKET_STATUS_CHANGED ||
               type == Notification.NotificationType.TICKET_RESOLVED ||
               type == Notification.NotificationType.TICKET_CLOSED ||
               type == Notification.NotificationType.TICKET_REJECTED;
    }

    private boolean isCurrentlyInDnd(NotificationPreferences prefs) {
        LocalTime now = LocalTime.now();
        LocalTime start = prefs.getDndStartTime();
        LocalTime end = prefs.getDndEndTime();

        if (start.isBefore(end)) {
            return !now.isBefore(start) && now.isBefore(end);
        } else {
            // Over midnight (e.g., 22:00 to 07:00)
            return !now.isBefore(start) || now.isBefore(end);
        }
    }

    private Notification saveToDbOnly(String userId, String title, String message,
                                     Notification.NotificationType type,
                                     String referenceId, String referenceType) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setReferenceId(referenceId);
        notification.setReferenceType(referenceType);
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        return notificationRepository.save(notification);
    }

    public List<Notification> getUserNotifications(@NonNull String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Notification> getUnreadNotifications(@NonNull String userId) {
        return notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId);
    }

    public long getUnreadCount(@NonNull String userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    public Notification markAsRead(@NonNull String notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    public void markAllAsRead(@NonNull String userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    public void deleteNotification(@NonNull String notificationId) {
        notificationRepository.deleteById(notificationId);
    }
}
