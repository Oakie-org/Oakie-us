package com.phz.dadaIsland.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.phz.dadaIsland.dto.auth.AuthTokenResponse;
import com.phz.dadaIsland.dto.auth.LoginRequest;
import com.phz.dadaIsland.dto.auth.RefreshTokenRequest;
import com.phz.dadaIsland.dto.auth.RegisterRequest;
import com.phz.dadaIsland.service.AuthService;

import lombok.RequiredArgsConstructor;

/**
 * REST endpoints for managing user authentication flows such as registration, login,
 * and token refresh operations.
 *
 * @author Phz
 * @since 0.0.1
 */
@Validated
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

	private final AuthService authService;

	/**
	 * Registers a new account and issues the first set of tokens.
	 *
	 * @param request validated registration payload
	 * @return newly minted access and refresh tokens
	 */
	@PostMapping("/register")
	public ResponseEntity<AuthTokenResponse> register(@RequestBody @Validated RegisterRequest request) {
		AuthTokenResponse response = authService.register(request);
		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

	/**
	 * Authenticates an existing account via phone number and password.
	 *
	 * @param request validated login payload
	 * @return access and refresh tokens tied to the authenticated user
	 */
	@PostMapping("/login")
	public ResponseEntity<AuthTokenResponse> login(@RequestBody @Validated LoginRequest request) {
		AuthTokenResponse response = authService.login(request);
		return ResponseEntity.status(HttpStatus.OK).body(response);
	}

	/**
	 * Exchanges a valid refresh token for a new token pair.
	 *
	 * @param request refresh token payload
	 * @return renewed access and refresh tokens
	 */
	@PostMapping("/refresh")
	public ResponseEntity<AuthTokenResponse> refresh(@RequestBody @Validated RefreshTokenRequest request) {
		AuthTokenResponse response = authService.refreshToken(request);
		return ResponseEntity.ok(response);
	}
}
