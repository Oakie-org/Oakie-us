package com.phz.dadaIsland.controller;

import com.phz.dadaIsland.dto.auth.LoginRequest;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.phz.dadaIsland.dto.auth.AuthTokenResponse;
import com.phz.dadaIsland.dto.auth.LoginRequest;
import com.phz.dadaIsland.dto.auth.RegisterRequest;
import com.phz.dadaIsland.service.AuthService;

@Validated
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

	private final AuthService authService;

	@PostMapping("/register")
	public ResponseEntity<Void> register(@RequestBody RegisterRequest request) {
		authService.register(request);
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
	}

	@PostMapping("/login")
	public ResponseEntity<AuthTokenResponse> login(@RequestBody @Validated LoginRequest request) {
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(authService.login(request));
	}
}
