package com.smartcampus.service;

import com.smartcampus.dto.AuthRequest;
import com.smartcampus.dto.AuthResponse;
import com.smartcampus.dto.RegisterRequest;
import com.smartcampus.exception.BadRequestException;
import com.smartcampus.exception.UnauthorizedException;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.security.JwtTokenProvider;
import com.smartcampus.security.AuditLog;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @AuditLog(action = "CREATE_USER", resourceType = "User")
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setProvider("LOCAL");
        user.setRoles(Set.of(User.Role.USER));
        user.setEnabled(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        user = userRepository.save(user);

        Set<String> roleStrings = user.getRoles().stream()
                .map(Enum::name)
                .collect(Collectors.toSet());

        String token = tokenProvider.generateToken(user.getId(), user.getEmail(), roleStrings);

        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.getAvatarUrl(), roleStrings);
    }

    @AuditLog(action = "LOGIN", resourceType = "User")
    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        Set<String> roleStrings = user.getRoles().stream()
                .map(Enum::name)
                .collect(Collectors.toSet());

        String token = tokenProvider.generateToken(user.getId(), user.getEmail(), roleStrings);

        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.getAvatarUrl(), roleStrings);
    }

    @AuditLog(action = "UPDATE_PROFILE", resourceType = "User")
    public AuthResponse updateProfile(String userId, String name, String email) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (!user.getEmail().equals(email) && userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email already taken");
        }

        user.setName(name);
        user.setEmail(email);
        user.setUpdatedAt(LocalDateTime.now());
        user = userRepository.save(user);

        Set<String> roleStrings = user.getRoles().stream()
                .map(Enum::name)
                .collect(Collectors.toSet());

        return new AuthResponse(tokenProvider.generateToken(user.getId(), user.getEmail(), roleStrings), 
                user.getId(), user.getName(), user.getEmail(), user.getAvatarUrl(), roleStrings);
    }

    @AuditLog(action = "GOOGLE_AUTH", resourceType = "User")
    public AuthResponse googleAuth(String email, String name, String avatarUrl, String providerId) {
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            // Auto-create user for Google provider
            user = new User();
            user.setEmail(email);
            user.setName(name);
            user.setAvatarUrl(avatarUrl);
            user.setProvider("GOOGLE");
            user.setProviderId(providerId);
            user.setRoles(Set.of(User.Role.USER));
            user.setEnabled(true);
            user.setCreatedAt(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());
            user = userRepository.save(user);
        } else {
            // Check if user is trying to login with different provider than registered
            if ("LOCAL".equals(user.getProvider()) && user.getProviderId() == null) {
                // If it's a local user without social link, we can choose to link it or block it.
                // Based on user request "google user correctly connect registered email in login with cannot other emails",
                // we'll allow linking if the email matches.
                user.setProvider("GOOGLE");
                user.setProviderId(providerId);
            } else if (!"GOOGLE".equals(user.getProvider())) {
                throw new BadRequestException("This email is already registered with another provider: " + user.getProvider());
            }
            
            user.setName(name);
            user.setAvatarUrl(avatarUrl);
            user.setUpdatedAt(LocalDateTime.now());
            user = userRepository.save(user);
        }

        Set<String> roleStrings = user.getRoles().stream()
                .map(Enum::name)
                .collect(Collectors.toSet());

        String token = tokenProvider.generateToken(user.getId(), user.getEmail(), roleStrings);

        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.getAvatarUrl(), roleStrings);
    }

    public User getUserById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));
    }

    @AuditLog(action = "UPDATE_ROLES", resourceType = "User", logParameters = true)
    public User updateUserRoles(String userId, Set<User.Role> roles) {
        User user = getUserById(userId);
        user.setRoles(roles);
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    public java.util.List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public void deleteUser(String userId) {
        if (!userRepository.existsById(userId)) {
            throw new BadRequestException("User not found");
        }
        userRepository.deleteById(userId);
    }
}
