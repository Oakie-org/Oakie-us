package com.phz.dadaIsland.service;

import com.phz.dadaIsland.dto.auth.AuthTokenResponse;
import com.phz.dadaIsland.dto.auth.LoginRequest;
import com.phz.dadaIsland.dto.auth.RefreshTokenRequest;
import com.phz.dadaIsland.dto.auth.RegisterRequest;

public interface AuthService {

	AuthTokenResponse register(RegisterRequest request);

	AuthTokenResponse login(LoginRequest request);

	AuthTokenResponse refreshToken(RefreshTokenRequest request);
}
