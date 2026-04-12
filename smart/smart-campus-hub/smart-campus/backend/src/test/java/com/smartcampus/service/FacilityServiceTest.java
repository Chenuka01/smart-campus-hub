package com.smartcampus.service;

import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.Facility;
import com.smartcampus.repository.FacilityRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class FacilityServiceTest {

    @Mock
    private FacilityRepository facilityRepository;

    @InjectMocks
    private FacilityService facilityService;

    private Facility facility;

    @BeforeEach
    void setUp() {
        facility = new Facility();
        facility.setId("1");
        facility.setName("Main Lab");
        facility.setType(Facility.FacilityType.LAB);
        facility.setCapacity(50);
        facility.setStatus(Facility.Status.ACTIVE);
    }

    @Test
    void createFacility_ShouldReturnSavedFacility() {
        when(facilityRepository.save(any(Facility.class))).thenReturn(facility);

        Facility created = facilityService.createFacility(facility);

        assertNotNull(created);
        assertEquals("Main Lab", created.getName());
        verify(facilityRepository, times(1)).save(any(Facility.class));
    }

    @Test
    void getFacilityById_WhenExists_ShouldReturnFacility() {
        when(facilityRepository.findById("1")).thenReturn(Optional.of(facility));

        Facility found = facilityService.getFacilityById("1");

        assertNotNull(found);
        assertEquals("1", found.getId());
    }

    @Test
    void getFacilityById_WhenNotExists_ShouldThrowException() {
        when(facilityRepository.findById("non-existent")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            facilityService.getFacilityById("non-existent");
        });
    }

    @Test
    void getAllFacilities_ShouldReturnList() {
        List<Facility> facilities = Arrays.asList(facility);
        when(facilityRepository.findAll()).thenReturn(facilities);

        List<Facility> result = facilityService.getAllFacilities();

        assertFalse(result.isEmpty());
        assertEquals(1, result.size());
    }

    @Test
    void deleteFacility_WhenExists_ShouldDelete() {
        when(facilityRepository.existsById("1")).thenReturn(true);
        doNothing().when(facilityRepository).deleteById("1");

        facilityService.deleteFacility("1");

        verify(facilityRepository, times(1)).deleteById("1");
    }

    @Test
    void deleteFacility_WhenNotExists_ShouldThrowException() {
        when(facilityRepository.existsById("99")).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> {
            facilityService.deleteFacility("99");
        });
    }

    @Test
    void updateFacility_ShouldReturnUpdatedFacility() {
        Facility updatedInfo = new Facility();
        updatedInfo.setName("Updated Lab");
        updatedInfo.setStatus(Facility.Status.UNDER_MAINTENANCE);

        when(facilityRepository.findById("1")).thenReturn(Optional.of(facility));
        when(facilityRepository.save(any(Facility.class))).thenReturn(facility);

        Facility result = facilityService.updateFacility("1", updatedInfo);

        assertNotNull(result);
        assertEquals("Updated Lab", result.getName());
        verify(facilityRepository, times(1)).save(any(Facility.class));
    }
}
