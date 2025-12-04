package com.phz.dadaIsland.dto.auth;

import jakarta.validation.constraints.NotBlank;

/**
 * Payload sent by clients to exchange a refresh token for a new token pair.
 *
 * @param refreshToken refresh token previously issued to the client
 *
 * @author Phz
 * @since 0.0.1
 */
public record RefreshTokenRequest(
		@NotBlank(message = "Refresh token is required") String refreshToken) {
}
