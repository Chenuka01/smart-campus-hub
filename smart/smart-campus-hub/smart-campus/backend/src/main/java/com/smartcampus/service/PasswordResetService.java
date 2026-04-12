package com.smartcampus.service;

import com.smartcampus.exception.BadRequestException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String fromEmail;
    private final String mailHost;

    @Autowired(required = false)
    private JavaMailSender mailSender;
    
    // In-memory storage for OTPs (in production, use Redis or Database)
    private final Map<String, OtpData> otpStore = new HashMap<>();

    public PasswordResetService(UserRepository userRepository, PasswordEncoder passwordEncoder,
            @Value("${spring.mail.username:}") String fromEmail,
            @Value("${spring.mail.host:}") String mailHost) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.fromEmail = fromEmail;
        this.mailHost = mailHost;
    }

    public void requestPasswordReset(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        String otp = generateOtp();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(5);
        otpStore.put(email, new OtpData(otp, expiresAt, false));

        sendOtpEmail(email, user.getName(), otp);
    }

    public void verifyOtp(String email, String otp) {
        OtpData otpData = otpStore.get(email);
        
        if (otpData == null) {
            throw new BadRequestException("OTP not found. Please request a new OTP.");
        }
        
        if (LocalDateTime.now().isAfter(otpData.expiresAt)) {
            otpStore.remove(email);
            throw new BadRequestException("OTP has expired. Please request a new one.");
        }
        
        if (!otpData.otp.equals(otp)) {
            throw new BadRequestException("Invalid OTP. Please try again.");
        }
        
        // Mark OTP as verified
        otpData.isVerified = true;
    }

    public void resetPassword(String email, String otp, String newPassword) {
        // Verify OTP first
        OtpData otpData = otpStore.get(email);
        
        if (otpData == null) {
            throw new BadRequestException("OTP not found. Please request a new OTP.");
        }
        
        if (!otpData.isVerified) {
            throw new BadRequestException("OTP not verified. Please verify OTP first.");
        }
        
        if (LocalDateTime.now().isAfter(otpData.expiresAt)) {
            otpStore.remove(email);
            throw new BadRequestException("OTP has expired. Please request a new one.");
        }
        
        // Update password
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        // Clear OTP
        otpStore.remove(email);
    }

    private String generateOtp() {
        SecureRandom random = new SecureRandom();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    private void sendOtpEmail(String email, String name, String otp) {
        if (mailHost == null || mailHost.isEmpty() || mailSender == null) {
            System.err.println("[SKIPPED] Password reset email skipped. Mail host or JavaMailSender not configured.");
            System.out.println("[DEBUG] OTP for " + email + " is: " + otp);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(email);
            message.setSubject("Your Password Reset OTP");
            message.setText("Dear " + name + ",\n\n" +
                    "Your One-Time Password (OTP) for password reset is: " + otp + "\n" +
                    "This OTP will expire in 5 minutes.\n\n" +
                    "If you did not request this, please ignore this email.\n\n" +
                    "Best regards,\nSmartCampus Team");
            
            mailSender.send(message);
        } catch (IllegalStateException | org.springframework.mail.MailException e) {
            throw new BadRequestException("Failed to send OTP email: " + e.getMessage());
        }
    }

    private static class OtpData {
        String otp;
        LocalDateTime expiresAt;
        boolean isVerified;

        OtpData(String otp, LocalDateTime expiresAt, boolean isVerified) {
            this.otp = otp;
            this.expiresAt = expiresAt;
            this.isVerified = isVerified;
        }
    }
}
