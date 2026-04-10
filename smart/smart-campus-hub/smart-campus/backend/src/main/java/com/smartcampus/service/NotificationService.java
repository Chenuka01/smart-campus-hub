package com.smartcampus.service;

import com.smartcampus.model.Notification;
import com.smartcampus.model.User;
import com.smartcampus.repository.NotificationRepository;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.dto.NotificationPreferencesRequest;
import org.springframework.lang.NonNull;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final JavaMailSender mailSender;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository, SimpMessagingTemplate messagingTemplate, JavaMailSender mailSender) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
        this.mailSender = mailSender;
    }

    public Notification createNotification(@NonNull String userId, String title, String message,
                                            Notification.NotificationType type, 
                                            String referenceId, String referenceType) {
        
        // 1. Fetch user to check global preferences
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            String typeName = type.name();
            // Skip if Booking Alerts are disabled
            if (typeName.startsWith("BOOKING_") && !user.isBookingAlertsEnabled()) {
                System.out.println("[SKIPPED] Booking alert skipped: " + title);
                return null;
            }
            // Skip if Ticket Updates are disabled
            if (typeName.startsWith("TICKET_") && !user.isTicketUpdatesEnabled()) {
                System.out.println("[SKIPPED] Ticket alert skipped: " + title);
                return null;
            }
            // Skip if Comments are disabled
            if (typeName.equals("COMMENT_ADDED") && !user.isCommentAlertsEnabled()) {
                System.out.println("[SKIPPED] Comment alert skipped: " + title);
                return null;
            }
            // SYSTEM alerts are never disabled.
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

        messagingTemplate.convertAndSendToUser(userId, "/queue/notifications", saved);

        // EXTRA LOGIC: Email Sending trigger based on User preferences
        if (user != null) {
            String targetEmail = user.getEmail();

            System.out.println("-------------------------------------------------");
            System.out.println("[INFO] EVENT TRIGGERED: " + type.name());

            // 1. Check Email Preferences
            if (user.isEmailNotificationsEnabled()) {
                if (isWithinDndWindow(user)) {
                    System.out.println("[SKIPPED] [EMAIL SKIPPED for " + targetEmail + "] (DND Mode active from " + user.getDndStartTime() + " to " + user.getDndEndTime() + ")");
                } else {
                    System.out.println("[EMAIL] [SENDING REAL EMAIL TO: " + targetEmail + "]");
                    try {
                        SimpleMailMessage mailMessage = new SimpleMailMessage();
                        mailMessage.setFrom("chenukamudannayake@gmail.com");
                        mailMessage.setTo(targetEmail);
                        mailMessage.setSubject("Smart Campus Hub: " + title);
                        mailMessage.setText("Hello " + user.getName() + ",\n\n" + message + "\n\nRegards,\nSmart Campus Operations Hub");

                        mailSender.send(mailMessage);
                        System.out.println("[SUCCESS] Email sent successfully! To: " + targetEmail);
                    } catch (Exception e) {
                        System.err.println("[ERROR] Failed to send email: " + e.getMessage());
                        e.printStackTrace();
                        // Do not throw an exception here so that the main transaction (booking/ticket update) doesn't roll back
                    }
                }
            } else {
                System.out.println("[SKIPPED] [EMAIL SKIPPED for " + targetEmail + "] (Preferences: OFF)");
            }
            System.out.println("-------------------------------------------------");
        }

        return saved;
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

    public void updatePreferences(String userId, NotificationPreferencesRequest prefs) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setBookingAlertsEnabled(prefs.isBookingAlerts());
            user.setTicketUpdatesEnabled(prefs.isTicketUpdates());
            user.setCommentAlertsEnabled(prefs.isComments());
            user.setEmailNotificationsEnabled(prefs.isEmail());
            user.setDndEnabled(prefs.isDndMode());
            user.setDndStartTime(prefs.getDndStart());
            user.setDndEndTime(prefs.getDndEnd());
            userRepository.save(user);
        });
    }

    private boolean isWithinDndWindow(User user) {
        if (!user.isDndEnabled() || user.getDndStartTime() == null || user.getDndEndTime() == null) {
            return false;
        }
        try {
            LocalTime start = LocalTime.parse(user.getDndStartTime());
            LocalTime end = LocalTime.parse(user.getDndEndTime());
            LocalTime now = LocalTime.now();

            if (start.isBefore(end)) {
                return (now.isAfter(start) || now.equals(start)) && now.isBefore(end);
            } else {
                // crosses midnight e.g. 22:00 to 08:00
                return now.isAfter(start) || now.equals(start) || now.isBefore(end);
            }
        } catch (Exception e) {
            return false; // Default to non-DND mode if parsing fails
        }
    }

    public void deleteNotification(@NonNull String notificationId) {
        notificationRepository.deleteById(notificationId);
    }
}




