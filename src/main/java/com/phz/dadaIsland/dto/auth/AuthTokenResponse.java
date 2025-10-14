package com.phz.dadaIsland.dto.auth;

public record AuthTokenResponse(
		String accessToken,
		long accessTokenExpiresInSeconds,
		String refreshToken,
		long refreshTokenExpiresInSeconds) {
}
