package com.smartcampus.service;

import com.smartcampus.dto.NotificationAnalyticsResponse;
import com.smartcampus.model.Notification;
import com.smartcampus.model.User;
import com.smartcampus.repository.NotificationRepository;
import com.smartcampus.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationService Unit Tests")
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private UserRepository userRepository;
    @Mock private SimpMessagingTemplate messagingTemplate;
    @Mock private JavaMailSender mailSender;

    @InjectMocks private NotificationService notificationService;

    @Test
    @DisplayName("getAnalyticsSnapshot: aggregates active users, events, and peak hours")
    void getAnalyticsSnapshot_returnsDashboardMetrics() {
        User jane = new User();
        jane.setId("user-1");
        jane.setName("Jane Student");
        jane.setEmail("jane@campus.test");

        User alex = new User();
        alex.setId("user-2");
        alex.setName("Alex Admin");
        alex.setEmail("alex@campus.test");

        LocalDate today = LocalDate.now();
        LocalDateTime nineAm = today.atTime(9, 15);
        LocalDateTime twoPm = today.atTime(14, 30);

        Notification first = notification("user-1", Notification.NotificationType.BOOKING_APPROVED, false, nineAm);
        Notification second = notification("user-1", Notification.NotificationType.BOOKING_APPROVED, true, nineAm.plusMinutes(20));
        Notification third = notification("user-2", Notification.NotificationType.TICKET_CREATED, false, twoPm);
        Notification fourth = notification("user-2", Notification.NotificationType.SYSTEM, true, today.minusDays(1).atTime(14, 45));

        when(notificationRepository.findAll()).thenReturn(List.of(first, second, third, fourth));
        when(userRepository.findAll()).thenReturn(List.of(jane, alex));

        NotificationAnalyticsResponse response = notificationService.getAnalyticsSnapshot();

        assertThat(response.totalNotifications()).isEqualTo(4);
        assertThat(response.unreadNotifications()).isEqualTo(2);
        assertThat(response.readRate()).isEqualTo(50.0);
        assertThat(response.uniqueRecipients()).isEqualTo(2);

        assertThat(response.mostActiveUsers()).hasSize(2);
        assertThat(response.mostActiveUsers().get(0).name()).isEqualTo("Jane Student");
        assertThat(response.mostActiveUsers().get(0).count()).isEqualTo(2);

        assertThat(response.mostTriggeredEvents()).hasSize(3);
        assertThat(response.mostTriggeredEvents().get(0).type()).isEqualTo("BOOKING_APPROVED");
        assertThat(response.mostTriggeredEvents().get(0).count()).isEqualTo(2);
        assertThat(response.mostTriggeredEvents().get(0).percentage()).isEqualTo(50.0);

        assertThat(response.busiestHourLabel()).isEqualTo("9:00 AM");
        assertThat(response.busiestHourCount()).isEqualTo(2);
        assertThat(response.peakNotificationTimes().stream().filter(point -> point.hour() == 9).findFirst())
                .get()
                .extracting(NotificationAnalyticsResponse.HourlyMetric::count)
                .isEqualTo(2L);

        assertThat(response.recentVolume()).hasSize(7);
        assertThat(response.recentVolume().stream().mapToLong(NotificationAnalyticsResponse.DailyMetric::count).sum()).isEqualTo(4);
    }

    private Notification notification(
            String userId,
            Notification.NotificationType type,
            boolean read,
            LocalDateTime createdAt
    ) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(type);
        notification.setRead(read);
        notification.setCreatedAt(createdAt);
        return notification;
    }
}
