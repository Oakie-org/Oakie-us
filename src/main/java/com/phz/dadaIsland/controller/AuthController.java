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

@Validated
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

	private final AuthService authService;

	@PostMapping("/register")
	public ResponseEntity<AuthTokenResponse> register(@RequestBody @Validated RegisterRequest request) {
		AuthTokenResponse response = authService.register(request);
		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

	@PostMapping("/login")
	public ResponseEntity<AuthTokenResponse> login(@RequestBody @Validated LoginRequest request) {
		AuthTokenResponse response = authService.login(request);
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(response);
	}

	@PostMapping("/refresh")
	public ResponseEntity<AuthTokenResponse> refresh(@RequestBody @Validated RefreshTokenRequest request) {
		AuthTokenResponse response = authService.refreshToken(request);
		return ResponseEntity.ok(response);
	}
}
