package com.smartcampus.dto;

import lombok.Data;
import java.time.LocalTime;

@Data
public class NotificationPreferencesRequest {
    private boolean bookingAlertsEnabled;
    private boolean ticketUpdatesEnabled;
    private boolean commentsEnabled;
    private boolean emailEnabled;
    private boolean smsEnabled;
    private boolean dndEnabled;
    private LocalTime dndStartTime;
    private LocalTime dndEndTime;

    // Explicit Getters/Setters to ensure they are available
    public boolean isBookingAlertsEnabled() { return bookingAlertsEnabled; }
    public boolean isTicketUpdatesEnabled() { return ticketUpdatesEnabled; }
    public boolean isCommentsEnabled() { return commentsEnabled; }
    public boolean isEmailEnabled() { return emailEnabled; }
    public boolean isSmsEnabled() { return smsEnabled; }
    public boolean isDndEnabled() { return dndEnabled; }
    public LocalTime getDndStartTime() { return dndStartTime; }
    public LocalTime getDndEndTime() { return dndEndTime; }

    public void setBookingAlertsEnabled(boolean b) { bookingAlertsEnabled = b; }
    public void setTicketUpdatesEnabled(boolean b) { ticketUpdatesEnabled = b; }
    public void setCommentsEnabled(boolean b) { commentsEnabled = b; }
    public void setEmailEnabled(boolean b) { emailEnabled = b; }
    public void setSmsEnabled(boolean b) { smsEnabled = b; }
    public void setDndEnabled(boolean b) { dndEnabled = b; }
    public void setDndStartTime(LocalTime t) { dndStartTime = t; }
    public void setDndEndTime(LocalTime t) { dndEndTime = t; }
}
