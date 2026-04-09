package com.smartcampus.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "facilities")
public class Facility {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "facility_type")
    private FacilityType type;

    private int capacity;
    private String location;
    private String building;
    private String floor;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "facility_amenities", joinColumns = @JoinColumn(name = "facility_id"))
    @Column(name = "amenity")
    private List<String> amenities;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "facility_images", joinColumns = @JoinColumn(name = "facility_id"))
    @Column(name = "image_url", columnDefinition = "TEXT")
    private List<String> imageUrls;

    @Enumerated(EnumType.STRING)
    private Status status;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "facility_availability", joinColumns = @JoinColumn(name = "facility_id"))
    private List<AvailabilityWindow> availabilityWindows;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;

    public enum FacilityType {
        LECTURE_HALL, LAB, MEETING_ROOM, AUDITORIUM, PROJECTOR, CAMERA, LAPTOP, WHITEBOARD, OTHER_EQUIPMENT
    }

    public enum Status {
        ACTIVE, OUT_OF_SERVICE, UNDER_MAINTENANCE
    }

    @Data
    @NoArgsConstructor
    @Embeddable
    public static class AvailabilityWindow {
        private String dayOfWeek;
        private String startTime;
        private String endTime;

        public AvailabilityWindow(String dayOfWeek, String startTime, String endTime) {
            this.dayOfWeek = dayOfWeek;
            this.startTime = startTime;
            this.endTime = endTime;
        }

        public String getDayOfWeek() { return dayOfWeek; }
        public String getStartTime() { return startTime; }
        public String getEndTime() { return endTime; }
        public void setDayOfWeek(String dayOfWeek) { this.dayOfWeek = dayOfWeek; }
        public void setStartTime(String startTime) { this.startTime = startTime; }
        public void setEndTime(String endTime) { this.endTime = endTime; }
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public FacilityType getType() { return type; }
    public int getCapacity() { return capacity; }
    public String getLocation() { return location; }
    public String getBuilding() { return building; }
    public String getFloor() { return floor; }
    public String getDescription() { return description; }
    public List<String> getAmenities() { return amenities; }
    public List<String> getImageUrls() { return imageUrls; }
    public Status getStatus() { return status; }
    public List<AvailabilityWindow> getAvailabilityWindows() { return availabilityWindows; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public String getCreatedBy() { return createdBy; }

    public void setId(String id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setType(FacilityType type) { this.type = type; }
    public void setCapacity(int capacity) { this.capacity = capacity; }
    public void setLocation(String location) { this.location = location; }
    public void setBuilding(String building) { this.building = building; }
    public void setFloor(String floor) { this.floor = floor; }
    public void setDescription(String description) { this.description = description; }
    public void setAmenities(List<String> amenities) { this.amenities = amenities; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }
    public void setStatus(Status status) { this.status = status; }
    public void setAvailabilityWindows(List<AvailabilityWindow> availabilityWindows) { this.availabilityWindows = availabilityWindows; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}
