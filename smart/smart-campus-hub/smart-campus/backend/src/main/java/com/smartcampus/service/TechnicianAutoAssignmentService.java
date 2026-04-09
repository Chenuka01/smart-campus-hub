package com.smartcampus.service;

import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
public class TechnicianAutoAssignmentService {

    private final UserRepository userRepository;

    public TechnicianAutoAssignmentService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Optional<User> findBestTechnicianForCategory(String category) {
        String normalizedCategory = normalize(category);

        List<User> technicians = userRepository.findAll().stream()
                .filter(User::isEnabled)
                .filter(user -> user.getRoles() != null && user.getRoles().stream().anyMatch(role -> role == User.Role.TECHNICIAN))
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();

        return technicians.stream()
                .filter(user -> user.getTechnicianSpecialties() != null)
                .filter(user -> user.getTechnicianSpecialties().stream().map(this::normalize).anyMatch(normalizedCategory::equals))
                .findFirst()
                .or(() -> technicians.stream().findFirst());
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }
}
