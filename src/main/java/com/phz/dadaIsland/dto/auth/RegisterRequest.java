package com.phz.dadaIsland.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Payload describing a client request to create a new user account.
 *
 * @param phoneNumber phone number used as the primary unique identifier
 * @param email optional email address used for communication and login
 * @param password plaintext password to be hashed and stored
 * @param displayName optional display name presented to other users
 *
 * @author Phz
 * @since 0.0.1
 */
public record RegisterRequest(
		@NotBlank(message = "Phone number is required") String phoneNumber,
		@Email(message = "Email format is invalid") String email,
		@NotBlank(message = "Password cannot be empty") String password,
		@NotBlank(message = "OTP code is required") String otpCode,
		String displayName
		) {
}
