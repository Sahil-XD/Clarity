package com.clarity.service;

import com.clarity.dto.AuthDto;
import com.clarity.model.User;
import com.clarity.repository.UserRepository;
import com.clarity.security.JwtUtil;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    @Value("${clarity.google.client-id}")
    private String googleClientId;

    public AuthDto.TokenResponse register(AuthDto.RegisterRequest req) {
        if (userRepository.existsByUsername(req.getUsername()))
            throw new IllegalArgumentException("Username already taken");
        if (userRepository.existsByEmail(req.getEmail()))
            throw new IllegalArgumentException("Email already registered");

        User user = User.builder()
                .username(req.getUsername())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .authProvider("LOCAL")
                .build();
        userRepository.save(user);

        return new AuthDto.TokenResponse(
                jwtUtil.generateToken(user),
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getAvatarUrl()
        );
    }

    public AuthDto.TokenResponse login(AuthDto.LoginRequest req) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword()));

        User user = userRepository.findByUsername(req.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return new AuthDto.TokenResponse(
                jwtUtil.generateToken(user),
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getAvatarUrl()
        );
    }

    public AuthDto.TokenResponse googleLogin(String idToken) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken googleToken = verifier.verify(idToken);
            if (googleToken == null) {
                throw new IllegalArgumentException("Invalid Google ID token");
            }

            GoogleIdToken.Payload payload = googleToken.getPayload();
            String googleId = payload.getSubject();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");

            // Find by googleId first, then by email (to link existing accounts)
            User user = userRepository.findByGoogleId(googleId)
                    .or(() -> userRepository.findByEmail(email))
                    .orElse(null);

            if (user == null) {
                // Create new Google user
                String username = email.split("@")[0];
                // Ensure unique username
                if (userRepository.existsByUsername(username)) {
                    username = username + "_" + googleId.substring(0, 6);
                }
                user = User.builder()
                        .username(username)
                        .email(email)
                        .googleId(googleId)
                        .avatarUrl(pictureUrl)
                        .authProvider("GOOGLE")
                        .password(null)
                        .build();
                userRepository.save(user);
            } else {
                // Link Google account if not already linked
                if (user.getGoogleId() == null) {
                    user.setGoogleId(googleId);
                    user.setAuthProvider("GOOGLE");
                }
                if (pictureUrl != null) {
                    user.setAvatarUrl(pictureUrl);
                }
                userRepository.save(user);
            }

            return new AuthDto.TokenResponse(
                    jwtUtil.generateToken(user),
                    user.getId(),
                    user.getUsername(),
                    user.getEmail(),
                    user.getAvatarUrl()
            );
        } catch (Exception e) {
            throw new IllegalArgumentException("Google authentication failed: " + e.getMessage());
        }
    }
}
