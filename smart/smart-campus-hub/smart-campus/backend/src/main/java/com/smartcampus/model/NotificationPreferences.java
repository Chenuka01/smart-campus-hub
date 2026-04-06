package com.smartcampus.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
public class NotificationPreferences {

    private boolean bookingAlertsEnabled = true;
    private boolean ticketUpdatesEnabled = true;
    private boolean commentsEnabled = true;

    private boolean emailEnabled = true;
    private boolean smsEnabled = false;

    private boolean dndEnabled = false;
    private LocalTime dndStartTime = LocalTime.of(22, 0); // 10 PM
    private LocalTime dndEndTime = LocalTime.of(7, 0);   // 7 AM

    // Explicit getters/setters for safety
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
