package com.smartcampus.dto;

import java.util.List;

public record NotificationAnalyticsResponse(
        long totalNotifications,
        long unreadNotifications,
        double readRate,
        long uniqueRecipients,
        String busiestHourLabel,
        long busiestHourCount,
        List<ActiveUserMetric> mostActiveUsers,
        List<EventMetric> mostTriggeredEvents,
        List<HourlyMetric> peakNotificationTimes,
        List<DailyMetric> recentVolume
) {
    public record ActiveUserMetric(
            String userId,
            String name,
            String email,
            long count,
            double share
    ) {}

    public record EventMetric(
            String type,
            String label,
            long count,
            double percentage
    ) {}

    public record HourlyMetric(
            int hour,
            String label,
            long count
    ) {}

    public record DailyMetric(
            String date,
            String label,
            long count
    ) {}
}
