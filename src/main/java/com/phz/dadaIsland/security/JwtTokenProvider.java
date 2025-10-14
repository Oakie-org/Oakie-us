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

	public enum TokenType {
		ACCESS,
		REFRESH
	}

	private static final String TOKEN_TYPE_CLAIM = "token_type";
	@Value("${security.jwt.secret-key:sNw4cLuq98ejjEV/oBQ3vqKsA7ZCd7+AjYICCcRFgcg=}")
	private String secretKey;

	@Value("${security.jwt.access-token-minutes:60}")
	private long accessTokenMinutes;

	@Value("${security.jwt.refresh-token-days:7}")
	private long refreshTokenDays;

	public String generateAccessToken(String subject, long userPk, String userUid) {
		return buildToken(subject, userPk, userUid, accessTokenMinutes, ChronoUnit.MINUTES, TokenType.ACCESS);
	}

	public String generateRefreshToken(String subject, long userPk, String userUid) {
		return buildToken(subject, userPk, userUid, refreshTokenDays, ChronoUnit.DAYS, TokenType.REFRESH);
	}

	private String buildToken(String subject, long userPk, String userUid, long amount, ChronoUnit unit, TokenType tokenType) {
		Instant now = Instant.now();
		var builder = Jwts.builder()
				.subject(subject)
				.issuedAt(Date.from(now))
				.expiration(Date.from(now.plus(amount, unit)))
				.claim(TOKEN_TYPE_CLAIM, tokenType.name());
		builder.claim("pid", userPk);
		if (userUid != null) {
			builder.claim("uid", userUid);
		}
		return builder
				.signWith(Keys.hmacShaKeyFor(secretKey.getBytes()))
				.compact();
	}

	public boolean validateToken(String token) {
		return validateToken(token, null);
	}

	public boolean validateToken(String token, TokenType expectedType) {
		try {
			Claims claims = parseClaims(token);
			if (expectedType != null) {
				String tokenType = claims.get(TOKEN_TYPE_CLAIM, String.class);
				if (tokenType == null || !expectedType.name().equalsIgnoreCase(tokenType)) {
					return false;
				}
			}
			return true;
		} catch (Exception ex) {
			// TODO add structured logging
			return false;
		}
	}

	public String extractSubject(String token) {
		Claims claims = parseClaims(token);
		return claims.getSubject();
	}

	public Long extractUserPk(String token) {
		Claims claims = parseClaims(token);
		Object value = claims.get("pid");
		if (value instanceof Number number) {
			return number.longValue();
		}
		return null;
	}

	public String extractUserUid(String token) {
		Claims claims = parseClaims(token);
		return claims.get("uid", String.class);
	}

	public TokenType extractTokenType(String token) {
		Claims claims = parseClaims(token);
		String tokenType = claims.get(TOKEN_TYPE_CLAIM, String.class);
		if (tokenType == null) {
			return null;
		}
		try {
			return TokenType.valueOf(tokenType.toUpperCase());
		} catch (IllegalArgumentException ex) {
			return null;
		}
	}

	public long getAccessTokenTtlSeconds() {
		return accessTokenMinutes * 60;
	}

	public long getRefreshTokenTtlSeconds() {
		return refreshTokenDays * 24 * 60 * 60;
	}

	private Claims parseClaims(String token) {
		return Jwts.parser()
				.verifyWith(Keys.hmacShaKeyFor(secretKey.getBytes()))
				.build()
				.parseSignedClaims(token)
				.getPayload();
	}
}
