package com.phz.dadaIsland.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record RegisterRequest(
		@NotBlank(message = "Phone number is required") String phoneNumber,
		@Email(message = "Email format is invalid") String email,
		@NotBlank(message = "Password cannot be empty") String password,
		String displayName
		) {
}
