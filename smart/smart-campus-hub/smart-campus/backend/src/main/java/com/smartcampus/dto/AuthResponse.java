package com.smartcampus.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Set;

@Data
@NoArgsConstructor
public class AuthResponse {
    private String token;
    private String id;
    private String name;
    private String email;
    private String avatarUrl;
    private Set<String> roles;

    public AuthResponse(String token, String id, String name, String email, String avatarUrl, Set<String> roles) {
        this.token = token;
        this.id = id;
        this.name = name;
        this.email = email;
        this.avatarUrl = avatarUrl;
        this.roles = roles;
    }
}
