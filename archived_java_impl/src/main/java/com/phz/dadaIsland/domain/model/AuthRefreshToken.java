package com.phz.dadaIsland.domain.model;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthRefreshToken {

	private Long id;
	private Long userId;
	private String userUid;
	private String tokenHash;
	private LocalDateTime issuedAt;
	private LocalDateTime expiresAt;
	private LocalDateTime revokedAt;
	private String metadata;
}
