package com.smartcampus.controller;

import com.smartcampus.dto.ApiResponse;
import com.smartcampus.dto.AuthRequest;
import com.smartcampus.dto.AuthResponse;
import com.smartcampus.dto.RegisterRequest;
import com.smartcampus.model.User;
import com.smartcampus.service.AuthService;
import com.smartcampus.service.GoogleTokenVerifier;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final GoogleTokenVerifier googleTokenVerifier;

    public AuthController(AuthService authService, GoogleTokenVerifier googleTokenVerifier) {
        this.authService = authService;
        this.googleTokenVerifier = googleTokenVerifier;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Real Google OAuth 2.0 endpoint.
     * Accepts a Google ID token (credential) from Google Identity Services (GSI),
     * verifies it server-side using Google's tokeninfo API, then issues a SmartCampus JWT.
     */
    @PostMapping("/google/verify")
    public ResponseEntity<AuthResponse> googleVerify(@RequestBody Map<String, String> request) {
        String idToken = request.get("credential");
        if (idToken == null || idToken.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        // Server-side verification – DO NOT trust the client
        GoogleTokenVerifier.GoogleUserInfo userInfo = googleTokenVerifier.verify(idToken);
        AuthResponse response = authService.googleAuth(
                userInfo.email, userInfo.name, userInfo.picture, userInfo.sub);
        return ResponseEntity.ok(response);
    }

    /**
     * Legacy Google endpoint – accepts pre-parsed user info.
     * Kept for backwards compatibility.
     */
    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleAuth(@RequestBody Map<String, String> request) {
        AuthResponse response = authService.googleAuth(
                request.get("email"),
                request.get("name"),
                request.get("avatarUrl"),
                request.get("providerId"));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getCurrentUser(@AuthenticationPrincipal User user) {
        Set<String> roleStrings = user.getRoles().stream()
                .map(Enum::name)
                .collect(Collectors.toSet());
        AuthResponse response = new AuthResponse(
                null, user.getId(), user.getName(), user.getEmail(),
                user.getAvatarUrl(), roleStrings);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(authService.getAllUsers());
    }

    @PutMapping("/users/{userId}/roles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> updateUserRoles(
            @PathVariable String userId,
            @RequestBody Map<String, List<String>> request) {
        Set<User.Role> roles = request.get("roles").stream()
                .map(User.Role::valueOf)
                .collect(Collectors.toSet());
        User user = authService.updateUserRoles(userId, roles);
        return ResponseEntity.ok(ApiResponse.success("Roles updated successfully", user));
    }
}
