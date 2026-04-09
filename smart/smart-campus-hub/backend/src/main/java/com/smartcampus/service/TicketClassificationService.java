package com.smartcampus.service;

import com.smartcampus.model.Ticket;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class TicketClassificationService {

    public TicketClassification classify(String title, String description, String location, String existingCategory, String existingPriority) {
        String normalizedCategory = normalizeText(existingCategory);
        Ticket.Priority normalizedPriority = parsePriority(existingPriority);

        if (normalizedCategory != null && normalizedPriority != null) {
            return new TicketClassification(normalizedCategory, normalizedPriority);
        }

        String text = buildText(title, description, location);

        String category = normalizedCategory != null ? normalizedCategory : detectCategory(text);
        Ticket.Priority priority = normalizedPriority != null ? normalizedPriority : detectPriority(text, category);

        return new TicketClassification(category, priority);
    }

    private String buildText(String title, String description, String location) {
        return (safe(title) + " " + safe(description) + " " + safe(location)).toLowerCase(Locale.ROOT);
    }

    private String detectCategory(String text) {
        if (containsAny(text, "wifi", "network", "internet", "computer", "pc", "laptop", "projector", "printer", "monitor", "software", "login", "system", "server")) {
            return "IT Equipment";
        }
        if (containsAny(text, "electric", "power", "light", "socket", "outlet", "voltage", "switch", "generator", "short circuit", "wiring")) {
            return "Electrical";
        }
        if (containsAny(text, "water", "pipe", "leak", "toilet", "washroom", "sink", "drain", "tap", "flood", "plumbing")) {
            return "Plumbing";
        }
        if (containsAny(text, "ac", "air conditioning", "hvac", "cooling", "ventilation", "temperature", "fan")) {
            return "HVAC";
        }
        if (containsAny(text, "chair", "desk", "table", "door", "window", "locker", "furniture", "broken seat")) {
            return "Furniture";
        }
        if (containsAny(text, "dirty", "garbage", "trash", "clean", "stain", "odor", "smell", "wash", "spill")) {
            return "Cleaning";
        }
        if (containsAny(text, "fire", "smoke", "sparks", "security", "unsafe", "danger", "hazard", "emergency", "injury", "alarm", "theft")) {
            return "Safety";
        }
        return "Other";
    }

    private Ticket.Priority detectPriority(String text, String category) {
        if (containsAny(text, "fire", "smoke", "sparks", "emergency", "urgent", "immediately", "asap", "injury", "danger", "unsafe", "flood", "gas leak", "security breach")) {
            return Ticket.Priority.CRITICAL;
        }

        if (containsAny(text, "down", "not working", "broken", "failed", "failure", "offline", "no power", "cannot access", "won't start", "wont start", "leaking", "overflow")) {
            if ("Safety".equals(category) || "Electrical".equals(category) || "Plumbing".equals(category) || "HVAC".equals(category)) {
                return Ticket.Priority.HIGH;
            }
        }

        if (containsAny(text, "projector", "network", "internet", "wifi", "ac", "air conditioning", "toilet", "water", "leak", "broken", "urgent", "important")) {
            return Ticket.Priority.HIGH;
        }

        if (containsAny(text, "slow", "noise", "intermittent", "damaged", "issue", "problem", "cleaning", "repair")) {
            return Ticket.Priority.MEDIUM;
        }

        return Ticket.Priority.LOW;
    }

    private Ticket.Priority parsePriority(String value) {
        String normalized = normalizeText(value);
        if (normalized == null) {
            return null;
        }
        try {
            return Ticket.Priority.valueOf(normalized.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty() || "AUTO".equalsIgnoreCase(trimmed) || "AUTO-DETECT".equalsIgnoreCase(trimmed)) {
            return null;
        }
        return trimmed;
    }

    private boolean containsAny(String text, String... terms) {
        for (String term : terms) {
            if (text.contains(term)) {
                return true;
            }
        }
        return false;
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    public record TicketClassification(String category, Ticket.Priority priority) {
    }
}
