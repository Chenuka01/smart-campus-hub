package com.smartcampus.service;

import com.smartcampus.model.Notification;
import com.smartcampus.repository.NotificationRepository;
import org.springframework.lang.NonNull;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(NotificationRepository notificationRepository, SimpMessagingTemplate messagingTemplate) {
        this.notificationRepository = notificationRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public Notification createNotification(@NonNull String userId, String title, String message,
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
        
        Notification saved = notificationRepository.save(notification);
        
        // send live push notification via WebSocket
        messagingTemplate.convertAndSendToUser(userId, "/queue/notifications", saved);
        
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

    public void deleteNotification(@NonNull String notificationId) {
        notificationRepository.deleteById(notificationId);
    }
}
