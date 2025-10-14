package com.phz.dadaIsland.service.impl;

import java.time.LocalDateTime;
import java.util.regex.Pattern;

import com.phz.dadaIsland.domain.model.AuthRefreshToken;
import com.phz.dadaIsland.domain.model.User;
import com.phz.dadaIsland.mapper.AuthRefreshTokenMapper;
import com.phz.dadaIsland.mapper.UserMapper;
import com.phz.dadaIsland.dto.auth.AuthTokenResponse;
import com.phz.dadaIsland.dto.auth.LoginRequest;
import com.phz.dadaIsland.dto.auth.RegisterRequest;
import com.phz.dadaIsland.dto.auth.RefreshTokenRequest;
import com.phz.dadaIsland.exception.BusinessException;
import com.phz.dadaIsland.security.JwtTokenProvider;
import com.phz.dadaIsland.service.AuthService;
import com.phz.dadaIsland.util.TokenHashUtil;
import com.phz.dadaIsland.util.UserIdGenerator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
public class AuthServiceImpl implements AuthService {

	private static final Pattern EMAIL_PATTERN = Pattern
			.compile("^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$", Pattern.CASE_INSENSITIVE);
	private static final Pattern PHONE_PATTERN = Pattern.compile("^\\+?[0-9]{7,15}$");
	private static final int MIN_PASSWORD_LENGTH = 8;
	private static final int MAX_DISPLAY_NAME_LENGTH = 50;
	private final UserMapper userMapper;
    private final UserIdGenerator userIdGenerator;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthRefreshTokenMapper authRefreshTokenMapper;
	private static final String DEFAULT_NICKNAME = "哒哒";


    public AuthServiceImpl(UserMapper userMapper,
            UserIdGenerator userIdGenerator,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider,
            AuthRefreshTokenMapper authRefreshTokenMapper) {
        this.userMapper = userMapper;
        this.userIdGenerator = userIdGenerator;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.authRefreshTokenMapper = authRefreshTokenMapper;
    }


	@Override
	@Transactional
	public AuthTokenResponse register(RegisterRequest request) {
		validateRegisterRequest(request);

		String phoneNumber = normalize(request.phoneNumber());
		String email = normalize(request.email());
		if (email != null && userMapper.findByEmail(email).isPresent()) {
			log.debug("Email {} is already registered", email);
			throw new BusinessException("Email is already registered");
		}
		if (userMapper.findByPhoneNumber(phoneNumber).isPresent()) {
			log.debug("Phone number {} is already registered", phoneNumber);
			throw new BusinessException("Phone number is already registered");

		}
        String normalizedDisplayName = normalize(request.displayName());
        String displayName = normalizedDisplayName != null ? normalizedDisplayName : DEFAULT_NICKNAME;
        String passwordHash = passwordEncoder.encode(request.password());
        String userUid = String.valueOf(userIdGenerator.generate());

        User user = User.builder()
                .userId(userUid)
                .phoneNumber(phoneNumber)
                .email(email)
                .displayName(displayName)
                .passwordHash(passwordHash)
                .build();

        userMapper.insert(user);

        User persistedUser = userMapper.findByPhoneNumber(phoneNumber)
                .orElseThrow(() -> new IllegalStateException("Failed to load persisted user for phone: " + phoneNumber));

		String subject = email != null ? email : phoneNumber;
		Long userPk = persistedUser.getId();
		if (userPk == null) {
			throw new IllegalStateException("Persisted user must have database id");
		}
		String accessToken = jwtTokenProvider.generateAccessToken(subject, userPk, userUid);
		long accessTtl = jwtTokenProvider.getAccessTokenTtlSeconds();
		String refreshToken = jwtTokenProvider.generateRefreshToken(subject, userPk, userUid);
		long refreshTtl = jwtTokenProvider.getRefreshTokenTtlSeconds();

		persistRefreshToken(persistedUser, userUid, refreshToken, refreshTtl);

        return new AuthTokenResponse(accessToken, accessTtl, refreshToken, refreshTtl);
    }

    private void persistRefreshToken(User user, String userUid, String refreshToken, long refreshTtlSeconds) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusSeconds(refreshTtlSeconds);
        String tokenHash = TokenHashUtil.sha256Hex(refreshToken);
        AuthRefreshToken entity = AuthRefreshToken.builder()
                .userId(user.getId())
                .userUid(userUid)
                .tokenHash(tokenHash)
                .issuedAt(now)
                .expiresAt(expiresAt)
                .build();
        authRefreshTokenMapper.insert(entity);
    }

	@Override
	public AuthTokenResponse login(LoginRequest request) {
		// TODO implement login workflow
		return null;
	}

	@Override
	@Transactional
	public AuthTokenResponse refreshToken(RefreshTokenRequest request) {
		if (request == null || request.refreshToken() == null || request.refreshToken().isBlank()) {
			throw new BusinessException("Refresh token is required");
		}
		LocalDateTime now = LocalDateTime.now();
		String tokenHash = TokenHashUtil.sha256Hex(request.refreshToken());
		var existingToken = authRefreshTokenMapper.findActiveByHash(tokenHash, now)
			.orElseThrow(() -> new BusinessException("Refresh token is invalid or expired"));
		authRefreshTokenMapper.revokeById(existingToken.getId(), now);
		User user = userMapper.findById(existingToken.getUserId())
			.orElseThrow(() -> new BusinessException("Account not found for refresh token"));
		String subject = user.getEmail() != null ? user.getEmail() : user.getPhoneNumber();
		Long userPk = user.getId();
		if (userPk == null) {
			throw new BusinessException("Account data is invalid");
		}
		String accessToken = jwtTokenProvider.generateAccessToken(subject, userPk, existingToken.getUserUid());
		long accessTtl = jwtTokenProvider.getAccessTokenTtlSeconds();
		String newRefreshToken = jwtTokenProvider.generateRefreshToken(subject, userPk, existingToken.getUserUid());
		long refreshTtl = jwtTokenProvider.getRefreshTokenTtlSeconds();
		persistRefreshToken(user, existingToken.getUserUid(), newRefreshToken, refreshTtl);
		return new AuthTokenResponse(accessToken, accessTtl, newRefreshToken, refreshTtl);
	}

	private void validateRegisterRequest(RegisterRequest request) {
		if (request == null) {
			throw new BusinessException("Register request cannot be null");
		}

		String phoneNumber = normalize(request.phoneNumber());
		String email = normalize(request.email());
		String displayName = normalize(request.displayName());
		String password = request.password();
		if (log.isDebugEnabled()) {
			log.debug("Validating registration for email: {}, phone: {}, displayName: {}", email, phoneNumber, displayName);
		}
		if (phoneNumber == null) {
			throw new BusinessException("Phone number is required");
		}

		if (!PHONE_PATTERN.matcher(phoneNumber).matches()) {
			throw new BusinessException("Invalid phone number format");
		}

		if (email != null && !EMAIL_PATTERN.matcher(email).matches()) {
			throw new BusinessException("Invalid email format");
		}

		if (password == null || password.isBlank()) {
			throw new BusinessException("Password cannot be empty");
		}

		if (password.length() < MIN_PASSWORD_LENGTH) {
			throw new BusinessException("Password must be at least %d characters long".formatted(MIN_PASSWORD_LENGTH));
		}

		if (displayName != null && displayName.length() > MAX_DISPLAY_NAME_LENGTH) {
			throw new BusinessException("Display name must be at most %d characters".formatted(MAX_DISPLAY_NAME_LENGTH));
		}
	}

	private String normalize(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}
}
