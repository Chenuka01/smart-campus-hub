package com.smartcampus.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, nullable = false)
    private String email;

    private String password;
    private String name;

    @Column(name = "avatar_url")
    private String avatarUrl;

    private String provider;
    private String providerId;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "role")
    private Set<Role> roles;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_specialties", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "specialty")
    private Set<String> technicianSpecialties = new HashSet<>();

    private boolean enabled = true;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Notification Preferences
    @Column(name = "email_notifications_enabled")
    private Boolean emailNotificationsEnabled = true;

    @Column(name = "booking_alerts_enabled")
    private Boolean bookingAlertsEnabled = true;

    @Column(name = "ticket_updates_enabled")
    private Boolean ticketUpdatesEnabled = true;

    @Column(name = "comment_alerts_enabled")
    private Boolean commentAlertsEnabled = true;

    @Column(name = "dnd_enabled")
    private Boolean dndEnabled = false;

    @Column(name = "dnd_start_time")
    private String dndStartTime = "22:00";

    @Column(name = "dnd_end_time")
    private String dndEndTime = "08:00";

    // Explicit getters/setters to satisfy IDE when Lombok processor cannot initialize
    public String getId() { return id; }
    public String getEmail() { return email; }
    public String getPassword() { return password; }
    public String getName() { return name; }
    public String getAvatarUrl() { return avatarUrl; }
    public String getProvider() { return provider; }
    public String getProviderId() { return providerId; }
    public Set<Role> getRoles() { return roles; }
    public Set<String> getTechnicianSpecialties() { return technicianSpecialties; }
    public boolean isEnabled() { return enabled; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public Boolean isEmailNotificationsEnabled() { return emailNotificationsEnabled != null ? emailNotificationsEnabled : true; }
    public Boolean isBookingAlertsEnabled() { return bookingAlertsEnabled != null ? bookingAlertsEnabled : true; }
    public Boolean isTicketUpdatesEnabled() { return ticketUpdatesEnabled != null ? ticketUpdatesEnabled : true; }
    public Boolean isCommentAlertsEnabled() { return commentAlertsEnabled != null ? commentAlertsEnabled : true; }
    public Boolean isDndEnabled() { return dndEnabled != null ? dndEnabled : false; }
    public String getDndStartTime() { return dndStartTime; }
    public String getDndEndTime() { return dndEndTime; }

    public void setId(String id) { this.id = id; }
    public void setEmail(String email) { this.email = email; }
    public void setPassword(String password) { this.password = password; }
    public void setName(String name) { this.name = name; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public void setProvider(String provider) { this.provider = provider; }
    public void setProviderId(String providerId) { this.providerId = providerId; }
    public void setRoles(Set<Role> roles) { this.roles = roles; }
    public void setTechnicianSpecialties(Set<String> technicianSpecialties) { this.technicianSpecialties = technicianSpecialties != null ? technicianSpecialties : new HashSet<>(); }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public void setEmailNotificationsEnabled(Boolean emailNotificationsEnabled) { this.emailNotificationsEnabled = emailNotificationsEnabled != null ? emailNotificationsEnabled : true; }
    public void setBookingAlertsEnabled(Boolean bookingAlertsEnabled) { this.bookingAlertsEnabled = bookingAlertsEnabled != null ? bookingAlertsEnabled : true; }
    public void setTicketUpdatesEnabled(Boolean ticketUpdatesEnabled) { this.ticketUpdatesEnabled = ticketUpdatesEnabled != null ? ticketUpdatesEnabled : true; }
    public void setCommentAlertsEnabled(Boolean commentAlertsEnabled) { this.commentAlertsEnabled = commentAlertsEnabled != null ? commentAlertsEnabled : true; }
    public void setDndEnabled(Boolean dndEnabled) { this.dndEnabled = dndEnabled != null ? dndEnabled : false; }
    public void setDndStartTime(String dndStartTime) { this.dndStartTime = dndStartTime; }
    public void setDndEndTime(String dndEndTime) { this.dndEndTime = dndEndTime; }

    public enum Role {
        USER, ADMIN, TECHNICIAN, MANAGER, SUPER_ADMIN
    }
}


