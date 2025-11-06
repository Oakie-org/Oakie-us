package com.phz.dadaIsland.service;

import com.phz.dadaIsland.dto.auth.AuthTokenResponse;
import com.phz.dadaIsland.dto.auth.LoginRequest;
import com.phz.dadaIsland.dto.auth.RefreshTokenRequest;
import com.phz.dadaIsland.dto.auth.RegisterRequest;

/**
 * Contract for authentication use cases including registration, login, and token refresh.
 * Implementations encapsulate credential verification and token issuance logic.
 *
 * @author Phz
 * @since 0.0.1
 */
public interface AuthService {

	/**
	 * Registers a new user and returns an initial token pair.
	 *
	 * @param request registration payload
	 * @return access and refresh tokens for the created user
	 */
	AuthTokenResponse register(RegisterRequest request);

	/**
	 * Authenticates an existing user with password credentials.
	 *
	 * @param request login payload
	 * @return access and refresh tokens for the authenticated user
	 */
	AuthTokenResponse login(LoginRequest request);

	/**
	 * Replaces an existing refresh token with a new access/refresh pair.
	 *
	 * @param request refresh token payload
	 * @return renewed access and refresh tokens
	 */
	AuthTokenResponse refreshToken(RefreshTokenRequest request);
}
