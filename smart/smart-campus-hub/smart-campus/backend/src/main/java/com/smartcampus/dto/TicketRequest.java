package com.smartcampus.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TicketRequest {
    @NotBlank(message = "Title is required")
    private String title;

    private String facilityId;

    @NotBlank(message = "Location is required")
    private String location;

    private String category;

    @NotBlank(message = "Description is required")
    private String description;

    private String priority;

    private String contactEmail;
    private String contactPhone;

    private String assignedTo;
    private String assignedToName;

    public String getTitle() { return title; }
    public String getFacilityId() { return facilityId; }
    public String getLocation() { return location; }
    public String getCategory() { return category; }
    public String getDescription() { return description; }
    public String getPriority() { return priority; }
    public String getContactEmail() { return contactEmail; }
    public String getContactPhone() { return contactPhone; }
    public String getAssignedTo() { return assignedTo; }
    public String getAssignedToName() { return assignedToName; }

    public void setTitle(String title) { this.title = title; }
    public void setFacilityId(String facilityId) { this.facilityId = facilityId; }
    public void setLocation(String location) { this.location = location; }
    public void setCategory(String category) { this.category = category; }
    public void setDescription(String description) { this.description = description; }
    public void setPriority(String priority) { this.priority = priority; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }
    public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }
    public void setAssignedToName(String assignedToName) { this.assignedToName = assignedToName; }
}
