package com.phz.dadaIsland.dto.auth;

/**
 * Response returned after successful authentication or token refresh operations.
 *
 * @param accessToken JWT granting API access
 * @param accessTokenExpiresInSeconds lifetime of the access token in seconds
 * @param refreshToken JWT used to obtain a new access token
 * @param refreshTokenExpiresInSeconds lifetime of the refresh token in seconds
 *
 * @author Phz
 * @since 0.0.1
 */
public record AuthTokenResponse(
		String accessToken,
		long accessTokenExpiresInSeconds,
		String refreshToken,
		long refreshTokenExpiresInSeconds) {
}
