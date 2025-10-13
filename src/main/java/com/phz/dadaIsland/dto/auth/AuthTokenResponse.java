package com.phz.dadaIsland.dto.auth;

public record AuthTokenResponse(
		String accessToken,
		String refreshToken,
		long expiresInSeconds) {
}
