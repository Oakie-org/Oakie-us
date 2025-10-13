package com.phz.dadaIsland.service.impl;

import org.springframework.stereotype.Service;

import com.phz.dadaIsland.dto.auth.AuthTokenResponse;
import com.phz.dadaIsland.dto.auth.LoginRequest;
import com.phz.dadaIsland.dto.auth.RegisterRequest;
import com.phz.dadaIsland.service.AuthService;

@Service
public class AuthServiceImpl implements AuthService {

	@Override
	public void register(RegisterRequest request) {
		// TODO implement registration workflow
	}

	@Override
	public AuthTokenResponse login(LoginRequest request) {
		// TODO implement login workflow
		return null;
	}
}
