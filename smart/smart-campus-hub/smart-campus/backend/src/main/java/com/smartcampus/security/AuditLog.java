package com.smartcampus.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * ✅ Annotation for audit logging critical operations
 * 
 * Applied to service methods that perform sensitive actions requiring audit trails.
 * Combined with AuditLoggingAspect to automatically log:
 * - User who performed the action
 * - Timestamp of the action
 * - Method name and parameters
 * - Result (success/failure)
 * 
 * Usage:
 * @AuditLog(action = "CREATE_BOOKING", resourceType = "Booking")
 * public void createBooking(Booking booking) { ... }
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface AuditLog {
    
    /**
     * Description of the action being audited
     * Examples: "CREATE_BOOKING", "UPDATE_TICKET", "DELETE_USER", "RESET_PASSWORD"
     */
    String action();
    
    /**
     * Type of resource being modified
     * Examples: "Booking", "Ticket", "User", "Facility"
     */
    String resourceType();
    
    /**
     * Whether to log the method parameters (may contain sensitive data)
     * Default: false (don't log parameters by default)
     */
    boolean logParameters() default false;
    
    /**
     * Whether to log the method return value
     * Default: true (log results by default)
     */
    boolean logResult() default true;
}
