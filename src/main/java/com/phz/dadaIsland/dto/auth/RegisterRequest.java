package com.phz.dadaIsland.dto.auth;

public record RegisterRequest(
		String email,
		String password,
		String displayName,
		String city,
		String school) {
}
