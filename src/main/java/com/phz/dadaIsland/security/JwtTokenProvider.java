package com.phz.dadaIsland.security;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtTokenProvider {

	@Value("${security.jwt.secret-key:change-me}")
	private String secretKey;

	@Value("${security.jwt.expiration-minutes:60}")
	private long expirationMinutes;

	public String generateToken(String subject) {
		Instant now = Instant.now();
		return Jwts.builder()
				.subject(subject)
				.issuedAt(Date.from(now))
				.expiration(Date.from(now.plus(expirationMinutes, ChronoUnit.MINUTES)))
				.signWith(Keys.hmacShaKeyFor(secretKey.getBytes()))
				.compact();
	}

	public boolean validateToken(String token) {
		try {
			Jwts.parser()
					.verifyWith(Keys.hmacShaKeyFor(secretKey.getBytes()))
					.build()
					.parseSignedClaims(token);
			return true;
		} catch (Exception ex) {
			// TODO add structured logging
			return false;
		}
	}

	public String extractSubject(String token) {
		Claims claims = Jwts.parser()
				.verifyWith(Keys.hmacShaKeyFor(secretKey.getBytes()))
				.build()
				.parseSignedClaims(token)
				.getPayload();
		return claims.getSubject();
	}
}
