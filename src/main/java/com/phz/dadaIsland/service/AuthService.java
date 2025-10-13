package com.phz.dadaIsland.service;

import com.phz.dadaIsland.dto.auth.AuthTokenResponse;
import com.phz.dadaIsland.dto.auth.LoginRequest;
import com.phz.dadaIsland.dto.auth.RegisterRequest;

public interface AuthService {

	void register(RegisterRequest request);

	AuthTokenResponse login(LoginRequest request);
}
