package com.smartcampus.repository;

import com.smartcampus.model.Facility;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FacilityRepository extends JpaRepository<Facility, String> {
    List<Facility> findByType(Facility.FacilityType type);
    List<Facility> findByStatus(Facility.Status status);
    List<Facility> findByLocationContainingIgnoreCase(String location);
    List<Facility> findByCapacityGreaterThanEqual(int capacity);
    List<Facility> findByNameContainingIgnoreCase(String name);
    List<Facility> findByTypeAndStatus(Facility.FacilityType type, Facility.Status status);
}
