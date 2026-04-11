package com.smartcampus.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class TicketRequest {
    @NotBlank(message = "Title is required")
    @Size(min = 5, max = 120, message = "Title must be between 5 and 120 characters")
    private String title;

    private String facilityId;

    @NotBlank(message = "Location is required")
    @Size(max = 120, message = "Location cannot exceed 120 characters")
    private String location;

    private String category;

    @NotBlank(message = "Description is required")
    @Size(min = 20, max = 2000, message = "Description must be between 20 and 2000 characters")
    private String description;

    private String priority;

    @Email(message = "Invalid email format")
    private String contactEmail;

    @Pattern(regexp = "^$|^[0-9]{10}$", message = "Phone number must be exactly 10 digits")
    private String contactPhone;

    private String assignedTo;
    private String assignedToName;
    private List<String> retainedAttachmentUrls;

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
    public List<String> getRetainedAttachmentUrls() { return retainedAttachmentUrls; }

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
    public void setRetainedAttachmentUrls(List<String> retainedAttachmentUrls) { this.retainedAttachmentUrls = retainedAttachmentUrls; }
}
