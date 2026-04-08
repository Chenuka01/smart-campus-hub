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
}