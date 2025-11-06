package com.phz.dadaIsland.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.phz.dadaIsland.domain.enums.UserStatus;
import com.phz.dadaIsland.domain.model.AuthRefreshToken;
import com.phz.dadaIsland.domain.model.User;
import com.phz.dadaIsland.dto.auth.AuthTokenResponse;
import com.phz.dadaIsland.dto.auth.LoginRequest;
import com.phz.dadaIsland.exception.BusinessException;
import com.phz.dadaIsland.mapper.AuthRefreshTokenMapper;
import com.phz.dadaIsland.mapper.UserMapper;
import com.phz.dadaIsland.security.JwtTokenProvider;
import com.phz.dadaIsland.util.TokenHashUtil;
import com.phz.dadaIsland.util.UserIdGenerator;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

	@Mock
	private UserMapper userMapper;

	@Mock
	private UserIdGenerator userIdGenerator;

	@Mock
	private PasswordEncoder passwordEncoder;

	@Mock
	private JwtTokenProvider jwtTokenProvider;

	@Mock
	private AuthRefreshTokenMapper authRefreshTokenMapper;

	private AuthServiceImpl authService;

	@BeforeEach
	void setUp() {
		authService = new AuthServiceImpl(
				userMapper,
				userIdGenerator,
				passwordEncoder,
				jwtTokenProvider,
				authRefreshTokenMapper);
	}

	@Test
	void loginReturnsTokensWhenCredentialsValid() {
		LoginRequest request = new LoginRequest("  +1234567890  ", "password");
		User user = User.builder()
				.id(42L)
				.userId("U123")
				.phoneNumber("+1234567890")
				.passwordHash("hashed")
				.status(UserStatus.ACTIVE)
				.build();

		when(userMapper.findByPhoneNumber("+1234567890")).thenReturn(Optional.of(user));
		when(passwordEncoder.matches("password", "hashed")).thenReturn(true);
		when(jwtTokenProvider.generateAccessToken("+1234567890", 42L, "U123")).thenReturn("access-token");
		when(jwtTokenProvider.getAccessTokenTtlSeconds()).thenReturn(900L);
		when(jwtTokenProvider.generateRefreshToken("+1234567890", 42L, "U123")).thenReturn("refresh-token");
		when(jwtTokenProvider.getRefreshTokenTtlSeconds()).thenReturn(86_400L);

		AuthTokenResponse response = authService.login(request);

		assertEquals("access-token", response.accessToken());
		assertEquals(900L, response.accessTokenExpiresInSeconds());
		assertEquals("refresh-token", response.refreshToken());
		assertEquals(86_400L, response.refreshTokenExpiresInSeconds());

		verify(authRefreshTokenMapper).insert(argThat(token -> {
			assertEquals(42L, token.getUserId());
			assertEquals("U123", token.getUserUid());
			assertEquals(TokenHashUtil.sha256Hex("refresh-token"), token.getTokenHash());
			assertNotNull(token.getIssuedAt());
			assertNotNull(token.getExpiresAt());
			return true;
		}));
	}

	@Test
	void loginThrowsWhenUserNotFound() {
		when(userMapper.findByPhoneNumber("+999")).thenReturn(Optional.empty());
		LoginRequest request = new LoginRequest("+999", "password");

		assertThrows(BusinessException.class, () -> authService.login(request));

		verify(authRefreshTokenMapper, never()).insert(any(AuthRefreshToken.class));
	}

	@Test
	void loginThrowsWhenAccountNotActive() {
		User user = User.builder()
				.id(11L)
				.userId("U999")
				.phoneNumber("+111")
				.passwordHash("hashed")
				.status(UserStatus.SUSPENDED)
				.build();
		when(userMapper.findByPhoneNumber("+111")).thenReturn(Optional.of(user));

		LoginRequest request = new LoginRequest("+111", "password");

		assertThrows(BusinessException.class, () -> authService.login(request));

		verify(passwordEncoder, never()).matches("password", "hashed");
		verify(authRefreshTokenMapper, never()).insert(any(AuthRefreshToken.class));
	}

	@Test
	void loginThrowsWhenPasswordDoesNotMatch() {
		User user = User.builder()
				.id(21L)
				.userId("U555")
				.phoneNumber("+222")
				.passwordHash("hashed")
				.status(UserStatus.ACTIVE)
				.build();
		when(userMapper.findByPhoneNumber("+222")).thenReturn(Optional.of(user));
		when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

		LoginRequest request = new LoginRequest("+222", "wrong");

		assertThrows(BusinessException.class, () -> authService.login(request));

		verify(jwtTokenProvider, never()).generateAccessToken(anyString(), anyLong(), anyString());
		verify(authRefreshTokenMapper, never()).insert(any(AuthRefreshToken.class));
	}
}
