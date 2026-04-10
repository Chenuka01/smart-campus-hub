package com.smartcampus.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * ✅ Production-Ready Rate Limiting Filter
 * 
 * - Sliding window algorithm (60-second windows)
 * - Tracks requests per IP address
 * - Special handling for auth endpoints (5 requests) vs others (100 requests)
 * - Returns 429 Too Many Requests when limit exceeded
 * 
 * Configuration:
 * - app.rate-limit.enabled: Enable/disable rate limiting
 * - app.rate-limit.window-size-seconds: Window size for counting requests
 * - app.rate-limit.max-requests-per-window: Max requests for regular endpoints
 * - app.rate-limit.auth-max-requests-per-window: Max requests for /auth/** endpoints
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitingFilter.class);

    @Value("${app.rate-limit.enabled:true}")
    private boolean enabled;

    @Value("${app.rate-limit.window-size-seconds:60}")
    private long windowSizeSeconds;

    @Value("${app.rate-limit.max-requests-per-window:100}")
    private int maxRequests;

    @Value("${app.rate-limit.auth-max-requests-per-window:5}")
    private int authMaxRequests;

    // Thread-safe storage: IP -> list of request timestamps
    private final Map<String, RateLimitBucket> requestBuckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, 
                                   @NonNull HttpServletResponse response, 
                                   @NonNull FilterChain filterChain) throws ServletException, IOException {
        
        if (!enabled) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIpAddress(request);
        String requestPath = request.getRequestURI();
        
        // Determine if this is an auth endpoint
        boolean isAuthEndpoint = requestPath.startsWith("/api/auth/");
        int limit = isAuthEndpoint ? authMaxRequests : maxRequests;

        // ✅ Check rate limit
        if (!isWithinRateLimit(clientIp, limit)) {
            log.warn("Rate limit exceeded for IP: {} on endpoint: {}", clientIp, requestPath);
            
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write(
                "{\"error\": \"Rate limit exceeded\", \"message\": \"Too many requests. Please try again later.\"}"
            );
            response.getWriter().flush();
            return;
        }

        filterChain.doFilter(request, response);
    }

    /**
     * ✅ Check if request is within rate limit using sliding window algorithm
     */
    private boolean isWithinRateLimit(String clientIp, int limit) {
        long now = Instant.now().getEpochSecond();
        long windowStart = now - windowSizeSeconds;

        RateLimitBucket bucket = requestBuckets.computeIfAbsent(clientIp, k -> new RateLimitBucket());
        
        // ✅ Remove old timestamps outside the window
        bucket.timestamps.removeIf(timestamp -> timestamp < windowStart);
        
        // ✅ Check if limit exceeded
        if (bucket.timestamps.size() >= limit) {
            return false;
        }

        // ✅ Add current request timestamp
        bucket.timestamps.add(now);
        return true;
    }

    /**
     * Extract client IP address from request
     * Handles X-Forwarded-For for proxies
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwarded = request.getHeader("X-Forwarded-For");
        if (xForwarded != null && !xForwarded.isEmpty()) {
            // X-Forwarded-For can contain multiple IPs, get the first one
            return xForwarded.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }

    /**
     * Simple bucket to store timestamps for sliding window
     */
    private static class RateLimitBucket {
        final CopyOnWriteArrayList<Long> timestamps = new CopyOnWriteArrayList<>();
    }
}
