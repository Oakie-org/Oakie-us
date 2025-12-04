package com.phz.dadaIsland.dto.auth;

import jakarta.validation.constraints.NotBlank;

/**
 * Request payload for initiating an OTP to a phone number.
 *
 * @param phoneNumber phone number receiving the OTP
 */
public record SendOtpRequest(
		@NotBlank(message = "Phone number is required") String phoneNumber) {
}
