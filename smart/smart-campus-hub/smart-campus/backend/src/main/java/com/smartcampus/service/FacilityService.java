package com.smartcampus.service;

import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.Facility;
import com.smartcampus.repository.FacilityRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class FacilityService {

    private final FacilityRepository facilityRepository;

    public FacilityService(FacilityRepository facilityRepository) {
        this.facilityRepository = facilityRepository;
    }

    public Facility createFacility(Facility facility) {
        facility.setCreatedAt(LocalDateTime.now());
        facility.setUpdatedAt(LocalDateTime.now());
        return facilityRepository.save(facility);
    }

    public Facility updateFacility(String id, Facility updatedFacility) {
        Facility facility = getFacilityById(id);
        facility.setName(updatedFacility.getName());
        facility.setType(updatedFacility.getType());
        facility.setCapacity(updatedFacility.getCapacity());
        facility.setLocation(updatedFacility.getLocation());
        facility.setBuilding(updatedFacility.getBuilding());
        facility.setFloor(updatedFacility.getFloor());
        facility.setDescription(updatedFacility.getDescription());
        facility.setAmenities(updatedFacility.getAmenities());
        facility.setImageUrls(updatedFacility.getImageUrls());
        facility.setStatus(updatedFacility.getStatus());
        facility.setAvailabilityWindows(updatedFacility.getAvailabilityWindows());
        facility.setUpdatedAt(LocalDateTime.now());
        return facilityRepository.save(facility);
    }

    public void deleteFacility(String id) {
        if (!facilityRepository.existsById(id)) {
            throw new ResourceNotFoundException("Facility not found with id: " + id);
        }
        facilityRepository.deleteById(id);
    }

    public Facility getFacilityById(String id) {
        return facilityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found with id: " + id));
    }

    public List<Facility> getAllFacilities() {
        return facilityRepository.findAll();
    }

    public List<Facility> searchFacilities(String type, String location, Integer minCapacity, String status) {
        if (type != null && status != null) {
            return facilityRepository.findByTypeAndStatus(
                    Facility.FacilityType.valueOf(type),
                    Facility.Status.valueOf(status));
        }
        if (type != null) {
            return facilityRepository.findByType(Facility.FacilityType.valueOf(type));
        }
        if (location != null) {
            return facilityRepository.findByLocationContainingIgnoreCase(location);
        }
        if (minCapacity != null) {
            return facilityRepository.findByCapacityGreaterThanEqual(minCapacity);
        }
        if (status != null) {
            return facilityRepository.findByStatus(Facility.Status.valueOf(status));
        }
        return facilityRepository.findAll();
    }
}
