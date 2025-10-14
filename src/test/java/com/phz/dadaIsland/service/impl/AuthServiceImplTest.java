package com.phz.dadaIsland.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

import java.time.Duration;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import com.phz.dadaIsland.domain.model.AuthRefreshToken;
import com.phz.dadaIsland.domain.model.User;
import com.phz.dadaIsland.dto.auth.AuthTokenResponse;
import com.phz.dadaIsland.dto.auth.RegisterRequest;
import com.phz.dadaIsland.exception.BusinessException;
import com.phz.dadaIsland.mapper.AuthRefreshTokenMapper;
import com.phz.dadaIsland.mapper.UserMapper;
import com.phz.dadaIsland.security.JwtTokenProvider;
import com.phz.dadaIsland.security.JwtTokenProvider.TokenType;
import com.phz.dadaIsland.util.TokenHashUtil;
import com.phz.dadaIsland.util.UserIdGenerator;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

	@Mock
	private UserMapper userMapper;
	@Mock
	private UserIdGenerator userIdGenerator;
	@Mock
	private AuthRefreshTokenMapper authRefreshTokenMapper;

	private PasswordEncoder passwordEncoder;
	private JwtTokenProvider jwtTokenProvider;

	@InjectMocks
	private AuthServiceImpl authService;

	@BeforeEach
	void setUp() {
		passwordEncoder = new BCryptPasswordEncoder();

		jwtTokenProvider = new JwtTokenProvider();
		ReflectionTestUtils.setField(jwtTokenProvider, "secretKey",
				"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef");
		ReflectionTestUtils.setField(jwtTokenProvider, "accessTokenMinutes", 15L);
		ReflectionTestUtils.setField(jwtTokenProvider, "refreshTokenDays", 10L);

		authService = new AuthServiceImpl(userMapper, userIdGenerator, passwordEncoder, jwtTokenProvider,
				authRefreshTokenMapper);
	}

	@Test
	void register_GeneratesTokensAndPersistsRefreshToken() {
		RegisterRequest request = new RegisterRequest("18800001111", "user@example.com", "Secret123!", "  ");
		when(userIdGenerator.generate()).thenReturn(1234567890L);
		when(userMapper.findByEmail("user@example.com")).thenReturn(Optional.empty());
		when(userMapper.findByPhoneNumber("18800001111")).thenReturn(Optional.empty(), Optional.of(User.builder()
				.id(42L)
				.userId("1234567890")
				.phoneNumber("18800001111")
				.email("user@example.com")
				.passwordHash("$2a$10$placeholderplaceholderplaceholderplaceholderplatz")
				.build()));

		AuthTokenResponse response = authService.register(request);

		assertThat(response.accessToken()).isNotBlank();
		assertThat(response.refreshToken()).isNotBlank();
		assertThat(response.accessTokenExpiresInSeconds()).isEqualTo(15 * 60);
		assertThat(response.refreshTokenExpiresInSeconds()).isEqualTo(10 * 24 * 60 * 60);
		assertThat(jwtTokenProvider.validateToken(response.accessToken(), TokenType.ACCESS)).isTrue();
		assertThat(jwtTokenProvider.validateToken(response.refreshToken(), TokenType.ACCESS)).isFalse();
		assertThat(jwtTokenProvider.extractTokenType(response.accessToken())).isEqualTo(TokenType.ACCESS);
		assertThat(jwtTokenProvider.extractTokenType(response.refreshToken())).isEqualTo(TokenType.REFRESH);

		ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
		verify(userMapper).insert(userCaptor.capture());
		User insertedUser = userCaptor.getValue();
		assertThat(insertedUser.getDisplayName()).isEqualTo("哒哒");
		assertThat(passwordEncoder.matches("Secret123!", insertedUser.getPasswordHash())).isTrue();

		ArgumentCaptor<AuthRefreshToken> tokenCaptor = ArgumentCaptor.forClass(AuthRefreshToken.class);
		verify(authRefreshTokenMapper).insert(tokenCaptor.capture());
		AuthRefreshToken storedToken = tokenCaptor.getValue();
		assertThat(storedToken.getUserUid()).isEqualTo("1234567890");
		assertThat(storedToken.getUserId()).isEqualTo(42L);
		assertThat(storedToken.getRevokedAt()).isNull();
		assertThat(storedToken.getIssuedAt()).isNotNull();
		assertThat(storedToken.getExpiresAt()).isNotNull();
		assertThat(Duration.between(storedToken.getIssuedAt(), storedToken.getExpiresAt()))
				.isBetween(Duration.ofDays(9), Duration.ofDays(11));
		assertThat(storedToken.getTokenHash()).isEqualTo(TokenHashUtil.sha256Hex(response.refreshToken()));

		var claimsPk = jwtTokenProvider.extractUserPk(response.accessToken());
		var claimsUid = jwtTokenProvider.extractUserUid(response.accessToken());
		assertThat(claimsPk).isEqualTo(42L);
		assertThat(claimsUid).isEqualTo("1234567890");
	}

	@Test
	void register_ThrowsWhenEmailExists() {
		RegisterRequest request = new RegisterRequest("18800002222", "dup@example.com", "Secret123!", "Name");
		when(userMapper.findByEmail("dup@example.com")).thenReturn(Optional.of(new User()));

		assertThrows(BusinessException.class, () -> authService.register(request));

		verify(userMapper, never()).insert(any());
		verify(authRefreshTokenMapper, never()).insert(any());
	}

	@Test
	void register_ThrowsWhenPhoneExists() {
		RegisterRequest request = new RegisterRequest("18800003333", null, "Secret123!", "Name");
		when(userMapper.findByPhoneNumber("18800003333")).thenReturn(Optional.of(new User()));

		assertThrows(BusinessException.class, () -> authService.register(request));

		verify(userMapper, never()).insert(any());
		verify(authRefreshTokenMapper, never()).insert(any());
	}
}
