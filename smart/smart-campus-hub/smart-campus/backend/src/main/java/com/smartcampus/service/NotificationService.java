package com.smartcampus.service;

import com.smartcampus.dto.NotificationAnalyticsResponse;
import com.smartcampus.model.Notification;
import com.smartcampus.model.User;
import com.smartcampus.repository.NotificationRepository;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.dto.NotificationPreferencesRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    
    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.from:noreply@smartcampus.edu}")
    private String fromEmail;

    @Value("${spring.mail.host:}")
    private String mailHost;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository, SimpMessagingTemplate messagingTemplate) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
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
                if (mailHost == null || mailHost.isEmpty() || mailSender == null) {
                    System.out.println("[SKIPPED] [EMAIL SKIPPED] Mail host or JavaMailSender not configured.");
                } else if (isWithinDndWindow(user)) {
                    System.out.println("[SKIPPED] [EMAIL SKIPPED for " + targetEmail + "] (DND Mode active from " + user.getDndStartTime() + " to " + user.getDndEndTime() + ")");
                } else {
                    System.out.println("[EMAIL] [SENDING REAL EMAIL TO: " + targetEmail + "]");
                    try {
                        SimpleMailMessage mailMessage = new SimpleMailMessage();
                        mailMessage.setFrom(fromEmail);
                        mailMessage.setTo(targetEmail);
                        mailMessage.setSubject("Smart Campus Hub: " + title);
                        mailMessage.setText("Hello " + user.getName() + ",\n\n" + message + "\n\nRegards,\nSmart Campus Operations Hub");

                        mailSender.send(mailMessage);
                        System.out.println("[SUCCESS] Email sent successfully! To: " + targetEmail);
                    } catch (Exception e) {
                        System.err.println("[ERROR] Failed to send email: " + e.getMessage());
                        e.printStackTrace();
                        // Do not throw an exception here so that the main transaction (booking/ticket update) doesn't roll back
                        System.err.println("[ERROR] Failed to send email to " + targetEmail + ": " + e.getMessage());
                        // e.printStackTrace();
                        // throw new RuntimeException("Email failed: " + e.getMessage());
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

    public NotificationAnalyticsResponse getAnalyticsSnapshot() {
        List<Notification> notifications = notificationRepository.findAll().stream()
                .sorted(Comparator.comparing(Notification::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .toList();

        Map<String, User> usersById = userRepository.findAll().stream()
                .filter(user -> user.getId() != null)
                .collect(Collectors.toMap(User::getId, Function.identity(), (left, right) -> left));

        long totalNotifications = notifications.size();
        long unreadNotifications = notifications.stream()
                .filter(notification -> !notification.isRead())
                .count();
        long uniqueRecipients = notifications.stream()
                .map(Notification::getUserId)
                .filter(Objects::nonNull)
                .distinct()
                .count();

        List<NotificationAnalyticsResponse.ActiveUserMetric> mostActiveUsers = notifications.stream()
                .filter(notification -> notification.getUserId() != null)
                .collect(Collectors.groupingBy(Notification::getUserId, Collectors.counting()))
                .entrySet()
                .stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed().thenComparing(Map.Entry.comparingByKey()))
                .limit(6)
                .map(entry -> {
                    User user = usersById.get(entry.getKey());
                    String name = user != null && user.getName() != null && !user.getName().isBlank()
                            ? user.getName()
                            : "Unknown User";
                    String email = user != null && user.getEmail() != null && !user.getEmail().isBlank()
                            ? user.getEmail()
                            : "No email available";
                    return new NotificationAnalyticsResponse.ActiveUserMetric(
                            entry.getKey(),
                            name,
                            email,
                            entry.getValue(),
                            roundToOneDecimal(totalNotifications == 0 ? 0 : (entry.getValue() * 100.0) / totalNotifications)
                    );
                })
                .toList();

        List<NotificationAnalyticsResponse.EventMetric> mostTriggeredEvents = notifications.stream()
                .filter(notification -> notification.getType() != null)
                .collect(Collectors.groupingBy(notification -> notification.getType().name(), Collectors.counting()))
                .entrySet()
                .stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed().thenComparing(Map.Entry.comparingByKey()))
                .limit(6)
                .map(entry -> new NotificationAnalyticsResponse.EventMetric(
                        entry.getKey(),
                        humanizeNotificationType(entry.getKey()),
                        entry.getValue(),
                        roundToOneDecimal(totalNotifications == 0 ? 0 : (entry.getValue() * 100.0) / totalNotifications)
                ))
                .toList();

        Map<Integer, Long> hourlyCounts = notifications.stream()
                .filter(notification -> notification.getCreatedAt() != null)
                .collect(Collectors.groupingBy(notification -> notification.getCreatedAt().getHour(), Collectors.counting()));

        List<NotificationAnalyticsResponse.HourlyMetric> peakNotificationTimes = IntStream.range(0, 24)
                .mapToObj(hour -> new NotificationAnalyticsResponse.HourlyMetric(
                        hour,
                        formatHourLabel(hour),
                        hourlyCounts.getOrDefault(hour, 0L)
                ))
                .toList();

        NotificationAnalyticsResponse.HourlyMetric busiestHour = peakNotificationTimes.stream()
                .max(Comparator.comparingLong(NotificationAnalyticsResponse.HourlyMetric::count))
                .orElse(new NotificationAnalyticsResponse.HourlyMetric(0, "No activity", 0));

        LocalDate today = LocalDate.now();
        Map<LocalDate, Long> recentCounts = notifications.stream()
                .filter(notification -> notification.getCreatedAt() != null)
                .map(Notification::getCreatedAt)
                .map(LocalDateTime::toLocalDate)
                .filter(date -> !date.isBefore(today.minusDays(6)))
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));

        List<NotificationAnalyticsResponse.DailyMetric> recentVolume = IntStream.rangeClosed(0, 6)
                .mapToObj(offset -> today.minusDays(6L - offset))
                .map(date -> new NotificationAnalyticsResponse.DailyMetric(
                        date.toString(),
                        date.format(DateTimeFormatter.ofPattern("MMM d")),
                        recentCounts.getOrDefault(date, 0L)
                ))
                .toList();

        return new NotificationAnalyticsResponse(
                totalNotifications,
                unreadNotifications,
                roundToOneDecimal(totalNotifications == 0 ? 0 : ((totalNotifications - unreadNotifications) * 100.0) / totalNotifications),
                uniqueRecipients,
                totalNotifications == 0 ? "No activity" : busiestHour.label(),
                busiestHour.count(),
                mostActiveUsers,
                mostTriggeredEvents,
                peakNotificationTimes,
                recentVolume
        );
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

    private String humanizeNotificationType(String typeName) {
        return List.of(typeName.split("_")).stream()
                .map(part -> part.substring(0, 1) + part.substring(1).toLowerCase())
                .collect(Collectors.joining(" "));
    }

    private String formatHourLabel(int hour) {
        int displayHour = hour % 12 == 0 ? 12 : hour % 12;
        String meridiem = hour < 12 ? "AM" : "PM";
        return displayHour + ":00 " + meridiem;
    }

    private double roundToOneDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}




