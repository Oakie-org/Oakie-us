package com.phz.dadaIsland.mapper;

import java.util.Optional;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.phz.dadaIsland.domain.model.AuthRefreshToken;

@Mapper
public interface AuthRefreshTokenMapper {

	void insert(AuthRefreshToken token);

	Optional<AuthRefreshToken> findByTokenHash(@Param("tokenHash") String tokenHash);

	void revoke(@Param("tokenHash") String tokenHash);

	void deleteExpired();
}
