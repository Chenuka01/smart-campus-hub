package com.smartcampus.dto;

import lombok.Data;

@Data
public class NotificationPreferencesRequest {
    private boolean bookingAlerts;
    private boolean ticketUpdates;
    private boolean comments;
    
    private boolean email;
    private boolean dndMode;
    private String dndStart;
    private String dndEnd;

    // Explicit getters/setters to satisfy IDE when Lombok processor cannot initialize
    public boolean isBookingAlerts() { return bookingAlerts; }
    public void setBookingAlerts(boolean bookingAlerts) { this.bookingAlerts = bookingAlerts; }

    public boolean isTicketUpdates() { return ticketUpdates; }
    public void setTicketUpdates(boolean ticketUpdates) { this.ticketUpdates = ticketUpdates; }

    public boolean isComments() { return comments; }
    public void setComments(boolean comments) { this.comments = comments; }

    public boolean isEmail() { return email; }
    public void setEmail(boolean email) { this.email = email; }

    public boolean isDndMode() { return dndMode; }
    public void setDndMode(boolean dndMode) { this.dndMode = dndMode; }

    public String getDndStart() { return dndStart; }
    public void setDndStart(String dndStart) { this.dndStart = dndStart; }

    public String getDndEnd() { return dndEnd; }
    public void setDndEnd(String dndEnd) { this.dndEnd = dndEnd; }
}