package com.codeflow.dto;

public class AuthResponse {
    private String token;
    private String email;
    private String preferredLanguage;
    private String message;

    public AuthResponse() {}

    public AuthResponse(String token, String email, String preferredLanguage, String message) {
        this.token = token;
        this.email = email;
        this.preferredLanguage = preferredLanguage;
        this.message = message;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPreferredLanguage() { return preferredLanguage; }
    public void setPreferredLanguage(String preferredLanguage) { this.preferredLanguage = preferredLanguage; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
