package com.phz.dadaIsland.dto.auth;

import jakarta.validation.constraints.NotBlank;

/**
 * Payload describing a password-based login attempt initiated by a client.
 *
 * @param phoneNumber phone number used as the login identifier
 * @param password plaintext password submitted by the user
 *
 * @author Phz
 * @since 0.0.1
 */
public record LoginRequest(
        @NotBlank(message = "Phone number must be provided") String phoneNumber,
        @NotBlank(message = "Password cannot be empty") String password) {
}
