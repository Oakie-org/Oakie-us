package com.phz.dadaIsland.mapper;

import java.time.LocalDateTime;
import java.util.Optional;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.phz.dadaIsland.domain.model.AuthRefreshToken;

@Mapper
public interface AuthRefreshTokenMapper {

	void insert(AuthRefreshToken token);

	Optional<AuthRefreshToken> findActiveByHash(@Param("tokenHash") String tokenHash, @Param("now") LocalDateTime now);

	void revokeById(@Param("id") Long id, @Param("revokedAt") LocalDateTime revokedAt);
}
