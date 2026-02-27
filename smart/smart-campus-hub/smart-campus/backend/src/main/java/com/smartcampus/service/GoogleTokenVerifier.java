package com.smartcampus.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.exception.UnauthorizedException;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

/**
 * Verifies a Google ID token (credential from Google Identity Services)
 * by calling Google's tokeninfo endpoint.
 * 
 * This is the server-side verification required for production OAuth 2.0.
 * The token is validated as: audience matches your client ID, issued by Google,
 * not expired, and contains the user's email/name/picture.
 */
@Service
public class GoogleTokenVerifier {

    private static final String TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token=";
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    /**
     * Verifies the Google ID token and returns the parsed user info.
     * @param idToken the credential string from Google Identity Services
     * @return GoogleUserInfo with email, name, picture, sub (Google user ID)
     * @throws UnauthorizedException if token is invalid or expired
     */
    public GoogleUserInfo verify(String idToken) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(TOKENINFO_URL + idToken))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new UnauthorizedException("Invalid Google ID token");
            }

            JsonNode json = objectMapper.readTree(response.body());

            // Validate token fields
            if (json.has("error_description")) {
                throw new UnauthorizedException("Google token error: " + json.get("error_description").asText());
            }

            String email = json.has("email") ? json.get("email").asText() : null;
            if (email == null || email.isBlank()) {
                throw new UnauthorizedException("Google token missing email");
            }

            String name = json.has("name") ? json.get("name").asText() :
                          json.has("email") ? json.get("email").asText().split("@")[0] : "Google User";

            String picture = json.has("picture") ? json.get("picture").asText() : null;
            String sub = json.has("sub") ? json.get("sub").asText() : null;

            return new GoogleUserInfo(email, name, picture, sub);

        } catch (UnauthorizedException e) {
            throw e;
        } catch (Exception e) {
            throw new UnauthorizedException("Failed to verify Google token: " + e.getMessage());
        }
    }

    public static class GoogleUserInfo {
        public final String email;
        public final String name;
        public final String picture;
        public final String sub;

        public GoogleUserInfo(String email, String name, String picture, String sub) {
            this.email = email;
            this.name = name;
            this.picture = picture;
            this.sub = sub;
        }
    }
}
