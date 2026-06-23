package com.codeflow.service;

import com.codeflow.dto.AuthResponse;
import com.codeflow.dto.LoginRequest;
import com.codeflow.dto.SignupRequest;
import com.codeflow.model.User;
import com.codeflow.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Base64;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse signup(SignupRequest request) {
        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("An account with this email already exists.");
        }

        // Hash password and save user
        String hashedPassword = passwordEncoder.encode(request.getPassword());
        User user = new User(request.getEmail(), hashedPassword, request.getPreferredLanguage());
        userRepository.save(user);

        // Generate simple token (in production, use JWT)
        String token = generateToken(user.getEmail());

        return new AuthResponse(token, user.getEmail(), user.getPreferredLanguage(), "Account created successfully!");
    }

    public AuthResponse login(LoginRequest request) {
        // Find user by email
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("No account found with this email."));

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid password. Please try again.");
        }

        // Generate token
        String token = generateToken(user.getEmail());

        return new AuthResponse(token, user.getEmail(), user.getPreferredLanguage(), "Login successful!");
    }

    private String generateToken(String email) {
        // Simple token generation (use JWT library for production)
        String raw = email + ":" + UUID.randomUUID().toString() + ":" + System.currentTimeMillis();
        return Base64.getEncoder().encodeToString(raw.getBytes());
    }
}
