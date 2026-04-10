package com.smartcampus.security;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;

/**
 * ✅ Aspect for Audit Logging critical operations
 * 
 * Intercepts methods annotated with @AuditLog and logs:
 * - User who performed the action
 * - Timestamp
 * - Action and resource type
 * - Method signature
 * - Parameters (if enabled)
 * - Result/Outcome
 * 
 * Output: logs/audit.log (configured in application.properties)
 * Format: [AUDIT] {timestamp} | User: {userId} | Action: {action} | Resource: {resourceType} | Result: {outcome}
 */
@Aspect
@Component
public class AuditLoggingAspect {

    private static final Logger log = LoggerFactory.getLogger(AuditLoggingAspect.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * ✅ Pointcut: Match all methods annotated with @AuditLog
     */
    @Pointcut("@annotation(com.smartcampus.security.AuditLog)")
    public void auditLogPointcut() {
    }

    /**
     * ✅ Before: Log method entry with parameters
     */
    @Before("auditLogPointcut() && @annotation(auditLog)")
    public void logBefore(JoinPoint joinPoint, AuditLog auditLog) {
        String user = getCurrentUser();
        String timestamp = LocalDateTime.now().format(DATE_FORMATTER);
        String methodName = joinPoint.getSignature().getName();

        if (auditLog.logParameters()) {
            String parameters = Arrays.toString(joinPoint.getArgs());
            log.info("[AUDIT] {} | User: {} | Action: {} | Resource: {} | Method: {} | Parameters: {} | Status: INITIATED",
                    timestamp, user, auditLog.action(), auditLog.resourceType(), methodName, parameters);
        } else {
            log.info("[AUDIT] {} | User: {} | Action: {} | Resource: {} | Method: {} | Status: INITIATED",
                    timestamp, user, auditLog.action(), auditLog.resourceType(), methodName);
        }
    }

    /**
     * ✅ AfterReturning: Log successful method execution
     */
    @AfterReturning(pointcut = "auditLogPointcut() && @annotation(auditLog)", returning = "result")
    public void logAfterReturning(JoinPoint joinPoint, AuditLog auditLog, Object result) {
        String user = getCurrentUser();
        String timestamp = LocalDateTime.now().format(DATE_FORMATTER);
        String methodName = joinPoint.getSignature().getName();

        if (auditLog.logResult() && result != null) {
            String resultStr = result.toString().length() > 100 ? 
                result.toString().substring(0, 100) + "..." : result.toString();
            log.info("[AUDIT] {} | User: {} | Action: {} | Resource: {} | Method: {} | Result: {} | Status: SUCCESS",
                    timestamp, user, auditLog.action(), auditLog.resourceType(), methodName, resultStr);
        } else {
            log.info("[AUDIT] {} | User: {} | Action: {} | Resource: {} | Method: {} | Status: SUCCESS",
                    timestamp, user, auditLog.action(), auditLog.resourceType(), methodName);
        }
    }

    /**
     * ✅ AfterThrowing: Log method execution failure
     */
    @AfterThrowing(pointcut = "auditLogPointcut() && @annotation(auditLog)", throwing = "exception")
    public void logAfterThrowing(JoinPoint joinPoint, AuditLog auditLog, Exception exception) {
        String user = getCurrentUser();
        String timestamp = LocalDateTime.now().format(DATE_FORMATTER);
        String methodName = joinPoint.getSignature().getName();

        log.warn("[AUDIT] {} | User: {} | Action: {} | Resource: {} | Method: {} | Error: {} | Status: FAILED",
                timestamp, user, auditLog.action(), auditLog.resourceType(), methodName, exception.getMessage());
    }

    /**
     * ✅ Get current authenticated user
     */
    private String getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            return "ANONYMOUS";
        }

        if (authentication.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails userDetails) {
            return userDetails.getUsername();
        }

        return authentication.getName();
    }
}
