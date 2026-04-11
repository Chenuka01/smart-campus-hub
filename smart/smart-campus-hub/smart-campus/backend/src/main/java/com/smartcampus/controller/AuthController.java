package com.smartcampus.controller;

import com.smartcampus.dto.ApiResponse;
import com.smartcampus.dto.AuthRequest;
import com.smartcampus.dto.AuthResponse;
import com.smartcampus.dto.RegisterRequest;
import com.smartcampus.exception.BadRequestException;
import com.smartcampus.model.User;
import com.smartcampus.service.AuthService;
import com.smartcampus.service.GoogleTokenVerifier;
import com.smartcampus.service.PasswordResetService;
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
    private final PasswordResetService passwordResetService;

    public AuthController(AuthService authService, GoogleTokenVerifier googleTokenVerifier, PasswordResetService passwordResetService) {
        this.authService = authService;
        this.googleTokenVerifier = googleTokenVerifier;
        this.passwordResetService = passwordResetService;
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
     * POST: Verify Google OAuth 2.0 credential and authenticate user.
     * Improvements for secure OAuth integration.
     */
    @PostMapping("/google/verify")
    public ResponseEntity<AuthResponse> googleVerify(@RequestBody Map<String, String> request) {
        String idToken = request.get("credential");
        if (idToken == null || idToken.isBlank()) {
            throw new BadRequestException("Google credential is required");
        }
        // Server-side verification – DO NOT trust the client
        GoogleTokenVerifier.GoogleUserInfo userInfo = googleTokenVerifier.verify(idToken);
        AuthResponse response = authService.googleAuth(
                userInfo.email, userInfo.name, userInfo.picture, userInfo.sub);
        return ResponseEntity.ok(response);
    }

    /**
     * POST: Handle legacy Google OAuth login.
     * Receives pre-parsed user info from the client (backward compatibility).
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

    /**
     * GET: Retrieve the currently logged-in user's profile information.
     */
    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getCurrentUser(@AuthenticationPrincipal User user) {
        Set<String> roleStrings = user.getRoles().stream()
                .map(Enum::name)
                .collect(Collectors.toSet());
        AuthResponse response = new AuthResponse(
                null, user.getId(), user.getName(), user.getEmail(),
                user.getAvatarUrl(), roleStrings);
    /**
     * PUT: Update user profile details (Name/Email).
     */
        return ResponseEntity.ok(response);
    }

    /**
     * GET: Fetch all registered users (Admin only).
     */
    @PutMapping("/profile")
    public ResponseEntity<AuthResponse> updateProfile(@AuthenticationPrincipal User user, @RequestBody Map<String, String> request) {
        AuthResponse response = authService.updateProfile(user.getId(), request.get("name"), request.get("email"));
        return ResponseEntity.ok(response);
    }

    /**
     * PUT: Modern Role Management - Update roles for a specific user ID (Super Admin only).
     */
    @GetMapping("/users")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'MANAGER', 'TECHNICIAN')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(authService.getAllUsers());
    }

    @PutMapping("/users/{userId}/roles")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse> updateUserRoles(
            @PathVariable String userId,
            @RequestBody Map<String, List<String>> request) {
        Set<User.Role> roles = request.get("roles").stream()
                .map(User.Role::valueOf)
                .collect(Collectors.toSet());
        User user = authService.updateUserRoles(userId, roles);
        return ResponseEntity.ok(ApiResponse.success("Roles updated successfully", user));
    }

    @DeleteMapping("/users/{userId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse> deleteUser(@PathVariable String userId) {
        authService.deleteUser(userId);
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully", null));
    }

    @PostMapping("/password-reset/request")
    public ResponseEntity<ApiResponse> requestPasswordReset(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isBlank()) {
            throw new BadRequestException("Email is required");
        }
        passwordResetService.requestPasswordReset(email);
        return ResponseEntity.ok(ApiResponse.success("OTP sent to your email", null));
    }

    @PostMapping("/password-reset/verify-otp")
    public ResponseEntity<ApiResponse> verifyOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");
        if (email == null || email.isBlank() || otp == null || otp.isBlank()) {
            throw new BadRequestException("Email and OTP are required");
        }
        passwordResetService.verifyOtp(email, otp);
        return ResponseEntity.ok(ApiResponse.success("OTP verified successfully", null));
    }

    @PostMapping("/password-reset/reset")
    public ResponseEntity<ApiResponse> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");
        String newPassword = request.get("newPassword");
        if (email == null || email.isBlank() || otp == null || otp.isBlank() || newPassword == null || newPassword.isBlank()) {
            throw new BadRequestException("Email, OTP, and new password are required");
        }
        passwordResetService.resetPassword(email, otp, newPassword);
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully", null));
    }
}
